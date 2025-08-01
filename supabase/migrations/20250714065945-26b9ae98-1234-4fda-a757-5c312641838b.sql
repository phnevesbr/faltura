-- Verificar se a política de DELETE existe para semester_history
-- Adicionar política de DELETE se não existir
DO $$
BEGIN
  -- Verificar se a política DELETE existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'semester_history' 
    AND policyname = 'Users can delete their own semester history'
  ) THEN
    -- Criar política DELETE
    EXECUTE 'CREATE POLICY "Users can delete their own semester history" ON public.semester_history FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;