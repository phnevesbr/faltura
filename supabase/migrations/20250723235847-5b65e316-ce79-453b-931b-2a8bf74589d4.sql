-- Adicionar campo maximum_grade na tabela teacher_classes
ALTER TABLE public.teacher_classes 
ADD COLUMN maximum_grade numeric DEFAULT 10.0;