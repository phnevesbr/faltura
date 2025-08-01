-- Adicionar campo de nota mínima nas turmas
ALTER TABLE public.teacher_classes 
ADD COLUMN minimum_grade NUMERIC(3,2) DEFAULT 6.0 CHECK (minimum_grade >= 0 AND minimum_grade <= 10);