-- Criar tabela de usuários com sistema de XP e níveis
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  experience_points INTEGER NOT NULL DEFAULT 0,
  total_experience INTEGER NOT NULL DEFAULT 0,
  current_tier TEXT NOT NULL DEFAULT 'calouro',
  level_progress DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de badges temporais
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL, -- weekly, monthly, special
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  earned_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de conquistas expandidas com XP
ALTER TABLE public.achievements 
ADD COLUMN experience_reward INTEGER DEFAULT 0;

-- Habilitar RLS para user_levels
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_levels
CREATE POLICY "Users can view their own level data" 
ON public.user_levels 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own level data" 
ON public.user_levels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own level data" 
ON public.user_levels 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Habilitar RLS para user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_badges
CREATE POLICY "Users can view their own badges" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own badges" 
ON public.user_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges" 
ON public.user_badges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Criar função para calcular nível baseado em XP
CREATE OR REPLACE FUNCTION public.calculate_level(total_xp INTEGER)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  level INTEGER;
  tier TEXT;
  xp_for_current_level INTEGER;
  xp_for_next_level INTEGER;
  progress DECIMAL(5,2);
BEGIN
  -- Calcular nível baseado em XP
  IF total_xp < 1000 THEN
    level := LEAST(10, GREATEST(1, (total_xp / 100) + 1));
    tier := 'calouro';
  ELSIF total_xp < 5000 THEN
    level := LEAST(25, GREATEST(11, ((total_xp - 1000) / 267) + 11));
    tier := 'veterano';
  ELSIF total_xp < 15000 THEN
    level := LEAST(50, GREATEST(26, ((total_xp - 5000) / 400) + 26));
    tier := 'expert';
  ELSE
    level := LEAST(100, GREATEST(51, ((total_xp - 15000) / 800) + 51));
    tier := 'lenda';
  END IF;
  
  -- Calcular XP necessário para níveis atual e próximo
  IF level <= 10 THEN
    xp_for_current_level := (level - 1) * 100;
    xp_for_next_level := level * 100;
  ELSIF level <= 25 THEN
    xp_for_current_level := 1000 + (level - 11) * 267;
    xp_for_next_level := 1000 + (level - 10) * 267;
  ELSIF level <= 50 THEN
    xp_for_current_level := 5000 + (level - 26) * 400;
    xp_for_next_level := 5000 + (level - 25) * 400;
  ELSE
    xp_for_current_level := 15000 + (level - 51) * 800;
    xp_for_next_level := 15000 + (level - 50) * 800;
  END IF;
  
  -- Calcular progresso
  IF xp_for_next_level > xp_for_current_level THEN
    progress := ((total_xp - xp_for_current_level)::DECIMAL / (xp_for_next_level - xp_for_current_level)::DECIMAL) * 100;
  ELSE
    progress := 100.0;
  END IF;
  
  RETURN json_build_object(
    'level', level,
    'tier', tier,
    'progress', LEAST(100.0, GREATEST(0.0, progress)),
    'xp_for_current_level', xp_for_current_level,
    'xp_for_next_level', xp_for_next_level
  );
END;
$$;

-- Criar função para atualizar nível do usuário
CREATE OR REPLACE FUNCTION public.update_user_level(user_id_param UUID, xp_gained INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_data RECORD;
  level_data JSON;
  old_level INTEGER;
  new_level INTEGER;
BEGIN
  -- Buscar dados atuais
  SELECT * INTO current_data
  FROM public.user_levels
  WHERE user_id = user_id_param;
  
  -- Se não existe, criar registro inicial
  IF NOT FOUND THEN
    INSERT INTO public.user_levels (user_id, experience_points, total_experience)
    VALUES (user_id_param, xp_gained, xp_gained);
    
    SELECT * INTO current_data
    FROM public.user_levels
    WHERE user_id = user_id_param;
  ELSE
    -- Atualizar XP
    UPDATE public.user_levels
    SET 
      experience_points = experience_points + xp_gained,
      total_experience = total_experience + xp_gained,
      updated_at = now()
    WHERE user_id = user_id_param;
    
    SELECT * INTO current_data
    FROM public.user_levels
    WHERE user_id = user_id_param;
  END IF;
  
  old_level := current_data.level;
  
  -- Calcular novo nível
  level_data := calculate_level(current_data.total_experience);
  new_level := (level_data->>'level')::INTEGER;
  
  -- Atualizar nível se mudou
  IF new_level != old_level THEN
    UPDATE public.user_levels
    SET 
      level = new_level,
      current_tier = level_data->>'tier',
      level_progress = (level_data->>'progress')::DECIMAL(5,2),
      updated_at = now()
    WHERE user_id = user_id_param;
  END IF;
  
  RETURN json_build_object(
    'old_level', old_level,
    'new_level', new_level,
    'level_up', new_level > old_level,
    'total_xp', current_data.total_experience + xp_gained,
    'tier', level_data->>'tier'
  );
END;
$$;

-- Criar trigger para atualizar timestamp
CREATE TRIGGER update_user_levels_updated_at
BEFORE UPDATE ON public.user_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_type ON public.user_badges(badge_type);
CREATE INDEX idx_user_badges_active ON public.user_badges(is_active);
CREATE INDEX idx_user_levels_user_id ON public.user_levels(user_id);