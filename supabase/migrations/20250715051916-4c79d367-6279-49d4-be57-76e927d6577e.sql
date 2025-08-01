-- Corrigir a policy de INSERT para absence_subjects
DROP POLICY IF EXISTS "Users can create their own absence subjects" ON public.absence_subjects;

CREATE POLICY "Users can create their own absence subjects" 
ON public.absence_subjects 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.absences
    WHERE absences.id = absence_subjects.absence_id 
    AND absences.user_id = auth.uid()
  )
);