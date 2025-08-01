-- Fix infinite recursion in teacher_classes RLS policies
-- Create a safe function to check if user is bootstrap admin without triggering RLS
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin_safe(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND email = 'suport154@gmail.com'
  );
$$;

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Bootstrap admin access" ON public.teacher_classes;

-- Create a new policy that uses the safe function
CREATE POLICY "Bootstrap admin access" ON public.teacher_classes
FOR SELECT 
USING (is_bootstrap_admin_safe(auth.uid()));

-- Also ensure the other policies are not causing recursion
-- Drop and recreate the "Teachers manage own classes" policy to be more explicit
DROP POLICY IF EXISTS "Teachers manage own classes" ON public.teacher_classes;

CREATE POLICY "Teachers manage own classes" ON public.teacher_classes
FOR ALL 
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());