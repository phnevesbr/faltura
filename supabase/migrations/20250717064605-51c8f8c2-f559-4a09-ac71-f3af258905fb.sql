-- Enable realtime for absence_notifications table
ALTER TABLE public.absence_notifications REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_notifications;