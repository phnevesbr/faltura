-- CORREÇÃO DEFINITIVA: Resolver recursão infinita em teacher_classes

-- 1. Desabilitar RLS temporariamente para limpeza completa
ALTER TABLE public.teacher_classes DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'teacher_classes' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- 3. Remover funções que podem estar causando recursão
DROP FUNCTION IF EXISTS public.check_bootstrap_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_bootstrap_admin_safe(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher_direct(uuid) CASCADE;

-- 4. Remover triggers problemáticos
DROP TRIGGER IF EXISTS set_class_code_trigger ON public.teacher_classes;
DROP TRIGGER IF EXISTS ensure_class_code_trigger ON public.teacher_classes;
DROP TRIGGER IF EXISTS auto_generate_class_code_trigger ON public.teacher_classes;

-- 5. Remover funções de geração de código problemáticas
DROP FUNCTION IF EXISTS public.set_class_code() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_class_code() CASCADE;
DROP FUNCTION IF EXISTS public.simple_class_code() CASCADE;

-- 6. Criar função ultra-simples para verificar admin bootstrap
CREATE OR REPLACE FUNCTION public.is_admin_bootstrap_simple()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'suport154@gmail.com'
  );
$$;

-- 7. Reabilitar RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas ultra-simples sem recursão
CREATE POLICY "teacher_own_classes" ON public.teacher_classes
AS PERMISSIVE
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "admin_view_classes" ON public.teacher_classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin_bootstrap_simple());

CREATE POLICY "student_view_enrolled_classes" ON public.teacher_classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students 
    WHERE class_id = teacher_classes.id AND student_id = auth.uid()
  )
);

-- 9. Criar função simples para gerar código de turma
CREATE OR REPLACE FUNCTION public.generate_simple_class_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT UPPER(SUBSTRING(MD5(random()::text || NOW()::text) FROM 1 FOR 6));
$$;

-- 10. Criar trigger minimalista para gerar código
CREATE OR REPLACE FUNCTION public.auto_set_class_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    NEW.class_code := public.generate_simple_class_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_set_class_code_trigger
  BEFORE INSERT ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_class_code();