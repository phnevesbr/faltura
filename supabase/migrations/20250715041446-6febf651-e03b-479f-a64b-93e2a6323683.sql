-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view members of their classes" ON public.class_members;

-- Create security definer functions to check permissions without recursion
CREATE OR REPLACE FUNCTION public.is_class_leader(class_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = class_id AND leader_id = user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(class_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE class_id = $1 AND user_id = $2
  );
$$;

-- Create new non-recursive policies for class_members
CREATE POLICY "Class leaders and members can view class members"
ON public.class_members
FOR SELECT
TO authenticated
USING (
  public.is_class_leader(class_id, auth.uid()) OR
  user_id = auth.uid()
);

-- Update the leaders can add members policy to be more specific
DROP POLICY IF EXISTS "Leaders can add members" ON public.class_members;
CREATE POLICY "Leaders can add members to their classes"
ON public.class_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_class_leader(class_id, auth.uid()));

-- Update the classes viewing policy to avoid recursion
DROP POLICY IF EXISTS "Users can view classes they're members of" ON public.classes;
CREATE POLICY "Users can view their own classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  leader_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = classes.id AND user_id = auth.uid()
  )
);