-- Adicionar coluna name na tabela profiles
ALTER TABLE public.profiles ADD COLUMN name text;

-- Atualizar a função handle_new_user para incluir o nome
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, course, university, shift, semester_start, semester_end)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'course', ''),
    '',
    'morning',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '4 months'
  );
  RETURN NEW;
END;
$$;