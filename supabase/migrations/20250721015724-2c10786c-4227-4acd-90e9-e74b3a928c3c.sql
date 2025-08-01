-- Adicionar configuração para incluir domingo no sistema
INSERT INTO public.system_settings (setting_key, setting_value, category, description, editable_by)
VALUES (
  'include_sunday_schedule',
  '{"enabled": true, "value": false}',
  'schedule',
  'Permite ativar ou desativar a exibição do domingo na grade horária',
  ARRAY['super_admin', 'admin']
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();