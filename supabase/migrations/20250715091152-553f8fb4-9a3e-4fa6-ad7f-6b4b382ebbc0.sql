-- Remove all policies from admin_roles table to prevent infinite recursion
DROP POLICY IF EXISTS "Bootstrap admin can view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Bootstrap admin can manage admin roles" ON public.admin_roles;

-- Temporarily disable RLS on admin_roles to allow bootstrap access
ALTER TABLE public.admin_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS 
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Allow authenticated users to view their own admin roles" 
ON public.admin_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Allow bootstrap admin full access" 
ON public.admin_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND email = 'suport154@gmail.com'
  )
);

CREATE POLICY "Allow super admins to manage roles" 
ON public.admin_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_roles ar2
    WHERE ar2.user_id = auth.uid() 
    AND ar2.role = 'super_admin' 
    AND ar2.revoked_at IS NULL
    AND ar2.id != admin_roles.id  -- Prevent self-reference
  )
);