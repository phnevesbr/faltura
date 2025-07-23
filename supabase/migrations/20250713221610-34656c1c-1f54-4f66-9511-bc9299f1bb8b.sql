-- Adicionar campo email na tabela profiles
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Atualizar função para incluir email do usuário
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