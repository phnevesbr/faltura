-- CORREÇÃO FINAL E ABSOLUTA: Eliminar completamente recursão infinita em teacher_classes

-- 1. Verificar e remover todas as políticas atuais
DROP POLICY IF EXISTS "teacher_own_classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "admin_view_classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "student_view_enrolled_classes" ON public.teacher_classes;

-- 2. Remover todas as funções relacionadas que podem causar problemas
DROP FUNCTION IF EXISTS public.is_admin_bootstrap_simple() CASCADE;
DROP FUNCTION IF EXISTS public.generate_simple_class_code() CASCADE;
DROP FUNCTION IF EXISTS public.auto_set_class_code() CASCADE;

-- 3. Remover triggers existentes
DROP TRIGGER IF EXISTS auto_set_class_code_trigger ON public.teacher_classes;

-- 4. Desabilitar RLS temporariamente
ALTER TABLE public.teacher_classes DISABLE ROW LEVEL SECURITY;

-- 5. Criar função bootstrap admin ultra-simples (sem recursão)
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin_final()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 'suport154@gmail.com' = COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()), 
    ''
  );
$$;

-- 6. Criar função para gerar código (sem recursão)
CREATE OR REPLACE FUNCTION public.generate_class_code_final()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT UPPER(SUBSTRING(MD5(random()::text || extract(epoch from now())::text) FROM 1 FOR 6));
$$;

-- 7. Criar trigger function ultra-simples
CREATE OR REPLACE FUNCTION public.set_class_code_final()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    NEW.class_code := public.generate_class_code_final();
  END IF;
  RETURN NEW;
END;
$$;

-- 8. Reabilitar RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas finais ultra-simples SEM qualquer recursão
CREATE POLICY "professors_manage_own" 
ON public.teacher_classes
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "bootstrap_admin_access" 
ON public.teacher_classes
FOR SELECT
TO authenticated
USING (is_bootstrap_admin_final());

CREATE POLICY "students_view_enrolled" 
ON public.teacher_classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students 
    WHERE class_id = teacher_classes.id 
    AND student_id = auth.uid()
  )
);

-- 10. Aplicar trigger para gerar códigos
CREATE TRIGGER set_class_code_final_trigger
  BEFORE INSERT ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION set_class_code_final();