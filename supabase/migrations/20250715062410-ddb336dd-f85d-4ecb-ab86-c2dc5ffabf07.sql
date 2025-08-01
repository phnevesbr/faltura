-- Remover todas as políticas problemáticas novamente
DROP POLICY IF EXISTS "Users can view class members if they are leader" ON public.class_members;
DROP POLICY IF EXISTS "Users can join classes with accepted invites" ON public.class_members;
DROP POLICY IF EXISTS "Leaders can add members" ON public.class_members;
DROP POLICY IF EXISTS "Users can remove themselves or leaders can remove" ON public.class_members;

-- Criar políticas muito simples que evitam recursão
CREATE POLICY "Leaders can view all members of their classes" 
ON public.class_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_members.class_id AND leader_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own membership" 
ON public.class_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can add themselves to classes" 
ON public.class_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders can add members to their classes" 
ON public.class_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_members.class_id AND leader_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own membership" 
ON public.class_members 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Leaders can remove members from their classes" 
ON public.class_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_members.class_id AND leader_id = auth.uid()
  )
);