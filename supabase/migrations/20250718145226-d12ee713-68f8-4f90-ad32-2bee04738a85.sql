-- Adicionar configurações necessárias para rate limits
INSERT INTO system_settings (setting_key, setting_value, description, category, editable_by) 
VALUES 
  ('rate_limit_login_attempts', '{"enabled": true, "limit": 5, "window_minutes": 15}', 'Limite de tentativas de login por usuário', 'security', ARRAY['super_admin']),
  ('rate_limit_account_creation', '{"enabled": true, "limit": 3, "window_minutes": 60}', 'Limite de criação de contas por IP por dia', 'security', ARRAY['super_admin']),
  ('rate_limit_import_grade', '{"enabled": true, "limit": 10, "window_minutes": 60}', 'Limite de importações de grade por usuário por hora', 'academic', ARRAY['super_admin']),
  ('rate_limit_profile_edit', '{"enabled": true, "limit": 20, "window_minutes": 60}', 'Limite de edições de perfil por usuário por hora', 'academic', ARRAY['super_admin'])
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Atualizar configuração de verificação de email se já existir
UPDATE system_settings 
SET 
  setting_value = '{"enabled": true, "value": false}',
  updated_at = now()
WHERE setting_key = 'email_verification_required';

-- Se não existir, criar a configuração
INSERT INTO system_settings (setting_key, setting_value, description, category, editable_by) 
VALUES ('email_verification_required', '{"enabled": true, "value": false}', 'Verificação de email obrigatória para novos usuários', 'auth', ARRAY['super_admin'])
ON CONFLICT (setting_key) DO NOTHING;