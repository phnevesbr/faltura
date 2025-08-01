-- Vamos simplificar ainda mais para evitar qualquer recursão

-- Remover a política que ainda pode ter recursão
DROP POLICY IF EXISTS "Class members and leaders can view all members" ON public.class_members;

-- Criar políticas separadas e mais simples
-- Política 1: Líderes podem ver todos os membros de suas turmas
CREATE POLICY "Leaders can view all class members" 
ON public.class_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_members.class_id 
    AND c.leader_id = auth.uid()
  )
);

-- Política 2: Usuários podem ver suas próprias participações
CREATE POLICY "Users can view their own memberships" 
ON public.class_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Política 3: Membros podem ver outros membros da mesma turma usando função auxiliar
CREATE OR REPLACE FUNCTION public.get_user_class_memberships(user_id_param uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT class_id 
    FROM public.class_members 
    WHERE user_id = user_id_param
  );
$$;

CREATE POLICY "Members can view other members of same classes" 
ON public.class_members 
FOR SELECT 
USING (
  class_id = ANY(public.get_user_class_memberships(auth.uid()))
);