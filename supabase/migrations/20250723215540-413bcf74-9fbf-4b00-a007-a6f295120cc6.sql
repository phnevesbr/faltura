-- CORREÇÃO RADICAL: Eliminar completamente qualquer possibilidade de recursão

-- 1. Desabilitar temporariamente RLS para limpeza
ALTER TABLE public.teacher_classes DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Teachers can manage their classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Bootstrap admin can view all classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Admins can view all teacher classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Teachers manage own classes" ON public.teacher_classes;

-- 3. Remover funções problemáticas antigas
DROP FUNCTION IF EXISTS public.is_bootstrap_admin_safe(uuid);
DROP FUNCTION IF EXISTS public.is_bootstrap_admin_direct(uuid);
DROP FUNCTION IF EXISTS public.is_teacher_direct(uuid);

-- 4. Criar função de verificação ultra-simples para admins
CREATE OR REPLACE FUNCTION public.check_bootstrap_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'suport154@gmail.com'
  );
$$;

-- 5. Reabilitar RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas ultra-simples SEM qualquer referência cruzada
CREATE POLICY "teacher_classes_owner_policy" ON public.teacher_classes
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- 7. Política separada apenas para bootstrap admin
CREATE POLICY "teacher_classes_admin_policy" ON public.teacher_classes
FOR SELECT
TO authenticated
USING (check_bootstrap_admin());

-- 8. Política para estudantes verem suas turmas (usando tabela separada)
CREATE POLICY "teacher_classes_student_policy" ON public.teacher_classes
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT class_id FROM public.teacher_class_students 
    WHERE student_id = auth.uid()
  )
);

-- 9. Garantir que a função de geração de código está funcionando
CREATE OR REPLACE FUNCTION public.ensure_class_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  random_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Se já tem código, manter
  IF NEW.class_code IS NOT NULL AND NEW.class_code != '' THEN
    RETURN NEW;
  END IF;
  
  -- Gerar código único
  LOOP
    random_code := UPPER(SUBSTRING(MD5(random()::text || NOW()::text) FROM 1 FOR 6));
    
    -- Verificar se existe
    IF NOT EXISTS (SELECT 1 FROM public.teacher_classes WHERE class_code = random_code) THEN
      NEW.class_code := random_code;
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > 20 THEN
      -- Fallback: usar timestamp
      NEW.class_code := UPPER(SUBSTRING(MD5(EXTRACT(EPOCH FROM NOW())::text) FROM 1 FOR 6));
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 10. Aplicar trigger
DROP TRIGGER IF EXISTS ensure_class_code_trigger ON public.teacher_classes;
CREATE TRIGGER ensure_class_code_trigger
  BEFORE INSERT ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_class_code();