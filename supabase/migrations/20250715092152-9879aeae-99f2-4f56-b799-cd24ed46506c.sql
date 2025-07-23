-- Inserir configurações padrão do sistema se não existirem
INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by)
VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção. Tente novamente em alguns minutos."}', 'Configurações do modo de manutenção', 'system', ARRAY['super_admin']),
  ('registration_enabled', '{"enabled": true}', 'Controle se novos usuários podem se registrar', 'auth', ARRAY['super_admin', 'admin']),
  ('notification_settings', '{"email_enabled": true, "push_enabled": true}', 'Configurações globais de notificações', 'notifications', ARRAY['super_admin', 'admin']),
  ('max_absence_limit', '{"value": 25}', 'Limite máximo de faltas por padrão', 'academic', ARRAY['super_admin', 'admin']),
  ('upload_size_limit', '{"value": 5}', 'Limite de tamanho de upload em MB', 'system', ARRAY['super_admin']),
  ('achievement_multiplier', '{"value": 1.0}', 'Multiplicador de XP para conquistas', 'gamification', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO NOTHING;