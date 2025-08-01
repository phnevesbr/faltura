-- Corrigir recursão infinita nas políticas RLS da tabela teacher_classes

-- Remover todas as políticas existentes da tabela teacher_classes
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Students can view classes they belong to" ON public.teacher_classes;
DROP POLICY IF EXISTS "Admins can view all teacher classes" ON public.teacher_classes;

-- Recriar políticas sem recursão
CREATE POLICY "Teachers can manage their own classes" 
ON public.teacher_classes 
FOR ALL 
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they belong to" 
ON public.teacher_classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students 
    WHERE teacher_class_students.class_id = teacher_classes.id 
    AND teacher_class_students.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all teacher classes" 
ON public.teacher_classes 
FOR SELECT 
USING (is_admin(auth.uid()));