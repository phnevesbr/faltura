-- Criar tabela de avaliações/notas dos professores
CREATE TABLE public.teacher_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('prova', 'trabalho', 'teste', 'atividade')),
  max_score DECIMAL(5,2) NOT NULL DEFAULT 10.0,
  assessment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de notas dos alunos
CREATE TABLE public.student_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES teacher_assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score DECIMAL(5,2),
  feedback TEXT,
  submission_status TEXT NOT NULL DEFAULT 'pendente' CHECK (submission_status IN ('pendente', 'entregue', 'atrasado')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.teacher_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para teacher_assessments
CREATE POLICY "Teachers can manage assessments in their classes"
ON public.teacher_assessments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM teacher_classes 
  WHERE id = teacher_assessments.class_id 
  AND teacher_id = auth.uid()
));

CREATE POLICY "Students can view assessments in their classes"
ON public.teacher_assessments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM teacher_class_students tcs
  JOIN teacher_classes tc ON tc.id = tcs.class_id
  WHERE tc.id = teacher_assessments.class_id 
  AND tcs.student_id = auth.uid()
));

-- Políticas RLS para student_grades
CREATE POLICY "Teachers can manage grades in their classes"
ON public.student_grades
FOR ALL
USING (EXISTS (
  SELECT 1 FROM teacher_assessments ta
  JOIN teacher_classes tc ON tc.id = ta.class_id
  WHERE ta.id = student_grades.assessment_id 
  AND tc.teacher_id = auth.uid()
));

CREATE POLICY "Students can view their own grades"
ON public.student_grades
FOR SELECT
USING (student_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_teacher_assessments_updated_at
  BEFORE UPDATE ON public.teacher_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_grades_updated_at
  BEFORE UPDATE ON public.student_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar se usuário é professor (diferente de admin)
CREATE OR REPLACE FUNCTION public.is_teacher_role(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
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

-- Atualizar a função generate_class_code para evitar conflitos
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Gerar código de 6 caracteres (letras maiúsculas e números)
    new_code := UPPER(
      SUBSTRING(MD5(random()::text || clock_timestamp()::text) FROM 1 FOR 6)
    );
    
    -- Verificar se o código já existe
    SELECT EXISTS(
      SELECT 1 FROM public.teacher_classes 
      WHERE class_code = new_code
    ) INTO code_exists;
    
    -- Incrementar tentativas para evitar loop infinito
    attempts := attempts + 1;
    
    -- Se não existe ou tentamos muito, retornar o código
    IF NOT code_exists OR attempts > 10 THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;