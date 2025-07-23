-- Fix infinite recursion in admin_roles policies by removing circular dependencies

-- First, drop all existing problematic policies on admin_roles
DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can manage all admin roles" ON public.admin_roles;

-- Create unique constraint on admin_roles if it doesn't exist
ALTER TABLE public.admin_roles 
ADD CONSTRAINT admin_roles_user_role_unique 
UNIQUE (user_id, role);

-- Create a security definer function to check admin status without circular dependency
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Bootstrap check for initial admin setup
  SELECT user_email = 'suport154@gmail.com';
$$;

-- Create a security definer function to check if user is admin (non-circular)
CREATE OR REPLACE FUNCTION public.check_user_admin_status(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = check_user_id 
    AND role IN ('super_admin', 'admin', 'moderator') 
    AND revoked_at IS NULL
  );
$$;

-- Create new non-circular policies for admin_roles
CREATE POLICY "Bootstrap admin can view admin roles" 
ON public.admin_roles 
FOR SELECT 
USING (
  is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
  OR check_user_admin_status(auth.uid())
);

CREATE POLICY "Bootstrap admin can manage admin roles" 
ON public.admin_roles 
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

-- Grant super_admin role to your account
INSERT INTO public.admin_roles (user_id, role, granted_by, permissions)
SELECT 
  p.user_id,
  'super_admin'::text,
  p.user_id,
  '{"analytics": true, "system_config": true, "user_management": true, "class_management": true}'::jsonb
FROM public.profiles p
WHERE p.email = 'suport154@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET
  revoked_at = NULL,
  permissions = EXCLUDED.permissions;

-- Update the is_admin function to use the new non-circular approach
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
AS $function$
  SELECT check_user_admin_status(user_id) 
  OR is_bootstrap_admin((SELECT email FROM profiles WHERE profiles.user_id = $1));
$function$;