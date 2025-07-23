-- Criar política para permitir que usuários busquem outros perfis pelo email
CREATE POLICY "Users can search profiles by email" 
ON public.profiles 
FOR SELECT 
USING (true);