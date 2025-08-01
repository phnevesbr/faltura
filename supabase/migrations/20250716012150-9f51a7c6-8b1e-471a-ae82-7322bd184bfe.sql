-- Adicionar novos campos de notificação para todas as abas
ALTER TABLE public.user_notifications 
ADD COLUMN IF NOT EXISTS subjects BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notes BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS profile BOOLEAN NOT NULL DEFAULT true;

-- Renomear campo grades para grade para ficar mais claro
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_notifications' AND column_name = 'grades') THEN
    ALTER TABLE public.user_notifications RENAME COLUMN grades TO grade;
  END IF;
END $$;