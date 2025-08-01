-- Limpar todos os dados dos usuários
DELETE FROM shared_content;
DELETE FROM guardian_connections;
DELETE FROM notifications;
DELETE FROM absence_subjects;
DELETE FROM absences;
DELETE FROM achievement_tracking;
DELETE FROM achievements;
DELETE FROM checklist_items;
DELETE FROM notes;
DELETE FROM schedule_slots;
DELETE FROM user_time_slots;
DELETE FROM subjects;
DELETE FROM profiles;

-- Remover tabelas do sistema de Anjo da Guarda
DROP TABLE IF EXISTS shared_content;
DROP TABLE IF EXISTS guardian_connections;
DROP TABLE IF EXISTS notifications;