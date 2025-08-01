-- Inserir configurações do sistema para as novas funcionalidades de admin

-- 1. Sistema de Verificação de Identidade
INSERT INTO public.system_settings (setting_key, setting_value, description, category, editable_by) VALUES
('email_verification_required', '{"enabled": true, "value": true}', 'Obrigar verificação de email para novos usuários', 'authentication', ARRAY['super_admin', 'admin']),

-- 2. Sistema de Ranking Competitivo
('ranking_titles', '{"enabled": true, "titles": [{"tier": "calouro", "min_level": 1, "max_level": 10, "title": "Calouro", "color": "#10B981"}, {"tier": "veterano", "min_level": 11, "max_level": 25, "title": "Veterano", "color": "#3B82F6"}, {"tier": "expert", "min_level": 26, "max_level": 50, "title": "Expert", "color": "#8B5CF6"}, {"tier": "lenda", "min_level": 51, "max_level": 100, "title": "Lenda", "color": "#F59E0B"}]}', 'Configuração dos títulos e níveis do ranking', 'gamification', ARRAY['super_admin', 'admin']),

('ranking_max_level', '{"enabled": true, "value": 50}', 'Nível máximo permitido no sistema', 'gamification', ARRAY['super_admin', 'admin']),

('ranking_reset_frequency', '{"enabled": true, "frequency": "manual", "auto_reset_date": null, "last_reset": null}', 'Frequência de reset dos rankings (manual, monthly, quarterly, yearly)', 'gamification', ARRAY['super_admin', 'admin']),

-- 3. Controle de Limites
('rate_limit_login_attempts', '{"enabled": true, "limit": 6, "window_minutes": 60}', 'Limite de tentativas de login por hora', 'security', ARRAY['super_admin', 'admin']),

('rate_limit_account_creation', '{"enabled": true, "limit": 3, "window_minutes": 1440}', 'Limite de contas criadas por dia (1440 min = 24h)', 'security', ARRAY['super_admin', 'admin']),

('rate_limit_import_grade', '{"enabled": true, "limit": 2, "window_minutes": 1440}', 'Limite de importações de grade por dia', 'security', ARRAY['super_admin', 'admin']),

('rate_limit_profile_edit', '{"enabled": true, "limit": 4, "window_minutes": 1440}', 'Limite de edições de perfil por dia', 'security', ARRAY['super_admin', 'admin']);

-- Criar função para automatizar reset de rankings baseado na data
CREATE OR REPLACE FUNCTION public.auto_reset_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_config RECORD;
  should_reset BOOLEAN := FALSE;
  next_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar configuração de reset
  SELECT setting_value INTO reset_config
  FROM system_settings 
  WHERE setting_key = 'ranking_reset_frequency';
  
  -- Se não encontrou configuração ou não está habilitado, sair
  IF reset_config IS NULL OR (reset_config->>'enabled')::BOOLEAN = FALSE THEN
    RETURN;
  END IF;
  
  -- Verificar se deve fazer reset baseado na frequência
  CASE reset_config->>'frequency'
    WHEN 'monthly' THEN
      should_reset := (reset_config->>'last_reset' IS NULL) 
        OR (EXTRACT(MONTH FROM now()) != EXTRACT(MONTH FROM (reset_config->>'last_reset')::TIMESTAMP WITH TIME ZONE))
        OR (EXTRACT(YEAR FROM now()) != EXTRACT(YEAR FROM (reset_config->>'last_reset')::TIMESTAMP WITH TIME ZONE));
        
    WHEN 'quarterly' THEN
      should_reset := (reset_config->>'last_reset' IS NULL) 
        OR (EXTRACT(QUARTER FROM now()) != EXTRACT(QUARTER FROM (reset_config->>'last_reset')::TIMESTAMP WITH TIME ZONE))
        OR (EXTRACT(YEAR FROM now()) != EXTRACT(YEAR FROM (reset_config->>'last_reset')::TIMESTAMP WITH TIME ZONE));
        
    WHEN 'yearly' THEN
      should_reset := (reset_config->>'last_reset' IS NULL) 
        OR (EXTRACT(YEAR FROM now()) != EXTRACT(YEAR FROM (reset_config->>'last_reset')::TIMESTAMP WITH TIME ZONE));
        
    WHEN 'custom' THEN
      should_reset := (reset_config->>'auto_reset_date' IS NOT NULL) 
        AND (now() >= (reset_config->>'auto_reset_date')::TIMESTAMP WITH TIME ZONE);
        
    ELSE
      should_reset := FALSE;
  END CASE;
  
  -- Se deve resetar, executar reset
  IF should_reset THEN
    PERFORM public.reset_user_rankings();
    
    -- Atualizar data do último reset
    UPDATE system_settings 
    SET setting_value = jsonb_set(setting_value, '{last_reset}', to_jsonb(now()::text))
    WHERE setting_key = 'ranking_reset_frequency';
    
    -- Log da ação
    INSERT INTO admin_logs (admin_user_id, action, target_type, new_data)
    VALUES (NULL, 'AUTO_RANKING_RESET', 'system', 
            json_build_object('reset_type', 'automatic', 'timestamp', now()));
  END IF;
END;
$$;

-- Criar função para validar configurações de títulos
CREATE OR REPLACE FUNCTION public.validate_ranking_titles(titles_config jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  title_item jsonb;
  prev_max_level integer := 0;
BEGIN
  -- Verificar se a configuração tem a estrutura correta
  IF NOT (titles_config ? 'titles') OR jsonb_typeof(titles_config->'titles') != 'array' THEN
    RAISE EXCEPTION 'Configuração de títulos inválida: deve conter array "titles"';
  END IF;
  
  -- Validar cada título
  FOR title_item IN SELECT * FROM jsonb_array_elements(titles_config->'titles')
  LOOP
    -- Verificar campos obrigatórios
    IF NOT (title_item ? 'tier' AND title_item ? 'min_level' AND title_item ? 'max_level' AND title_item ? 'title' AND title_item ? 'color') THEN
      RAISE EXCEPTION 'Título inválido: deve conter tier, min_level, max_level, title e color';
    END IF;
    
    -- Verificar continuidade dos níveis
    IF (title_item->>'min_level')::integer != (prev_max_level + 1) AND prev_max_level > 0 THEN
      RAISE EXCEPTION 'Níveis devem ser contínuos. Nível mínimo % não segue o máximo anterior %', 
        (title_item->>'min_level')::integer, prev_max_level;
    END IF;
    
    -- Verificar se min_level < max_level
    IF (title_item->>'min_level')::integer >= (title_item->>'max_level')::integer THEN
      RAISE EXCEPTION 'Nível mínimo deve ser menor que nível máximo para título %', title_item->>'title';
    END IF;
    
    prev_max_level := (title_item->>'max_level')::integer;
  END LOOP;
  
  RETURN TRUE;
END;
$$;