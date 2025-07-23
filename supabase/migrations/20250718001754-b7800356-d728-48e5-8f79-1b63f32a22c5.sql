-- Remove a constraint antiga que limita os dias a 0-4
ALTER TABLE public.schedule_slots DROP CONSTRAINT IF EXISTS schedule_slots_day_check;

-- Adiciona nova constraint que permite dias 0-5 (segunda a sábado)
ALTER TABLE public.schedule_slots ADD CONSTRAINT schedule_slots_day_check CHECK (day >= 0 AND day <= 5);