-- Create function to get leaderboard with profiles
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_profiles(limit_count integer DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  level integer,
  total_experience integer,
  current_tier text,
  email text,
  course text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.user_id,
    ul.level,
    ul.total_experience,
    ul.current_tier,
    p.email,
    p.course
  FROM user_levels ul
  LEFT JOIN profiles p ON ul.user_id = p.user_id
  ORDER BY ul.total_experience DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;