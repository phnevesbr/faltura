-- Atualizar a função calculate_level para usar os novos tier IDs
CREATE OR REPLACE FUNCTION public.calculate_level(total_xp integer)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  level INTEGER;
  tier TEXT;
  xp_for_current_level INTEGER;
  xp_for_next_level INTEGER;
  progress DECIMAL(5,2);
BEGIN
  -- Calcular nível baseado em XP
  IF total_xp < 1000 THEN
    level := LEAST(10, GREATEST(1, (total_xp / 100) + 1));
    tier := 'aprendiz';
  ELSIF total_xp < 2675 THEN
    level := LEAST(20, GREATEST(11, ((total_xp - 1000) / 167) + 11));
    tier := 'confiavel';
  ELSIF total_xp < 6675 THEN
    level := LEAST(30, GREATEST(21, ((total_xp - 2675) / 400) + 21));
    tier := 'exemplar';
  ELSIF total_xp < 10675 THEN
    level := LEAST(40, GREATEST(31, ((total_xp - 6675) / 400) + 31));
    tier := 'veterano';
  ELSIF total_xp < 14675 THEN
    level := LEAST(50, GREATEST(41, ((total_xp - 10675) / 400) + 41));
    tier := 'mestre';
  ELSE
    level := LEAST(60, GREATEST(51, ((total_xp - 14675) / 400) + 51));
    tier := 'lenda';
  END IF;
  
  -- Calcular XP necessário para níveis atual e próximo
  IF level <= 10 THEN
    xp_for_current_level := (level - 1) * 100;
    xp_for_next_level := level * 100;
  ELSIF level <= 20 THEN
    xp_for_current_level := 1000 + (level - 11) * 167;
    xp_for_next_level := 1000 + (level - 10) * 167;
  ELSIF level <= 30 THEN
    xp_for_current_level := 2675 + (level - 21) * 400;
    xp_for_next_level := 2675 + (level - 20) * 400;
  ELSIF level <= 40 THEN
    xp_for_current_level := 6675 + (level - 31) * 400;
    xp_for_next_level := 6675 + (level - 30) * 400;
  ELSIF level <= 50 THEN
    xp_for_current_level := 10675 + (level - 41) * 400;
    xp_for_next_level := 10675 + (level - 40) * 400;
  ELSE
    xp_for_current_level := 14675 + (level - 51) * 400;
    xp_for_next_level := 14675 + (level - 50) * 400;
  END IF;
  
  -- Calcular progresso
  IF xp_for_next_level > xp_for_current_level THEN
    progress := ((total_xp - xp_for_current_level)::DECIMAL / (xp_for_next_level - xp_for_current_level)::DECIMAL) * 100;
  ELSE
    progress := 100.0;
  END IF;
  
  RETURN json_build_object(
    'level', level,
    'tier', tier,
    'progress', LEAST(100.0, GREATEST(0.0, progress)),
    'xp_for_current_level', xp_for_current_level,
    'xp_for_next_level', xp_for_next_level
  );
END;
$function$;