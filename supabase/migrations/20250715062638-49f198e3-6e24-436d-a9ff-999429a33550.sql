-- Remover a política problemática da tabela classes
DROP POLICY IF EXISTS "Users can view their own classes" ON public.classes;

-- Criar políticas simples para a tabela classes sem referências circulares
CREATE POLICY "Leaders can view their own classes" 
ON public.classes 
FOR SELECT 
USING (leader_id = auth.uid());

-- Política separada para permitir que membros vejam turmas onde são membros
-- Mas vamos fazer isso de forma segura usando uma função
CREATE OR REPLACE FUNCTION public.get_user_class_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT class_id 
    FROM class_members 
    WHERE user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view classes where they are members" 
ON public.classes 
FOR SELECT 
USING (id = ANY(get_user_class_ids()));