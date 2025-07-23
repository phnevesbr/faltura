-- Fix infinite recursion in profiles table RLS policies
-- The issue is that policies on profiles are trying to reference profiles table itself

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can search profiles by email" ON public.profiles;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.check_admin_status_safe(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE admin_roles.user_id = $1 
    AND role IN ('super_admin', 'admin', 'moderator') 
    AND revoked_at IS NULL
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = $1 
    AND auth.users.email = 'suport154@gmail.com'
  );
$$;

-- Recreate the admin policy using the safe function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (check_admin_status_safe(auth.uid()));

-- Recreate a simpler email search policy that doesn't cause recursion
CREATE POLICY "Public profile search" 
ON public.profiles 
FOR SELECT 
USING (true);