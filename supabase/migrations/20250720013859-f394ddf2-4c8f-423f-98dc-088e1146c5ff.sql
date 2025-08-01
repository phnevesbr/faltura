-- Corrigir duplicação de achievements sem usar índices
-- Primeiro removemos duplicatas, depois criamos constraint

-- Remover duplicatas existentes (manter apenas a mais recente baseada no ID)
DELETE FROM user_achievements 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY user_id, achievement_id 
             ORDER BY unlocked_at DESC, id DESC
           ) as row_num
    FROM user_achievements
  ) ranked
  WHERE row_num > 1
);

-- Remover constraint existente se houver
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_achievement_id_key;

-- Criar nova constraint única
ALTER TABLE user_achievements 
ADD CONSTRAINT user_achievements_user_id_achievement_id_unique 
UNIQUE (user_id, achievement_id);