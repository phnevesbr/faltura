-- Corrigir a função que está causando ambiguidade na coluna absence_date
DROP FUNCTION IF EXISTS public.auto_create_absence_notification();

CREATE OR REPLACE FUNCTION public.auto_create_absence_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    NEW.date,  -- Usar NEW.date ao invés de absence_date ambíguo
    subject_names
  FROM public.class_members cm
  WHERE cm.user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Corrigir a função de atualizar matérias das notificações
DROP FUNCTION IF EXISTS public.update_absence_notification_subjects();

CREATE OR REPLACE FUNCTION public.update_absence_notification_subjects()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  subject_names TEXT[];
  absence_user_id UUID;
  abs_date DATE;  -- Renomear para evitar ambiguidade
BEGIN
  -- Buscar informações da ausência
  SELECT user_id, date INTO absence_user_id, abs_date
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
  AND absence_date = abs_date;  -- Usar abs_date ao invés de absence_date
  
  RETURN NEW;
END;
$function$;

-- Criar triggers para as funções
DROP TRIGGER IF EXISTS trigger_auto_create_absence_notification ON public.absences;
CREATE TRIGGER trigger_auto_create_absence_notification
  AFTER INSERT ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_absence_notification();

DROP TRIGGER IF EXISTS trigger_update_absence_notification_subjects ON public.absence_subjects;
CREATE TRIGGER trigger_update_absence_notification_subjects
  AFTER INSERT ON public.absence_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_absence_notification_subjects();

-- Habilitar realtime para atualizações em tempo real
ALTER TABLE public.absences REPLICA IDENTITY FULL;
ALTER TABLE public.absence_subjects REPLICA IDENTITY FULL;
ALTER TABLE public.absence_notifications REPLICA IDENTITY FULL;

-- Adicionar tabelas ao publication do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.absences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_notifications;