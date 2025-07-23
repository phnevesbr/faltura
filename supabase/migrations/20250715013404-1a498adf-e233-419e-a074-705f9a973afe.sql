-- Criar tabela para conquistas desbloqueadas pelos usuários
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Migrar dados existentes da tabela achievements para user_achievements
INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
SELECT user_id, achievement_id, unlocked_at 
FROM public.achievements
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- A tabela achievements atual será mantida mas não será mais usada pelo frontend
-- Ela contém dados desnecessários que duplicam a lógica do frontend