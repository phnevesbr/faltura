-- Verificar se a constraint unique já existe e criá-la se necessário
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_grades_assessment_id_student_id_key'
    ) THEN
        ALTER TABLE student_grades 
        ADD CONSTRAINT student_grades_assessment_id_student_id_key 
        UNIQUE (assessment_id, student_id);
    END IF;
END $$;