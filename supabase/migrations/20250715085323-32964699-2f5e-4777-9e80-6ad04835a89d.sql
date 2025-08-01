-- Create admin roles table
CREATE TABLE public.admin_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB NOT NULL DEFAULT '{"user_management": false, "class_management": true, "analytics": true, "system_config": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Admin roles policies
CREATE POLICY "Super admins can manage all admin roles"
ON public.admin_roles
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin' AND ar.revoked_at IS NULL
));

CREATE POLICY "Admins can view admin roles"
ON public.admin_roles
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid() AND ar.role IN ('super_admin', 'admin') AND ar.revoked_at IS NULL
));

-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  editable_by TEXT[] NOT NULL DEFAULT ARRAY['super_admin'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- System settings policies
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid() AND ar.role IN ('super_admin', 'admin') AND ar.revoked_at IS NULL
));

CREATE POLICY "Super admins can manage system settings"
ON public.system_settings
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin' AND ar.revoked_at IS NULL
));

-- Create admin logs table for audit trail
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'class', 'system', 'achievement', etc.
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin logs policies
CREATE POLICY "Admins can view admin logs"
ON public.admin_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid() AND ar.role IN ('super_admin', 'admin') AND ar.revoked_at IS NULL
));

CREATE POLICY "Admins can create admin logs"
ON public.admin_logs
FOR INSERT
WITH CHECK (admin_user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid() AND ar.revoked_at IS NULL
));

-- Create user bans table
CREATE TABLE public.user_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- User bans policies
CREATE POLICY "Admins can manage user bans"
ON public.user_bans
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.uid() AND ar.role IN ('super_admin', 'admin') AND ar.revoked_at IS NULL
));

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description, category) VALUES
('max_absence_limit', '{"value": 15}', 'Maximum number of absences allowed per subject', 'academic'),
('upload_size_limit', '{"value": 10485760}', 'Maximum upload size in bytes (10MB)', 'system'),
('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção"}', 'Maintenance mode settings', 'system'),
('registration_enabled', '{"enabled": true}', 'Whether new user registration is enabled', 'auth'),
('achievement_multiplier', '{"value": 1.0}', 'XP multiplier for achievements', 'gamification'),
('notification_settings', '{"email_enabled": true, "push_enabled": false}', 'Global notification settings', 'notifications');

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE admin_roles.user_id = $1 
    AND role IN ('super_admin', 'admin', 'moderator') 
    AND revoked_at IS NULL
  );
$$;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only admins can access this
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users_today', (SELECT COUNT(DISTINCT user_id) FROM achievement_tracking WHERE date_tracked = CURRENT_DATE),
    'total_classes', (SELECT COUNT(*) FROM classes),
    'total_subjects', (SELECT COUNT(*) FROM subjects),
    'total_absences', (SELECT COUNT(*) FROM absences),
    'total_notes', (SELECT COUNT(*) FROM notes),
    'banned_users', (SELECT COUNT(*) FROM user_bans WHERE is_active = true),
    'users_by_tier', (
      SELECT json_object_agg(current_tier, user_count)
      FROM (
        SELECT current_tier, COUNT(*) as user_count
        FROM user_levels
        GROUP BY current_tier
      ) tier_stats
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Create function to get system analytics
CREATE OR REPLACE FUNCTION public.get_system_analytics(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only admins can access this
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

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
            CURRENT_DATE - INTERVAL '%s days', 
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
        WHERE created_at >= CURRENT_DATE - INTERVAL '%s days'
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
        WHERE created_at >= CURRENT_DATE - INTERVAL '%s days'
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
$$;

-- Add triggers for automatic admin logging
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if user is admin
  IF public.is_admin(auth.uid()) THEN
    INSERT INTO public.admin_logs (
      admin_user_id,
      action,
      target_type,
      target_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for important tables
CREATE TRIGGER log_user_bans_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_bans
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER log_admin_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

-- Create updated_at triggers
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_bans_updated_at
  BEFORE UPDATE ON public.user_bans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();