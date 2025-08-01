-- Add XP notification setting to user_notifications table
ALTER TABLE public.user_notifications 
ADD COLUMN xp_rewards boolean NOT NULL DEFAULT true;