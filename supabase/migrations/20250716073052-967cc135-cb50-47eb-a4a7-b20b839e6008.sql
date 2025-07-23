-- Remove configurações não desejadas
DELETE FROM system_settings 
WHERE setting_key IN ('max_absence_limit', 'theme_settings');

-- Adicionar novas configurações de limites
INSERT INTO system_settings (setting_key, setting_value, description, category, editable_by) 
VALUES 
  ('max_subjects_limit', '{"value": 10}', 'Limite máximo de matérias que cada usuário pode criar', 'academic', ARRAY['super_admin']),
  ('max_tasks_limit', '{"value": 50}', 'Limite máximo de tarefas que cada usuário pode criar', 'academic', ARRAY['super_admin']),
  ('max_class_memberships', '{"value": 5}', 'Limite máximo de turmas que um usuário pode participar', 'classes', ARRAY['super_admin']),
  ('max_class_leadership', '{"value": 2}', 'Limite máximo de turmas que um usuário pode liderar', 'classes', ARRAY['super_admin']),
  ('max_time_slots', '{"value": 12}', 'Limite máximo de horários na configuração de horários', 'schedule', ARRAY['super_admin']),
  ('max_semester_duration', '{"value": 6}', 'Duração máxima do semestre em meses', 'academic', ARRAY['super_admin'])
ON CONFLICT (setting_key) DO NOTHING;