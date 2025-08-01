-- SOLUÇÃO DEFINITIVA: Desabilitar RLS temporariamente e recriar com funções ultra-seguras

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.teacher_classes DISABLE ROW LEVEL SECURITY;

-- 2. Dropar todas as políticas existentes
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Admins can view all teacher classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Students can view classes they joined" ON public.teacher_classes;

-- 3. Criar função ultra-segura sem recursão usando apenas tabelas auth
CREATE OR REPLACE FUNCTION public.check_teacher_access(user_id_param uuid, teacher_id_check uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se é o próprio professor
  IF user_id_param = teacher_id_check THEN
    RETURN true;
  END IF;
  
  -- Se é bootstrap admin
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND email = 'suport154@gmail.com'
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 4. Função para verificar se é estudante da turma (sem recursão)
CREATE OR REPLACE FUNCTION public.check_student_access(user_id_param uuid, class_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_class_students 
    WHERE student_id = user_id_param 
    AND class_id = class_id_param
  );
$$;

-- 5. Reabilitar RLS
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas ultra-simples sem recursão
CREATE POLICY "teacher_full_access"
ON public.teacher_classes
FOR ALL
TO authenticated
USING (check_teacher_access(auth.uid(), teacher_id))
WITH CHECK (check_teacher_access(auth.uid(), teacher_id));

CREATE POLICY "student_read_access" 
ON public.teacher_classes
FOR SELECT
TO authenticated
USING (check_student_access(auth.uid(), id));