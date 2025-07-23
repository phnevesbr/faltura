-- Remove configurações que não fazem sentido para o site atual
DELETE FROM system_settings 
WHERE setting_key IN (
  'api_settings',
  'backup_settings', 
  'file_upload_settings',
  'upload_size_limit',
  'content_moderation',
  'security_settings',
  'email_settings',
  'analytics_settings'
);

-- Garantir que as configurações essenciais existam
INSERT INTO system_settings (setting_key, setting_value, description, category, editable_by) 
VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção"}', 'Modo de manutenção do sistema', 'system', ARRAY['super_admin']),
  ('registration_enabled', '{"enabled": true}', 'Permitir registro de novos usuários', 'auth', ARRAY['super_admin']),
  ('notification_settings', '{"push_enabled": true}', 'Configurações de notificações', 'notifications', ARRAY['super_admin']),
  ('max_absence_limit', '{"value": 15}', 'Limite máximo de faltas por matéria', 'academic', ARRAY['super_admin']),
  ('achievement_multiplier', '{"value": 1.0}', 'Multiplicador de experiência para conquistas', 'gamification', ARRAY['super_admin']),
  ('theme_settings', '{"allow_dark_mode": true, "default_theme": "light"}', 'Configurações de tema da aplicação', 'general', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO NOTHING;