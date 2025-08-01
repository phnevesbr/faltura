-- Verificar se as colunas de onboarding já existem na tabela profiles
DO $$ 
BEGIN
    -- Adicionar colunas de onboarding se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_skipped') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_skipped BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed_at') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;