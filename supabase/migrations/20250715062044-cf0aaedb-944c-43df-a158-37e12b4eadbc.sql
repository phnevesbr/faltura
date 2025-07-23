-- Primeiro, vamos remover as políticas problemáticas da tabela class_members
DROP POLICY IF EXISTS "All class members can view other class members" ON public.class_members;
DROP POLICY IF EXISTS "Users can join classes they were invited to" ON public.class_members;
DROP POLICY IF EXISTS "Users can join classes with accepted invites" ON public.class_members;
DROP POLICY IF EXISTS "Leaders can add members to their classes" ON public.class_members;
DROP POLICY IF EXISTS "Users can remove themselves from classes" ON public.class_members;

-- Criar políticas corrigidas sem recursão
CREATE POLICY "Class members can view members in their classes" 
ON public.class_members 
FOR SELECT 
USING (
  -- Um usuário pode ver membros de turmas onde ele é membro OU líder
  class_id IN (
    SELECT cm.class_id FROM class_members cm WHERE cm.user_id = auth.uid()
    UNION
    SELECT c.id FROM classes c WHERE c.leader_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves to classes with accepted invites" 
ON public.class_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 
    FROM class_invites ci
    LEFT JOIN profiles p ON p.email = ci.invitee_email
    WHERE ci.class_id = class_members.class_id 
    AND ci.status = 'accepted'
    AND (ci.invitee_id = auth.uid() OR p.user_id = auth.uid())
  )
);

CREATE POLICY "Leaders can add members to their classes" 
ON public.class_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM classes 
    WHERE id = class_members.class_id 
    AND leader_id = auth.uid()
  )
);

CREATE POLICY "Users can remove themselves or leaders can remove members" 
ON public.class_members 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 
    FROM classes 
    WHERE id = class_members.class_id 
    AND leader_id = auth.uid()
  )
);