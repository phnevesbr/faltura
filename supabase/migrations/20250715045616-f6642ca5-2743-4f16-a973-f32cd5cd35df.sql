-- Criar bucket para uploads de imagens das turmas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('class-content', 'class-content', true);

-- Políticas para o bucket class-content
CREATE POLICY "Membros de turma podem ver imagens" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'class-content' AND 
  EXISTS (
    SELECT 1 FROM class_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.class_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Usuários podem fazer upload de imagens" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'class-content' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Usuários podem deletar suas próprias imagens" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'class-content' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Adicionar função para limpar notificações antigas
CREATE OR REPLACE FUNCTION public.clear_old_absence_notifications(class_id_param UUID, days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Deletar notificações mais antigas que X dias
  DELETE FROM absence_notifications 
  WHERE class_id = class_id_param 
  AND created_at < (CURRENT_TIMESTAMP - INTERVAL '%s days', days_old);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;