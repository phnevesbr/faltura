-- Função para verificar limite de matérias
CREATE OR REPLACE FUNCTION check_subject_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_subjects_limit';
  
  -- Se não encontrou configuração, usar padrão de 10
  IF max_limit IS NULL THEN
    max_limit := 10;
  END IF;
  
  -- Contar matérias atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM subjects 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de matérias excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar limite de tarefas
CREATE OR REPLACE FUNCTION check_notes_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_tasks_limit';
  
  -- Se não encontrou configuração, usar padrão de 50
  IF max_limit IS NULL THEN
    max_limit := 50;
  END IF;
  
  -- Contar tarefas atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM notes 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de tarefas excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar limite de participação em turmas
CREATE OR REPLACE FUNCTION check_class_membership_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_class_memberships';
  
  -- Se não encontrou configuração, usar padrão de 5
  IF max_limit IS NULL THEN
    max_limit := 5;
  END IF;
  
  -- Contar participações atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM class_members 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de participação em turmas excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar limite de liderança de turmas
CREATE OR REPLACE FUNCTION check_class_leadership_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_class_leadership';
  
  -- Se não encontrou configuração, usar padrão de 2
  IF max_limit IS NULL THEN
    max_limit := 2;
  END IF;
  
  -- Contar turmas lideradas pelo usuário
  SELECT COUNT(*) INTO current_count
  FROM classes 
  WHERE leader_id = NEW.leader_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de liderança de turmas excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar limite de horários (time slots)
CREATE OR REPLACE FUNCTION check_time_slots_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar o limite configurado
  SELECT (setting_value->>'value')::INTEGER INTO max_limit
  FROM system_settings 
  WHERE setting_key = 'max_time_slots';
  
  -- Se não encontrou configuração, usar padrão de 12
  IF max_limit IS NULL THEN
    max_limit := 12;
  END IF;
  
  -- Contar time slots atuais do usuário
  SELECT COUNT(*) INTO current_count
  FROM user_time_slots 
  WHERE user_id = NEW.user_id;
  
  -- Verificar limite
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de horários excedido. Máximo permitido: %', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para aplicar as validações
CREATE TRIGGER trigger_check_subject_limit 
  BEFORE INSERT ON subjects 
  FOR EACH ROW EXECUTE FUNCTION check_subject_limit_before_insert();

CREATE TRIGGER trigger_check_notes_limit 
  BEFORE INSERT ON notes 
  FOR EACH ROW EXECUTE FUNCTION check_notes_limit_before_insert();

CREATE TRIGGER trigger_check_class_membership_limit 
  BEFORE INSERT ON class_members 
  FOR EACH ROW EXECUTE FUNCTION check_class_membership_limit_before_insert();

CREATE TRIGGER trigger_check_class_leadership_limit 
  BEFORE INSERT ON classes 
  FOR EACH ROW EXECUTE FUNCTION check_class_leadership_limit_before_insert();

CREATE TRIGGER trigger_check_time_slots_limit 
  BEFORE INSERT ON user_time_slots 
  FOR EACH ROW EXECUTE FUNCTION check_time_slots_limit_before_insert();