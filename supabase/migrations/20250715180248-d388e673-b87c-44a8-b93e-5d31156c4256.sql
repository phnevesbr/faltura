-- Primeiro, vou remover os triggers existentes que podem estar causando problemas
DROP TRIGGER IF EXISTS log_subject_action ON public.subjects;
DROP TRIGGER IF EXISTS log_note_action ON public.notes;
DROP TRIGGER IF EXISTS log_absence_action ON public.absences;

-- Recriar a função com a assinatura correta
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
EXCEPTION
  WHEN others THEN
    -- Apenas ignora erros para não bloquear as operações principais
    NULL;
END;
$$;

-- Recriar os triggers com a função correta
CREATE OR REPLACE FUNCTION public.log_subject_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_action(NEW.user_id, 'subject_created', 'subjects', NEW.id, json_build_object('name', NEW.name, 'color', NEW.color)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_user_action(NEW.user_id, 'subject_updated', 'subjects', NEW.id, json_build_object('old_name', OLD.name, 'new_name', NEW.name)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_action(OLD.user_id, 'subject_deleted', 'subjects', OLD.id, json_build_object('name', OLD.name)::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_note_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_action(NEW.user_id, 'note_created', 'notes', NEW.id, json_build_object('title', NEW.title, 'type', NEW.type)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_user_action(NEW.user_id, 'note_updated', 'notes', NEW.id, json_build_object('title', NEW.title, 'completed', NEW.completed)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_action(OLD.user_id, 'note_deleted', 'notes', OLD.id, json_build_object('title', OLD.title)::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_absence_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_action(NEW.user_id, 'absence_created', 'absences', NEW.id, json_build_object('date', NEW.date)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_action(OLD.user_id, 'absence_deleted', 'absences', OLD.id, json_build_object('date', OLD.date)::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recriar os triggers
CREATE TRIGGER log_subject_action_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.log_subject_action();

CREATE TRIGGER log_note_action_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.log_note_action();

CREATE TRIGGER log_absence_action_trigger
  AFTER INSERT OR DELETE ON public.absences
  FOR EACH ROW EXECUTE FUNCTION public.log_absence_action();