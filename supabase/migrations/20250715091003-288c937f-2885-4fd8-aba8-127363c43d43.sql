-- Fix remaining RLS policies that might be causing admin access issues

-- Drop and recreate problematic policies on admin_logs
DROP POLICY IF EXISTS "Admins can create admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;

-- Create new non-circular policies for admin_logs
CREATE POLICY "Admins can create admin logs" 
ON public.admin_logs 
FOR INSERT 
WITH CHECK (
  admin_user_id = auth.uid() 
  AND (
    is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
    OR check_user_admin_status(auth.uid())
  )
);

CREATE POLICY "Admins can view admin logs" 
ON public.admin_logs 
FOR SELECT 
USING (
  is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
  OR check_user_admin_status(auth.uid())
);

-- Ensure system_settings policies work correctly
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can manage system settings" ON public.system_settings;

CREATE POLICY "Admins can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (
  is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
  OR check_user_admin_status(auth.uid())
);

CREATE POLICY "Super admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (
  is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'super_admin' 
    AND ar.revoked_at IS NULL
  )
);

-- Ensure user_bans policies work correctly
DROP POLICY IF EXISTS "Admins can manage user bans" ON public.user_bans;

CREATE POLICY "Admins can manage user bans" 
ON public.user_bans 
FOR ALL 
USING (
  is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
  OR check_user_admin_status(auth.uid())
);