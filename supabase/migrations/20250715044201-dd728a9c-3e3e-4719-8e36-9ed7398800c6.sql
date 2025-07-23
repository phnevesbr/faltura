-- Criar uma função que automaticamente cria notificações de falta para turmas
CREATE OR REPLACE FUNCTION public.auto_create_absence_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subject_names TEXT[];
BEGIN
  -- Buscar os nomes das matérias relacionadas à ausência
  -- Usar um subquery para garantir que pegamos as matérias corretas
  SELECT ARRAY(
    SELECT s.name 
    FROM public.subjects s
    JOIN public.absence_subjects abs ON abs.subject_id = s.id
    WHERE abs.absence_id = NEW.id
    ORDER BY s.name
  ) INTO subject_names;
  
  -- Se ainda não há matérias, usar um array vazio
  IF subject_names IS NULL THEN
    subject_names := ARRAY[]::TEXT[];
  END IF;
  
  -- Inserir notificação de falta para cada turma que o usuário pertence
  INSERT INTO public.absence_notifications (class_id, user_id, absence_date, subjects)
  SELECT 
    cm.class_id,
    NEW.user_id,
    NEW.date,
    subject_names
  FROM public.class_members cm
  WHERE cm.user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que dispara após inserir uma nova ausência
DROP TRIGGER IF EXISTS trigger_auto_create_absence_notification ON public.absences;
CREATE TRIGGER trigger_auto_create_absence_notification
  AFTER INSERT ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_absence_notification();

-- Criar uma função adicional que atualiza as notificações quando as matérias são inseridas
CREATE OR REPLACE FUNCTION public.update_absence_notification_subjects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subject_names TEXT[];
  absence_user_id UUID;
  absence_date DATE;
BEGIN
  -- Buscar informações da ausência
  SELECT user_id, date INTO absence_user_id, absence_date
  FROM public.absences 
  WHERE id = NEW.absence_id;
  
  -- Buscar todos os nomes das matérias para esta ausência
  SELECT ARRAY(
    SELECT s.name 
    FROM public.subjects s
    JOIN public.absence_subjects abs ON abs.subject_id = s.id
    WHERE abs.absence_id = NEW.absence_id
    ORDER BY s.name
  ) INTO subject_names;
  
  -- Atualizar as notificações existentes com as matérias corretas
  UPDATE public.absence_notifications
  SET subjects = subject_names
  WHERE user_id = absence_user_id 
  AND absence_date = absence_date;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar as matérias nas notificações quando absence_subjects são inseridas
DROP TRIGGER IF EXISTS trigger_update_absence_notification_subjects ON public.absence_subjects;
CREATE TRIGGER trigger_update_absence_notification_subjects
  AFTER INSERT ON public.absence_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_absence_notification_subjects();

-- Comentários explicativos
COMMENT ON FUNCTION public.auto_create_absence_notification() IS 'Função que automaticamente cria notificações de falta para todas as turmas que o usuário pertence quando uma nova ausência é registrada';

COMMENT ON FUNCTION public.update_absence_notification_subjects() IS 'Função que atualiza as matérias nas notificações de falta quando os registros de absence_subjects são inseridos';