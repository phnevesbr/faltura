-- Primeiro, vamos popular os emails existentes dos usuários
UPDATE public.profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.user_id = auth.users.id AND profiles.email IS NULL;

-- Corrigir a função para garantir que o email seja sempre inserido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, course, university, shift, semester_start, semester_end)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'course', ''),
    '',
    'morning',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '4 months'
  );
  RETURN NEW;
END;
$function$