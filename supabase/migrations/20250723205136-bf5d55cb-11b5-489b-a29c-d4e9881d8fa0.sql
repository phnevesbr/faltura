-- Criar tabela para matérias que os professores podem lecionar
CREATE TABLE public.teacher_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  subject_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_name)
);

-- Criar tabela para turmas dos professores
CREATE TABLE public.teacher_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  class_code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_students INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para vincular alunos às turmas de professores
CREATE TABLE public.teacher_class_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Habilitar RLS
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_class_students ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para teacher_subjects
CREATE POLICY "Teachers can manage their own subjects" 
ON public.teacher_subjects 
FOR ALL 
USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can view all teacher subjects" 
ON public.teacher_subjects 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Políticas RLS para teacher_classes
CREATE POLICY "Teachers can manage their own classes" 
ON public.teacher_classes 
FOR ALL 
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they belong to" 
ON public.teacher_classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students 
    WHERE class_id = teacher_classes.id AND student_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all teacher classes" 
ON public.teacher_classes 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Políticas RLS para teacher_class_students
CREATE POLICY "Teachers can manage students in their classes" 
ON public.teacher_class_students 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_classes 
    WHERE id = teacher_class_students.class_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own class memberships" 
ON public.teacher_class_students 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all class memberships" 
ON public.teacher_class_students 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_teacher_subjects_updated_at
  BEFORE UPDATE ON public.teacher_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_classes_updated_at
  BEFORE UPDATE ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar código único da turma
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 6 caracteres (letras maiúsculas e números)
    new_code := UPPER(substring(md5(random()::text) from 1 for 6));
    
    -- Verificar se o código já existe
    SELECT EXISTS(SELECT 1 FROM public.teacher_classes WHERE class_code = new_code) INTO code_exists;
    
    -- Se não existe, retornar o código
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Função para verificar se usuário é professor
CREATE OR REPLACE FUNCTION public.is_teacher(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_id_param 
    AND role = 'teacher' 
    AND revoked_at IS NULL
  );
$$;