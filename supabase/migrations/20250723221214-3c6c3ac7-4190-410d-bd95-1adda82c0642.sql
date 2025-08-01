-- CORREÇÃO EXTREMA E DEFINITIVA: Eliminar COMPLETAMENTE recursão infinita

-- 1. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE public.teacher_classes DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER ABSOLUTAMENTE TODAS as políticas e funções relacionadas
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover todas as políticas da tabela teacher_classes
    FOR r IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'teacher_classes' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.teacher_classes';
    END LOOP;
END $$;

-- 3. REMOVER TODAS as funções que podem causar recursão
DROP FUNCTION IF EXISTS public.is_bootstrap_admin_final() CASCADE;
DROP FUNCTION IF EXISTS public.generate_class_code_final() CASCADE;
DROP FUNCTION IF EXISTS public.set_class_code_final() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_bootstrap_simple() CASCADE;
DROP FUNCTION IF EXISTS public.generate_simple_class_code() CASCADE;
DROP FUNCTION IF EXISTS public.auto_set_class_code() CASCADE;

-- 4. REMOVER TODOS os triggers
DROP TRIGGER IF EXISTS set_class_code_final_trigger ON public.teacher_classes;
DROP TRIGGER IF EXISTS auto_set_class_code_trigger ON public.teacher_classes;

-- 5. Criar função ULTRA-MINIMALISTA para admin (sem qualquer referência circular)
CREATE OR REPLACE FUNCTION public.is_admin_ultra_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND u.email = 'suport154@gmail.com'
  );
$$;

-- 6. Função ULTRA-SIMPLES para gerar código
CREATE OR REPLACE FUNCTION public.gen_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));
$$;

-- 7. Trigger MINIMALISTA
CREATE OR REPLACE FUNCTION public.trigger_class_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    NEW.class_code := public.gen_code();
  END IF;
  RETURN NEW;
END;
$$;

-- 8. REABILITAR RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 9. Criar APENAS as políticas ESSENCIAIS (ultra-simples)
CREATE POLICY "prof_own" ON public.teacher_classes
FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "admin_all" ON public.teacher_classes
FOR SELECT TO authenticated
USING (is_admin_ultra_safe());

CREATE POLICY "student_view" ON public.teacher_classes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students tcs
    WHERE tcs.class_id = teacher_classes.id 
    AND tcs.student_id = auth.uid()
  )
);

-- 10. Aplicar trigger
CREATE TRIGGER gen_code_trigger
  BEFORE INSERT ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_class_code();