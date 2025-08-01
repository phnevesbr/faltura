-- Remover triggers existentes primeiro
DROP TRIGGER IF EXISTS trigger_auto_create_absence_notification ON public.absences;
DROP TRIGGER IF EXISTS trigger_update_absence_notification_subjects ON public.absence_subjects;

-- Agora remover as funções
DROP FUNCTION IF EXISTS public.auto_create_absence_notification() CASCADE;
DROP FUNCTION IF EXISTS public.update_absence_notification_subjects() CASCADE;

-- Recriar a função que cria notificações de ausência sem ambiguidade
CREATE OR REPLACE FUNCTION public.auto_create_absence_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

-- Recriar a função que atualiza as matérias das notificações
CREATE OR REPLACE FUNCTION public.update_absence_notification_subjects()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

-- Recriar triggers
CREATE TRIGGER trigger_auto_create_absence_notification
  AFTER INSERT ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_absence_notification();

CREATE TRIGGER trigger_update_absence_notification_subjects
  AFTER INSERT ON public.absence_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_absence_notification_subjects();

-- Habilitar realtime para atualizações em tempo real
ALTER TABLE public.absences REPLICA IDENTITY FULL;
ALTER TABLE public.absence_subjects REPLICA IDENTITY FULL;
ALTER TABLE public.absence_notifications REPLICA IDENTITY FULL;

-- Adicionar tabelas ao publication do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.absences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_notifications;