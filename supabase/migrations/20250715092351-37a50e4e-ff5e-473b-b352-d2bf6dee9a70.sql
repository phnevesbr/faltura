-- Corrigir função get_system_analytics
CREATE OR REPLACE FUNCTION public.get_system_analytics(days_back integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  interval_days TEXT;
BEGIN
  -- Only admins can access this
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Convert days_back to interval string
  interval_days := days_back || ' days';

  SELECT json_build_object(
    'user_growth', (
      SELECT json_agg(
        json_build_object(
          'date', day::date,
          'new_users', COALESCE(new_users, 0),
          'total_users', COALESCE(total_users, 0)
        ) ORDER BY day
      )
      FROM (
        SELECT 
          generate_series(
            CURRENT_DATE - (interval_days)::interval, 
            CURRENT_DATE, 
            INTERVAL '1 day'
          )::date as day
      ) dates
      LEFT JOIN (
        SELECT 
          created_at::date as signup_date,
          COUNT(*) as new_users,
          SUM(COUNT(*)) OVER (ORDER BY created_at::date) as total_users
        FROM profiles 
        WHERE created_at >= CURRENT_DATE - (interval_days)::interval
        GROUP BY created_at::date
      ) signups ON dates.day = signups.signup_date
    ),
    'activity_heatmap', (
      SELECT json_object_agg(
        EXTRACT(hour FROM created_at)::text,
        activity_count
      )
      FROM (
        SELECT 
          EXTRACT(hour FROM created_at) as hour,
          COUNT(*) as activity_count
        FROM achievement_tracking
        WHERE created_at >= CURRENT_DATE - (interval_days)::interval
        GROUP BY EXTRACT(hour FROM created_at)
      ) hourly_activity
    ),
    'top_courses', (
      SELECT json_agg(
        json_build_object(
          'course', course,
          'user_count', user_count
        ) ORDER BY user_count DESC
      ) 
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