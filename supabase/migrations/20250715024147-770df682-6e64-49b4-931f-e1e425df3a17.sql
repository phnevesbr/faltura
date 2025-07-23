-- Adicionar política RLS para permitir que usuários deletem suas próprias conquistas
CREATE POLICY "Users can delete their own achievements" 
ON public.user_achievements 
FOR DELETE 
USING (auth.uid() = user_id);