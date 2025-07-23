-- Atualizar/inserir configurações do sistema usando UPSERT

-- 1. Sistema de Verificação de Identidade
INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('email_verification_required', '{"enabled": true, "value": true}', 'Obrigar verificação de email para novos usuários', 'authentication', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;

-- 2. Sistema de Ranking Competitivo
INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('ranking_titles', '{"enabled": true, "titles": [{"tier": "calouro", "min_level": 1, "max_level": 10, "title": "Calouro", "color": "#10B981"}, {"tier": "veterano", "min_level": 11, "max_level": 25, "title": "Veterano", "color": "#3B82F6"}, {"tier": "expert", "min_level": 26, "max_level": 50, "title": "Expert", "color": "#8B5CF6"}, {"tier": "lenda", "min_level": 51, "max_level": 100, "title": "Lenda", "color": "#F59E0B"}]}', 'Configuração dos títulos e níveis do ranking', 'gamification', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;

INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('ranking_max_level', '{"enabled": true, "value": 50}', 'Nível máximo permitido no sistema', 'gamification', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;

INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('ranking_reset_frequency', '{"enabled": true, "frequency": "manual", "auto_reset_date": null, "last_reset": null}', 'Frequência de reset dos rankings (manual, monthly, quarterly, yearly)', 'gamification', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;

-- 3. Controle de Limites (apenas as novas)
INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('rate_limit_login_attempts', '{"enabled": true, "limit": 6, "window_minutes": 60}', 'Limite de tentativas de login por hora', 'security', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;

INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('rate_limit_account_creation', '{"enabled": true, "limit": 3, "window_minutes": 1440}', 'Limite de contas criadas por dia (1440 min = 24h)', 'security', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;

INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('rate_limit_import_grade', '{"enabled": true, "limit": 2, "window_minutes": 1440}', 'Limite de importações de grade por dia', 'security', ARRAY['super_admin', 'admin'])
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;