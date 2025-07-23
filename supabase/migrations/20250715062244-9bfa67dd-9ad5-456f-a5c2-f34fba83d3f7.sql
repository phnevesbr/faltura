-- Primeiro, vamos remover TODAS as políticas da tabela class_members
DROP POLICY IF EXISTS "Class members can view members in their classes" ON public.class_members;
DROP POLICY IF EXISTS "Users can add themselves to classes with accepted invites" ON public.class_members;
DROP POLICY IF EXISTS "Leaders can add members to their classes" ON public.class_members;
DROP POLICY IF EXISTS "Users can remove themselves or leaders can remove members" ON public.class_members;

-- Criar função de segurança para verificar se o usuário pode ver uma turma
CREATE OR REPLACE FUNCTION public.user_can_access_class(class_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Verifica se o usuário é líder da turma
  SELECT EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id_param AND leader_id = auth.uid()
  );
$$;

-- Função para verificar se usuário tem convite aceito
CREATE OR REPLACE FUNCTION public.user_has_accepted_invite(class_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM class_invites ci
    LEFT JOIN profiles p ON p.email = ci.invitee_email
    WHERE ci.class_id = class_id_param 
    AND ci.status = 'accepted'
    AND (ci.invitee_id = auth.uid() OR p.user_id = auth.uid())
  );
$$;

-- Criar políticas simples usando as funções
CREATE POLICY "Users can view class members if they are leader" 
ON public.class_members 
FOR SELECT 
USING (user_can_access_class(class_id));

CREATE POLICY "Users can join classes with accepted invites" 
ON public.class_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND user_has_accepted_invite(class_id)
);

CREATE POLICY "Leaders can add members" 
ON public.class_members 
FOR INSERT 
WITH CHECK (user_can_access_class(class_id));

CREATE POLICY "Users can remove themselves or leaders can remove" 
ON public.class_members 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR user_can_access_class(class_id)
);