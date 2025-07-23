-- Update the get_system_analytics function to use user_logs for activity tracking
CREATE OR REPLACE FUNCTION public.get_system_analytics(days_back integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  user_growth_data JSON;
  activity_heatmap_data JSON;
  top_courses_data JSON;
BEGIN
  -- Apenas admins podem acessar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- User growth data
  SELECT COALESCE(json_agg(
    json_build_object(
      'date', signup_date,
      'new_users', new_users,
      'total_users', total_users
    ) ORDER BY signup_date
  ), '[]'::json) INTO user_growth_data
  FROM (
    SELECT 
      DATE(created_at) as signup_date,
      COUNT(*) as new_users,
      SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
    FROM profiles 
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  ) signup_stats;

  -- Activity heatmap (using user_logs for real-time activity tracking)
  SELECT COALESCE(json_object_agg(
    hour_of_day::text,
    activity_count
  ), '{}'::json) INTO activity_heatmap_data
  FROM (
    SELECT 
      EXTRACT(hour FROM created_at)::integer as hour_of_day,
      COUNT(*) as activity_count
    FROM user_logs
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY EXTRACT(hour FROM created_at)
    ORDER BY hour_of_day
  ) hourly_stats;

  -- Top courses
  SELECT COALESCE(json_agg(
    json_build_object(
      'course', course,
      'user_count', user_count
    ) ORDER BY user_count DESC
  ), '[]'::json) INTO top_courses_data
  FROM (
    SELECT 
      course, 
      COUNT(*) as user_count
    FROM profiles
    WHERE course IS NOT NULL AND course != ''
    GROUP BY course
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) course_stats;

  -- Build final result
  SELECT json_build_object(
    'user_growth', user_growth_data,
    'activity_heatmap', activity_heatmap_data,
    'top_courses', top_courses_data
  ) INTO result;

  RETURN result;
END;
$function$;