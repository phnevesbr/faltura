-- Criar constraint unique para permitir UPSERT na tabela achievement_tracking
ALTER TABLE public.achievement_tracking 
ADD CONSTRAINT achievement_tracking_user_type_date_unique 
UNIQUE (user_id, tracking_type, date_tracked);