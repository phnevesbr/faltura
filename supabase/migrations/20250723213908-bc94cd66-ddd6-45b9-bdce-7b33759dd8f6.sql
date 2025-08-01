-- Corrigir definitivamente a recursão infinita nas políticas RLS da tabela teacher_classes

-- Remover TODAS as políticas da tabela teacher_classes
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Students can view classes they belong to" ON public.teacher_classes;
DROP POLICY IF EXISTS "Admins can view all teacher classes" ON public.teacher_classes;

-- Criar políticas simples SEM usar funções que podem causar recursão
-- Política para professores gerenciarem suas próprias turmas
CREATE POLICY "Teachers manage own classes" 
ON public.teacher_classes 
FOR ALL 
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Política para estudantes visualizarem turmas onde estão matriculados
CREATE POLICY "Students view enrolled classes" 
ON public.teacher_classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students tcs
    WHERE tcs.class_id = teacher_classes.id 
    AND tcs.student_id = auth.uid()
  )
);

-- Política para admins (usando verificação direta sem função)
CREATE POLICY "Bootstrap admin access" 
ON public.teacher_classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.email = 'suport154@gmail.com'
  )
);