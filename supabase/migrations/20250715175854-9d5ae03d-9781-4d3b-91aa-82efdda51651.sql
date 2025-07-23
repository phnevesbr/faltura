-- Create the missing log_user_action function
CREATE OR REPLACE FUNCTION public.log_user_action(
  user_id uuid,
  action text,
  entity_type text,
  entity_id uuid DEFAULT NULL::uuid,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_logs (user_id, action, entity_type, entity_id, details)
  VALUES (user_id, action, entity_type, entity_id, details);
END;
$$;