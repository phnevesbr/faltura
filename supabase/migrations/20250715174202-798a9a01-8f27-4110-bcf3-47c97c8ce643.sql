-- Criar tabela de logs de usuários
CREATE TABLE public.user_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios logs
CREATE POLICY "Users can view their own logs"
ON public.user_logs FOR SELECT
USING (user_id = auth.uid());

-- Política para admins verem todos os logs
CREATE POLICY "Admins can view all logs"
ON public.user_logs FOR SELECT
USING (is_admin(auth.uid()));

-- Política para inserção de logs
CREATE POLICY "Allow log insertion"
ON public.user_logs FOR INSERT
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX idx_user_logs_user_id ON public.user_logs (user_id);
CREATE INDEX idx_user_logs_action ON public.user_logs (action);
CREATE INDEX idx_user_logs_created_at ON public.user_logs (created_at);
CREATE INDEX idx_user_logs_entity_type ON public.user_logs (entity_type);

-- Função para inserir logs automaticamente
CREATE OR REPLACE FUNCTION public.log_user_action(
  user_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID DEFAULT NULL,
  details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_logs (user_id, action, entity_type, entity_id, details)
  VALUES (user_id, action, entity_type, entity_id, details);
END;
$$;

-- Trigger para logar ações em subjects
CREATE OR REPLACE FUNCTION public.log_subject_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_action(NEW.user_id, 'subject_created', 'subjects', NEW.id, json_build_object('name', NEW.name, 'color', NEW.color));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_user_action(NEW.user_id, 'subject_updated', 'subjects', NEW.id, json_build_object('old_name', OLD.name, 'new_name', NEW.name));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_user_action(OLD.user_id, 'subject_deleted', 'subjects', OLD.id, json_build_object('name', OLD.name));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para logar ações em notes
CREATE OR REPLACE FUNCTION public.log_note_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_action(NEW.user_id, 'note_created', 'notes', NEW.id, json_build_object('title', NEW.title, 'type', NEW.type));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_user_action(NEW.user_id, 'note_updated', 'notes', NEW.id, json_build_object('title', NEW.title, 'completed', NEW.completed));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_user_action(OLD.user_id, 'note_deleted', 'notes', OLD.id, json_build_object('title', OLD.title));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para logar ações em absences
CREATE OR REPLACE FUNCTION public.log_absence_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_action(NEW.user_id, 'absence_created', 'absences', NEW.id, json_build_object('date', NEW.date));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_user_action(OLD.user_id, 'absence_deleted', 'absences', OLD.id, json_build_object('date', OLD.date));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar triggers
DROP TRIGGER IF EXISTS log_subject_trigger ON public.subjects;
CREATE TRIGGER log_subject_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.log_subject_action();

DROP TRIGGER IF EXISTS log_note_trigger ON public.notes;
CREATE TRIGGER log_note_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.log_note_action();

DROP TRIGGER IF EXISTS log_absence_trigger ON public.absences;
CREATE TRIGGER log_absence_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.absences
  FOR EACH ROW EXECUTE FUNCTION public.log_absence_action();

-- Atualizar configurações do sistema com mais opções
INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('security_settings', '{"password_min_length": 8, "require_uppercase": true, "require_numbers": true, "require_symbols": false, "max_login_attempts": 5, "lockout_duration": 30}', 'Configurações de segurança de senha e login', 'security', ARRAY['super_admin']),
('backup_settings', '{"auto_backup": true, "backup_frequency": "daily", "retention_days": 30, "backup_storage": "local"}', 'Configurações de backup automático', 'system', ARRAY['super_admin']),
('api_settings', '{"rate_limit": 1000, "rate_window": 3600, "api_version": "v1", "cors_enabled": true}', 'Configurações da API', 'system', ARRAY['super_admin']),
('email_settings', '{"smtp_enabled": false, "smtp_host": "", "smtp_port": 587, "smtp_user": "", "from_email": "noreply@faltura.com", "from_name": "FALTURA"}', 'Configurações de email SMTP', 'notifications', ARRAY['super_admin', 'admin']),
('theme_settings', '{"allow_dark_mode": true, "default_theme": "light", "custom_themes": [], "theme_switching": true}', 'Configurações de tema da aplicação', 'general', ARRAY['super_admin', 'admin']),
('file_upload_settings', '{"max_file_size": 10485760, "allowed_types": ["image/jpeg", "image/png", "image/gif", "application/pdf"], "storage_quota": 104857600}', 'Configurações de upload de arquivos', 'system', ARRAY['super_admin']),
('analytics_settings', '{"google_analytics": "", "tracking_enabled": false, "privacy_mode": true, "cookie_consent": true}', 'Configurações de analytics e tracking', 'analytics', ARRAY['super_admin']),
('content_moderation', '{"auto_moderation": false, "profanity_filter": true, "spam_detection": true, "report_threshold": 5}', 'Configurações de moderação de conteúdo', 'security', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  editable_by = EXCLUDED.editable_by;

-- Função para obter logs de usuários para admins
CREATE OR REPLACE FUNCTION public.get_user_logs(
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0,
  filter_user_id UUID DEFAULT NULL,
  filter_action TEXT DEFAULT NULL,
  filter_entity_type TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;