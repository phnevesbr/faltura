-- Atualizar a função para permitir acesso a membros da turma também
CREATE OR REPLACE FUNCTION public.user_can_access_class(class_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário é líder da turma OU se já é membro
  RETURN EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id_param AND leader_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM class_members 
    WHERE class_id = class_id_param AND user_id = auth.uid()
  );
END;
$$;