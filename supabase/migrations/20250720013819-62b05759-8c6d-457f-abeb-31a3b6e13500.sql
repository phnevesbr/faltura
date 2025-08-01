-- Corrigir todas as functions com search_path inseguro
-- Recriando functions com SECURITY DEFINER e SET search_path

-- 1. get_user_rank function
CREATE OR REPLACE FUNCTION public.get_user_rank(target_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT rank_position::integer
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_experience DESC) as rank_position
    FROM public.user_levels
  ) ranked_users
  WHERE user_id = target_user_id;
$function$;

-- 2. is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT 
    CASE 
      WHEN user_id IS NULL THEN false
      ELSE 
        public.check_user_admin_status(user_id) 
        OR public.is_bootstrap_admin((
          SELECT email FROM public.profiles 
          WHERE profiles.user_id = $1
        ))
    END;
$function$;

-- 3. get_leaderboard_with_profiles function
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_profiles(limit_count integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, level integer, total_experience integer, current_tier text, email text, course text, avatar text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ul.user_id,
    ul.level,
    ul.total_experience,
    ul.current_tier,
    p.email,
    p.course,
    p.avatar
  FROM user_levels ul
  LEFT JOIN profiles p ON ul.user_id = p.user_id
  ORDER BY ul.total_experience DESC
  LIMIT limit_count;
END;
$function$;

-- 4. get_user_statistics function
CREATE OR REPLACE FUNCTION public.get_user_statistics()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  result JSON;
BEGIN
  -- Only admins can access this
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users_today', (SELECT COUNT(DISTINCT user_id) FROM achievement_tracking WHERE date_tracked = CURRENT_DATE),
    'total_classes', (SELECT COUNT(*) FROM classes),
    'total_subjects', (SELECT COUNT(*) FROM subjects),
    'total_absences', (SELECT COUNT(*) FROM absences),
    'total_notes', (SELECT COUNT(*) FROM notes),
    'banned_users', (SELECT COUNT(*) FROM user_bans WHERE is_active = true),
    'users_by_tier', (
      SELECT json_object_agg(current_tier, user_count)
      FROM (
        SELECT current_tier, COUNT(*) as user_count
        FROM user_levels
        GROUP BY current_tier
      ) tier_stats
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- 5. log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only log if user is admin
  IF public.is_admin(auth.uid()) THEN
    INSERT INTO public.admin_logs (
      admin_user_id,
      action,
      target_type,
      target_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 6. check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_action_type text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  limit_config RECORD;
  current_attempts INTEGER := 0;
  window_start_time TIMESTAMP WITH TIME ZONE;
  window_end_time TIMESTAMP WITH TIME ZONE;
  remaining_time INTEGER;
BEGIN
  -- Buscar configuração do rate limit
  SELECT setting_value INTO limit_config
  FROM system_settings 
  WHERE setting_key = 'rate_limit_' || p_action_type;
  
  -- Se não encontrou configuração, permitir ação
  IF limit_config IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Calcular janela de tempo
  window_end_time := now();
  window_start_time := window_end_time - INTERVAL '1 minute' * (limit_config.setting_value->>'window_minutes')::INTEGER;
  
  -- Contar tentativas na janela de tempo
  SELECT COUNT(*) INTO current_attempts
  FROM rate_limits
  WHERE action_type = p_action_type
    AND created_at BETWEEN window_start_time AND window_end_time
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
    );
  
  -- Verificar se excedeu o limite
  IF current_attempts >= (limit_config.setting_value->>'limit')::INTEGER THEN
    -- Calcular tempo restante em minutos
    SELECT EXTRACT(EPOCH FROM (window_start_time + INTERVAL '1 minute' * (limit_config.setting_value->>'window_minutes')::INTEGER - now()))/60 
    INTO remaining_time;
    
    -- Lançar erro personalizado com tempo restante
    RAISE EXCEPTION 'Rate limit excedido para %. Limite: % ações a cada % minutos. Tente novamente em % minutos.', 
      p_action_type, 
      (limit_config.setting_value->>'limit')::INTEGER,
      (limit_config.setting_value->>'window_minutes')::INTEGER,
      GREATEST(1, remaining_time);
  END IF;
  
  -- Registrar tentativa atual
  INSERT INTO rate_limits (user_id, ip_address, action_type, window_start, window_end)
  VALUES (p_user_id, p_ip_address, p_action_type, window_start_time, window_end_time);
  
  RETURN TRUE;
END;
$function$;

-- 7. reset_user_rankings function
CREATE OR REPLACE FUNCTION public.reset_user_rankings()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  affected_users INTEGER;
BEGIN
  -- Verificar se usuário é admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem resetar rankings.';
  END IF;
  
  -- Reset dos níveis de usuários com WHERE clause para evitar erro
  UPDATE user_levels 
  SET 
    level = 1,
    experience_points = 0,
    total_experience = 0,
    current_tier = 'calouro',
    level_progress = 0.0,
    updated_at = now()
  WHERE user_id IS NOT NULL;
  
  GET DIAGNOSTICS affected_users = ROW_COUNT;
  
  -- Log da ação
  INSERT INTO admin_logs (admin_user_id, action, target_type, new_data)
  VALUES (auth.uid(), 'RANKING_RESET', 'user_levels', 
          json_build_object('affected_users', affected_users, 'timestamp', now()));
  
  RETURN affected_users;
END;
$function$;

-- 8. is_bootstrap_admin function
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  -- Bootstrap check for initial admin setup
  SELECT user_email = 'suport154@gmail.com';
$function$;

-- 9. check_user_admin_status function
CREATE OR REPLACE FUNCTION public.check_user_admin_status(check_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = check_user_id 
    AND role IN ('super_admin', 'admin', 'moderator') 
    AND revoked_at IS NULL
  );
$function$;

-- 10. is_super_admin_safe function
CREATE OR REPLACE FUNCTION public.is_super_admin_safe(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE admin_roles.user_id = $1 
    AND role = 'super_admin' 
    AND revoked_at IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 
    AND email = 'suport154@gmail.com'
  );
$function$;

-- 11. get_user_logs function
CREATE OR REPLACE FUNCTION public.get_user_logs(limit_count integer DEFAULT 100, offset_count integer DEFAULT 0, filter_user_id uuid DEFAULT NULL::uuid, filter_action text DEFAULT NULL::text, filter_entity_type text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, user_id uuid, user_email text, action text, entity_type text, entity_id uuid, details jsonb, ip_address inet, user_agent text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    ul.id,
    ul.user_id,
    p.email as user_email,
    ul.action,
    ul.entity_type,
    ul.entity_id,
    ul.details,
    ul.ip_address,
    ul.user_agent,
    ul.created_at
  FROM public.user_logs ul
  LEFT JOIN public.profiles p ON ul.user_id = p.user_id
  WHERE 
    (filter_user_id IS NULL OR ul.user_id = filter_user_id)
    AND (filter_action IS NULL OR ul.action = filter_action)
    AND (filter_entity_type IS NULL OR ul.entity_type = filter_entity_type)
  ORDER BY ul.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- 12. log_subject_action function
CREATE OR REPLACE FUNCTION public.log_subject_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_action(NEW.user_id, 'subject_created', 'subjects', NEW.id, json_build_object('name', NEW.name, 'color', NEW.color)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_user_action(NEW.user_id, 'subject_updated', 'subjects', NEW.id, json_build_object('old_name', OLD.name, 'new_name', NEW.name)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_action(OLD.user_id, 'subject_deleted', 'subjects', OLD.id, json_build_object('name', OLD.name)::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 13. log_user_action function
CREATE OR REPLACE FUNCTION public.log_user_action(user_id uuid, action text, entity_type text, entity_id uuid DEFAULT NULL::uuid, details jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_logs (user_id, action, entity_type, entity_id, details)
  VALUES (user_id, action, entity_type, entity_id, details);
EXCEPTION
  WHEN others THEN
    -- Apenas ignora erros para não bloquear as operações principais
    NULL;
END;
$function$;

-- 14. log_note_action function
CREATE OR REPLACE FUNCTION public.log_note_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_action(NEW.user_id, 'note_created', 'notes', NEW.id, json_build_object('title', NEW.title, 'type', NEW.type)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_user_action(NEW.user_id, 'note_updated', 'notes', NEW.id, json_build_object('title', NEW.title, 'completed', NEW.completed)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_action(OLD.user_id, 'note_deleted', 'notes', OLD.id, json_build_object('title', OLD.title)::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 15. log_absence_action function
CREATE OR REPLACE FUNCTION public.log_absence_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_action(NEW.user_id, 'absence_created', 'absences', NEW.id, json_build_object('date', NEW.date)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_action(OLD.user_id, 'absence_deleted', 'absences', OLD.id, json_build_object('date', OLD.date)::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 16. get_system_analytics function
CREATE OR REPLACE FUNCTION public.get_system_analytics(days_back integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  result JSON;
  user_growth_data JSON;
  activity_heatmap_data JSON;
  top_courses_data JSON;
BEGIN
  -- Apenas admins podem acessar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- User growth data (converting to São Paulo time UTC-3)
  SELECT COALESCE(json_agg(
    json_build_object(
      'date', signup_date,
      'new_users', new_users,
      'total_users', total_users
    ) ORDER BY signup_date
  ), '[]'::json) INTO user_growth_data
  FROM (
    SELECT 
      DATE(created_at - INTERVAL '3 hours') as signup_date,
      COUNT(*) as new_users,
      SUM(COUNT(*)) OVER (ORDER BY DATE(created_at - INTERVAL '3 hours')) as total_users
    FROM profiles 
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY DATE(created_at - INTERVAL '3 hours')
    ORDER BY DATE(created_at - INTERVAL '3 hours')
  ) signup_stats;

  -- Activity heatmap (using user_logs for real-time activity tracking with São Paulo timezone UTC-3)
  SELECT COALESCE(json_object_agg(
    hour_of_day::text,
    activity_count
  ), '{}'::json) INTO activity_heatmap_data
  FROM (
    SELECT 
      EXTRACT(hour FROM (created_at - INTERVAL '3 hours'))::integer as hour_of_day,
      COUNT(*) as activity_count
    FROM user_logs
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY EXTRACT(hour FROM (created_at - INTERVAL '3 hours'))
    ORDER BY hour_of_day
  ) hourly_stats;

  -- Top courses
  SELECT COALESCE(json_agg(
    json_build_object(
      'course', course,
      'user_count', user_count
    ) ORDER BY user_count DESC
  ), '[]'::json) INTO top_courses_data
  FROM (
    SELECT 
      course, 
      COUNT(*) as user_count
    FROM profiles
    WHERE course IS NOT NULL AND course != ''
    GROUP BY course
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) course_stats;

  -- Build final result
  SELECT json_build_object(
    'user_growth', user_growth_data,
    'activity_heatmap', activity_heatmap_data,
    'top_courses', top_courses_data
  ) INTO result;

  RETURN result;
END;
$function$;

-- Funções trigger system e limit check
CREATE OR REPLACE FUNCTION public.check_subject_limit_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_subjects_limit';
  
  -- Se não encontrou configuração, usar padrão de 10
  IF max_limit IS NULL THEN
    max_limit := 10;
  END IF;
  
  -- Contar matérias atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM subjects 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de matérias excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_notes_limit_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_tasks_limit';
  
  -- Se não encontrou configuração, usar padrão de 50
  IF max_limit IS NULL THEN
    max_limit := 50;
  END IF;
  
  -- Contar tarefas atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM notes 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de tarefas excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_class_membership_limit_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_class_memberships';
  
  -- Se não encontrou configuração, usar padrão de 5
  IF max_limit IS NULL THEN
    max_limit := 5;
  END IF;
  
  -- Contar participações atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM class_members 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de participação em turmas excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_class_leadership_limit_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_class_leadership';
  
  -- Se não encontrou configuração, usar padrão de 2
  IF max_limit IS NULL THEN
    max_limit := 2;
  END IF;
  
  -- Contar turmas lideradas pelo usuário
  SELECT COUNT(*) INTO current_count
  FROM classes 
  WHERE leader_id = NEW.leader_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de liderança de turmas excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_time_slots_limit_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_time_slots';
  
  -- Se não encontrou configuração, usar padrão de 12
  IF max_limit IS NULL THEN
    max_limit := 12;
  END IF;
  
  -- Contar time slots atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM user_time_slots 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de horários excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Funções básicas do sistema
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, course, university, shift, semester_start, semester_end)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'course', ''),
    '',
    'morning',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '4 months'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_class_member_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM public.class_members 
    WHERE class_id = NEW.class_id
  ) >= (
    SELECT max_members 
    FROM public.classes 
    WHERE id = NEW.class_id
  ) THEN
    RAISE EXCEPTION 'Turma já atingiu o limite máximo de membros';
  END IF;
  RETURN NEW;
END;
$function$;

-- Funções de verificação de acesso
CREATE OR REPLACE FUNCTION public.is_class_leader(class_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = class_id AND leader_id = user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_class_member(class_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE class_id = $1 AND user_id = $2
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_pending_invite(class_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_invites ci
    LEFT JOIN public.profiles p ON p.email = ci.invitee_email
    WHERE ci.class_id = $1 
    AND ci.status IN ('pending', 'accepted')
    AND (ci.invitee_id = $2 OR p.user_id = $2)
  );
$function$;

-- Funções de notificação de ausência
CREATE OR REPLACE FUNCTION public.auto_create_absence_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  subject_names TEXT[];
BEGIN
  -- Inserir notificação de falta para cada turma que o usuário pertence
  INSERT INTO public.absence_notifications (class_id, user_id, absence_date, subjects)
  SELECT 
    cm.class_id,
    NEW.user_id,
    NEW.date,
    ARRAY[]::TEXT[]
  FROM public.class_members cm
  WHERE cm.user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_absence_notification_subjects()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  subject_names TEXT[];
  absence_user_id UUID;
  abs_date DATE;
BEGIN
  -- Buscar informações da ausência
  SELECT user_id, date INTO absence_user_id, abs_date
  FROM public.absences 
  WHERE id = NEW.absence_id;
  
  -- Buscar todos os nomes das matérias para esta ausência
  SELECT ARRAY(
    SELECT s.name 
    FROM public.subjects s
    JOIN public.absence_subjects abs ON abs.subject_id = s.id
    WHERE abs.absence_id = NEW.absence_id
    ORDER BY s.name
  ) INTO subject_names;
  
  -- Atualizar as notificações existentes com as matérias corretas
  UPDATE public.absence_notifications
  SET subjects = subject_names
  WHERE user_id = absence_user_id 
  AND absence_date = abs_date;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_old_absence_notifications(class_id_param uuid, days_old integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Apenas o líder da turma pode limpar notificações
  IF NOT EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id_param AND leader_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Apenas o líder da turma pode limpar notificações';
  END IF;

  -- Deletar notificações mais antigas que X dias (corrigir sintaxe)
  DELETE FROM absence_notifications 
  WHERE class_id = class_id_param 
  AND created_at < (CURRENT_TIMESTAMP - (days_old || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_all_absence_notifications(class_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Apenas o líder da turma pode limpar notificações
  IF NOT EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id_param AND leader_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Apenas o líder da turma pode limpar notificações';
  END IF;

  -- Deletar TODAS as notificações da turma
  DELETE FROM absence_notifications 
  WHERE class_id = class_id_param;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_accepted_invite(class_id_param uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM class_invites ci
    LEFT JOIN profiles p ON p.email = ci.invitee_email
    WHERE ci.class_id = class_id_param 
    AND ci.status = 'accepted'
    AND (ci.invitee_id = auth.uid() OR p.user_id = auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_can_access_class(class_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Verifica se o usuário é líder da turma OU se já é membro
  RETURN EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id_param AND leader_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM class_members 
    WHERE class_id = class_id_param AND user_id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_class_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT ARRAY(
    SELECT class_id 
    FROM class_members 
    WHERE user_id = auth.uid()
  );
$function$;

-- Funções de gamificação
CREATE OR REPLACE FUNCTION public.update_user_level(user_id_param uuid, xp_gained integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_data RECORD;
  level_data JSON;
  old_level INTEGER;
  new_level INTEGER;
BEGIN
  -- Buscar dados atuais
  SELECT * INTO current_data
  FROM public.user_levels
  WHERE user_id = user_id_param;
  
  -- Se não existe, criar registro inicial
  IF NOT FOUND THEN
    INSERT INTO public.user_levels (user_id, experience_points, total_experience)
    VALUES (user_id_param, xp_gained, xp_gained);
    
    SELECT * INTO current_data
    FROM public.user_levels
    WHERE user_id = user_id_param;
  ELSE
    -- Atualizar XP
    UPDATE public.user_levels
    SET 
      experience_points = experience_points + xp_gained,
      total_experience = total_experience + xp_gained,
      updated_at = now()
    WHERE user_id = user_id_param;
    
    SELECT * INTO current_data
    FROM public.user_levels
    WHERE user_id = user_id_param;
  END IF;
  
  old_level := current_data.level;
  
  -- Calcular novo nível
  level_data := calculate_level(current_data.total_experience);
  new_level := (level_data->>'level')::INTEGER;
  
  -- Atualizar nível se mudou
  IF new_level != old_level THEN
    UPDATE public.user_levels
    SET 
      level = new_level,
      current_tier = level_data->>'tier',
      level_progress = (level_data->>'progress')::DECIMAL(5,2),
      updated_at = now()
    WHERE user_id = user_id_param;
  END IF;
  
  RETURN json_build_object(
    'old_level', old_level,
    'new_level', new_level,
    'level_up', new_level > old_level,
    'total_xp', current_data.total_experience + xp_gained,
    'tier', level_data->>'tier'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_level(total_xp integer)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  level_record RECORD;
  current_level INTEGER := 1;
  current_tier TEXT := 'aprendiz';
  xp_for_current_level INTEGER := 0;
  xp_for_next_level INTEGER := 100;
  progress DECIMAL(5,2) := 0;
BEGIN
  -- Buscar o nível correto baseado na tabela level_config
  SELECT level_number, tier, xp_required 
  INTO level_record
  FROM level_config 
  WHERE xp_required <= total_xp 
  ORDER BY xp_required DESC 
  LIMIT 1;
  
  -- Se encontrou um nível, usar os dados da tabela
  IF level_record IS NOT NULL THEN
    current_level := level_record.level_number;
    current_tier := level_record.tier;
    xp_for_current_level := level_record.xp_required;
    
    -- Buscar o próximo nível para calcular progresso
    SELECT xp_required INTO xp_for_next_level
    FROM level_config 
    WHERE level_number = current_level + 1;
    
    -- Se não há próximo nível, usar o XP atual + 1000
    IF xp_for_next_level IS NULL THEN
      xp_for_next_level := total_xp + 1000;
    END IF;
  ELSE
    -- Fallback para nível 1 se não encontrou nada
    SELECT level_number, tier, xp_required 
    INTO level_record
    FROM level_config 
    WHERE level_number = 1
    LIMIT 1;
    
    IF level_record IS NOT NULL THEN
      current_level := level_record.level_number;
      current_tier := level_record.tier;
      xp_for_current_level := 0;
      xp_for_next_level := level_record.xp_required;
    END IF;
  END IF;
  
  -- Calcular progresso
  IF xp_for_next_level > xp_for_current_level THEN
    progress := ((total_xp - xp_for_current_level)::DECIMAL / (xp_for_next_level - xp_for_current_level)::DECIMAL) * 100;
  ELSE
    progress := 100.0;
  END IF;
  
  RETURN json_build_object(
    'level', current_level,
    'tier', current_tier,
    'progress', LEAST(100.0, GREATEST(0.0, progress)),
    'xp_for_current_level', xp_for_current_level,
    'xp_for_next_level', xp_for_next_level
  );
END;
$function$;

-- Criar constraint única para resolver problema de duplicação de achievements
DROP INDEX IF EXISTS user_achievements_user_id_achievement_id_key;
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_achievement_id_key;
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_achievement_id_unique UNIQUE (user_id, achievement_id);

-- Remover duplicatas existentes (manter apenas a mais recente)
DELETE FROM user_achievements a 
USING user_achievements b 
WHERE a.id > b.id 
AND a.user_id = b.user_id 
AND a.achievement_id = b.achievement_id;