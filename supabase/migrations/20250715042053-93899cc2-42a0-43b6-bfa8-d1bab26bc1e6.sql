-- Update the function to also check for recently accepted invites
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
    AND ci.status IN ('pending', 'accepted')
    AND (ci.invitee_id = $2 OR p.user_id = $2)
  );
$$;

-- Also add a more direct policy for users who have accepted invites
CREATE POLICY "Users can join classes with accepted invites"
ON public.class_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.class_invites ci
    LEFT JOIN public.profiles p ON p.email = ci.invitee_email
    WHERE ci.class_id = class_members.class_id
    AND ci.status = 'accepted'
    AND (ci.invitee_id = auth.uid() OR p.user_id = auth.uid())
  )
);