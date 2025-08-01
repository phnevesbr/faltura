-- Fix admin permissions for updating user data and system settings

-- Allow admins to update profiles of other users
CREATE POLICY "Admins can update user profiles" 
ON public.profiles 
FOR UPDATE 
USING (check_admin_status_safe(auth.uid()) OR auth.uid() = user_id);

-- Allow admins to update user levels
CREATE POLICY "Admins can update user levels" 
ON public.user_levels 
FOR UPDATE 
USING (check_admin_status_safe(auth.uid()) OR auth.uid() = user_id);

-- Allow admins to insert user levels for other users
CREATE POLICY "Admins can insert user levels for any user" 
ON public.user_levels 
FOR INSERT 
WITH CHECK (check_admin_status_safe(auth.uid()) OR auth.uid() = user_id);

-- Allow admins to update classes they don't own
CREATE POLICY "Admins can update any class" 
ON public.classes 
FOR UPDATE 
USING (check_admin_status_safe(auth.uid()) OR auth.uid() = leader_id);

-- Fix system settings policy for update operations specifically
DROP POLICY IF EXISTS "Super admins can manage system settings" ON public.system_settings;

-- Recreate with proper permissions for different operations
CREATE POLICY "Super admins can update system settings" 
ON public.system_settings 
FOR UPDATE 
USING (is_bootstrap_admin(( SELECT profiles.email
   FROM profiles
  WHERE (profiles.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM admin_roles ar
  WHERE ((ar.user_id = auth.uid()) AND (ar.role = 'super_admin'::text) AND (ar.revoked_at IS NULL)))));

CREATE POLICY "Super admins can insert system settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (is_bootstrap_admin(( SELECT profiles.email
   FROM profiles
  WHERE (profiles.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM admin_roles ar
  WHERE ((ar.user_id = auth.uid()) AND (ar.role = 'super_admin'::text) AND (ar.revoked_at IS NULL)))));

CREATE POLICY "Super admins can delete system settings" 
ON public.system_settings 
FOR DELETE 
USING (is_bootstrap_admin(( SELECT profiles.email
   FROM profiles
  WHERE (profiles.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM admin_roles ar
  WHERE ((ar.user_id = auth.uid()) AND (ar.role = 'super_admin'::text) AND (ar.revoked_at IS NULL)))));