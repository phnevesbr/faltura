-- Limpar registros duplicados na tabela user_notifications
-- Manter apenas o registro mais recente para cada usuário
WITH duplicates AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_notifications
)
DELETE FROM user_notifications 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar constraint única para prevenir futuros duplicados
ALTER TABLE user_notifications 
ADD CONSTRAINT user_notifications_user_id_unique 
UNIQUE (user_id);