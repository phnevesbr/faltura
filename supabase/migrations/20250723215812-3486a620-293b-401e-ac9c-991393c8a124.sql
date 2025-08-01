-- CORREÇÃO FINAL E DEFINITIVA: Reconstrução completa das políticas

-- 1. Primeiro verificar se existem triggers problemáticos
DROP TRIGGER IF EXISTS trigger_auto_generate_class_code ON public.teacher_classes;
DROP TRIGGER IF EXISTS ensure_class_code_trigger ON public.teacher_classes;
DROP TRIGGER IF EXISTS auto_generate_class_code_trigger ON public.teacher_classes;

-- 2. Remover todas as funções relacionadas
DROP FUNCTION IF EXISTS public.auto_generate_class_code() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_class_code() CASCADE;
DROP FUNCTION IF EXISTS public.generate_class_code_safe() CASCADE;
DROP FUNCTION IF EXISTS public.check_bootstrap_admin() CASCADE;

-- 3. Desabilitar RLS completamente
ALTER TABLE public.teacher_classes DISABLE ROW LEVEL SECURITY;

-- 4. Remover TODAS as políticas (forçado)
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

-- 5. Criar função ultra-simples APENAS para admin bootstrap
CREATE OR REPLACE FUNCTION public.is_admin_bootstrap()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
IMMUTABLE
AS $$
  SELECT 'suport154@gmail.com'::text = COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()), 
    ''
  );
$$;

-- 6. Reabilitar RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 7. Criar UMA política simples para professores
CREATE POLICY "professor_manage_own" ON public.teacher_classes
AS PERMISSIVE
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- 8. Criar UMA política simples para admin
CREATE POLICY "admin_view_all" ON public.teacher_classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin_bootstrap());

-- 9. Política simples para estudantes
CREATE POLICY "student_view_enrolled" ON public.teacher_classes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students 
    WHERE class_id = teacher_classes.id AND student_id = auth.uid()
  )
);

-- 10. Função simples para gerar código sem recursão
CREATE OR REPLACE FUNCTION public.simple_class_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));
$$;

-- 11. Trigger minimalista
CREATE OR REPLACE FUNCTION public.set_class_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    NEW.class_code := public.simple_class_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_class_code_trigger
  BEFORE INSERT ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION set_class_code();