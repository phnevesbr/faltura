-- Atualizar função para incluir avatar do perfil no ranking
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_profiles(limit_count integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, level integer, total_experience integer, current_tier text, email text, course text, avatar text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ul.user_id,
    ul.level,
    ul.total_experience,
    ul.current_tier,
    p.email,
    p.course,
    p.avatar
  FROM user_levels ul
  LEFT JOIN profiles p ON ul.user_id = p.user_id
  ORDER BY ul.total_experience DESC
  LIMIT limit_count;
END;
$function$;