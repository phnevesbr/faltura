-- Create a function to check if user has a pending invite for the class
CREATE OR REPLACE FUNCTION public.has_pending_invite(class_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_invites ci
    LEFT JOIN public.profiles p ON p.email = ci.invitee_email
    WHERE ci.class_id = $1 
    AND ci.status = 'pending'
    AND (ci.invitee_id = $2 OR p.user_id = $2)
  );
$$;

-- Add a new policy for users accepting invites
CREATE POLICY "Users can join classes they were invited to"
ON public.class_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  public.has_pending_invite(class_id, auth.uid())
);