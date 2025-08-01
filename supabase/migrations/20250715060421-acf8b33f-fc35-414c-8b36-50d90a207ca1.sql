-- Atualizar política RLS para permitir que todos os membros vejam outros membros da turma
DROP POLICY IF EXISTS "Class leaders and members can view class members" ON public.class_members;

CREATE POLICY "All class members can view other class members"
ON public.class_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.class_members cm 
    WHERE cm.class_id = class_members.class_id 
    AND cm.user_id = auth.uid()
  )
  OR is_class_leader(class_id, auth.uid())
);

-- Atualizar função para limpar TODAS as notificações ao invés de apenas antigas
CREATE OR REPLACE FUNCTION public.clear_all_absence_notifications(class_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Apenas o líder da turma pode limpar notificações
  IF NOT EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id_param AND leader_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Apenas o líder da turma pode limpar notificações';
  END IF;

  -- Deletar TODAS as notificações da turma
  DELETE FROM absence_notifications 
  WHERE class_id = class_id_param;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;