-- Corrigir a função check_rate_limit para usar a estrutura correta do setting_value
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_action_type text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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