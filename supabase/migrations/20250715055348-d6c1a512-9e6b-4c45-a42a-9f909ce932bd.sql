-- Corrigir a função clear_old_absence_notifications para resolver o erro de sintaxe
CREATE OR REPLACE FUNCTION public.clear_old_absence_notifications(class_id_param uuid, days_old integer DEFAULT 30)
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

  -- Deletar notificações mais antigas que X dias (corrigir sintaxe)
  DELETE FROM absence_notifications 
  WHERE class_id = class_id_param 
  AND created_at < (CURRENT_TIMESTAMP - (days_old || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;