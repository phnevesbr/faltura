-- Corrigir a função get_system_analytics
CREATE OR REPLACE FUNCTION public.get_system_analytics(days_back integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  -- Apenas admins podem acessar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT json_build_object(
    'user_growth', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'date', day::date,
          'new_users', COALESCE(new_users, 0),
          'total_users', COALESCE(total_users, 0)
        ) ORDER BY day
      ), '[]'::json)
      FROM (
        SELECT 
          generate_series(
            CURRENT_DATE - (days_back || ' days')::interval, 
            CURRENT_DATE, 
            INTERVAL '1 day'
          )::date as day
      ) dates
      LEFT JOIN (
        SELECT 
          DATE(profiles.created_at) as signup_date,
          COUNT(*) as new_users,
          SUM(COUNT(*)) OVER (ORDER BY DATE(profiles.created_at)) as total_users
        FROM profiles 
        WHERE profiles.created_at >= CURRENT_DATE - (days_back || ' days')::interval
        GROUP BY DATE(profiles.created_at)
      ) signups ON dates.day = signups.signup_date
    ),
    'activity_heatmap', (
      SELECT COALESCE(json_object_agg(
        EXTRACT(hour FROM achievement_tracking.created_at)::text,
        activity_count
      ), '{}'::json)
      FROM (
        SELECT 
          EXTRACT(hour FROM achievement_tracking.created_at) as hour,
          COUNT(*) as activity_count
        FROM achievement_tracking
        WHERE achievement_tracking.created_at >= CURRENT_DATE - (days_back || ' days')::interval
        GROUP BY EXTRACT(hour FROM achievement_tracking.created_at)
      ) hourly_activity
    ),
    'top_courses', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'course', course,
          'user_count', user_count
        ) ORDER BY user_count DESC
      ), '[]'::json) 
      FROM (
        SELECT course, COUNT(*) as user_count
        FROM profiles
        WHERE course IS NOT NULL AND course != ''
        GROUP BY course
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) course_stats
    )
  ) INTO result;

  RETURN result;
END;
$function$;