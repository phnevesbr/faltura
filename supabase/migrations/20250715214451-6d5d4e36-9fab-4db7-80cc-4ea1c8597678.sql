-- Migração para criar 20 usuários de exemplo com dados completos
-- Criar 20 perfis de usuários de exemplo
INSERT INTO public.profiles (
  user_id, email, course, university, shift, semester_start, semester_end, avatar
) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'ana.silva@email.com', 'Engenharia de Software', 'UFMG', 'morning', '2024-03-01', '2024-07-15', null),
  ('22222222-2222-2222-2222-222222222222', 'carlos.santos@email.com', 'Ciência da Computação', 'USP', 'afternoon', '2024-03-01', '2024-07-15', null),
  ('33333333-3333-3333-3333-333333333333', 'mariana.costa@email.com', 'Sistemas de Informação', 'UFRJ', 'morning', '2024-03-01', '2024-07-15', null),
  ('44444444-4444-4444-4444-444444444444', 'pedro.oliveira@email.com', 'Engenharia de Software', 'PUC-SP', 'evening', '2024-03-01', '2024-07-15', null),
  ('55555555-5555-5555-5555-555555555555', 'julia.ferreira@email.com', 'Ciência da Computação', 'UNICAMP', 'morning', '2024-03-01', '2024-07-15', null),
  ('66666666-6666-6666-6666-666666666666', 'rafael.rodrigues@email.com', 'Análise e Desenvolvimento', 'FATEC', 'evening', '2024-03-01', '2024-07-15', null),
  ('77777777-7777-7777-7777-777777777777', 'camila.pereira@email.com', 'Engenharia de Software', 'UFSC', 'afternoon', '2024-03-01', '2024-07-15', null),
  ('88888888-8888-8888-8888-888888888888', 'bruno.almeida@email.com', 'Ciência da Computação', 'UFRGS', 'morning', '2024-03-01', '2024-07-15', null),
  ('99999999-9999-9999-9999-999999999999', 'fernanda.lima@email.com', 'Sistemas de Informação', 'UFG', 'evening', '2024-03-01', '2024-07-15', null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'thiago.martins@email.com', 'Engenharia de Software', 'UFPR', 'morning', '2024-03-01', '2024-07-15', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'larissa.souza@email.com', 'Ciência da Computação', 'UnB', 'afternoon', '2024-03-01', '2024-07-15', null),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'gustavo.ribeiro@email.com', 'Análise e Desenvolvimento', 'IFSP', 'evening', '2024-03-01', '2024-07-15', null),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'isabela.carvalho@email.com', 'Engenharia de Software', 'UFBA', 'morning', '2024-03-01', '2024-07-15', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'lucas.barbosa@email.com', 'Ciência da Computação', 'UFC', 'afternoon', '2024-03-01', '2024-07-15', null),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'amanda.dias@email.com', 'Sistemas de Informação', 'UFPE', 'evening', '2024-03-01', '2024-07-15', null),
  ('10101010-1010-1010-1010-101010101010', 'rodrigo.nascimento@email.com', 'Engenharia de Software', 'UEL', 'morning', '2024-03-01', '2024-07-15', null),
  ('20202020-2020-2020-2020-202020202020', 'natalia.moreira@email.com', 'Ciência da Computação', 'UNESP', 'afternoon', '2024-03-01', '2024-07-15', null),
  ('30303030-3030-3030-3030-303030303030', 'felipe.cruz@email.com', 'Análise e Desenvolvimento', 'SENAC', 'evening', '2024-03-01', '2024-07-15', null),
  ('40404040-4040-4040-4040-404040404040', 'priscila.gomes@email.com', 'Engenharia de Software', 'UTFPR', 'morning', '2024-03-01', '2024-07-15', null),
  ('50505050-5050-5050-5050-505050505050', 'diego.cardoso@email.com', 'Ciência da Computação', 'UFS', 'afternoon', '2024-03-01', '2024-07-15', null);

-- Criar matérias típicas para cada usuário
INSERT INTO public.subjects (user_id, name, color, max_absences, current_absences, weekly_hours) VALUES
  -- Ana Silva
  ('11111111-1111-1111-1111-111111111111', 'Algoritmos e Estruturas de Dados', '#3B82F6', 15, 2, 4),
  ('11111111-1111-1111-1111-111111111111', 'Programação Orientada a Objetos', '#10B981', 15, 1, 4),
  ('11111111-1111-1111-1111-111111111111', 'Banco de Dados', '#F59E0B', 15, 0, 3),
  ('11111111-1111-1111-1111-111111111111', 'Engenharia de Software', '#8B5CF6', 15, 3, 4),
  
  -- Carlos Santos
  ('22222222-2222-2222-2222-222222222222', 'Cálculo I', '#EF4444', 15, 4, 6),
  ('22222222-2222-2222-2222-222222222222', 'Programação I', '#06B6D4', 15, 1, 4),
  ('22222222-2222-2222-2222-222222222222', 'Lógica Matemática', '#84CC16', 15, 2, 4),
  ('22222222-2222-2222-2222-222222222222', 'Arquitetura de Computadores', '#F97316', 15, 0, 4),
  
  -- Mariana Costa
  ('33333333-3333-3333-3333-333333333333', 'Sistemas Operacionais', '#EC4899', 15, 1, 4),
  ('33333333-3333-3333-3333-333333333333', 'Redes de Computadores', '#14B8A6', 15, 3, 4),
  ('33333333-3333-3333-3333-333333333333', 'Desenvolvimento Web', '#F59E0B', 15, 0, 4),
  ('33333333-3333-3333-3333-333333333333', 'Gestão de Projetos', '#8B5CF6', 15, 2, 3),
  
  -- Pedro Oliveira
  ('44444444-4444-4444-4444-444444444444', 'Mobile Development', '#3B82F6', 15, 1, 4),
  ('44444444-4444-4444-4444-444444444444', 'DevOps', '#10B981', 15, 2, 3),
  ('44444444-4444-4444-4444-444444444444', 'Segurança da Informação', '#EF4444', 15, 0, 4),
  ('44444444-4444-4444-4444-444444444444', 'Inteligência Artificial', '#8B5CF6', 15, 1, 4),
  
  -- Julia Ferreira  
  ('55555555-5555-5555-5555-555555555555', 'Machine Learning', '#06B6D4', 15, 3, 4),
  ('55555555-5555-5555-5555-555555555555', 'Compiladores', '#84CC16', 15, 1, 4),
  ('55555555-5555-5555-5555-555555555555', 'Teoria da Computação', '#F97316', 15, 2, 4),
  ('55555555-5555-5555-5555-555555555555', 'Computação Gráfica', '#EC4899', 15, 0, 4);

-- Continuar para mais usuários com menos matérias para variar
INSERT INTO public.subjects (user_id, name, color, max_absences, current_absences, weekly_hours) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Java Avançado', '#EF4444', 15, 1, 4),
  ('66666666-6666-6666-6666-666666666666', 'Spring Framework', '#10B981', 15, 0, 3),
  ('77777777-7777-7777-7777-777777777777', 'React Native', '#3B82F6', 15, 2, 4),
  ('77777777-7777-7777-7777-777777777777', 'Node.js', '#84CC16', 15, 1, 3),
  ('88888888-8888-8888-8888-888888888888', 'Python para Data Science', '#F59E0B', 15, 0, 4),
  ('88888888-8888-8888-8888-888888888888', 'Statistics', '#8B5CF6', 15, 3, 4),
  ('99999999-9999-9999-9999-999999999999', 'UX/UI Design', '#EC4899', 15, 1, 3),
  ('99999999-9999-9999-9999-999999999999', 'Metodologias Ágeis', '#14B8A6', 15, 2, 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cloud Computing', '#06B6D4', 15, 0, 4),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Blockchain', '#F97316', 15, 1, 3),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cybersecurity', '#EF4444', 15, 2, 4),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Game Development', '#8B5CF6', 15, 0, 4),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'IoT', '#10B981', 15, 1, 3),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Big Data', '#F59E0B', 15, 3, 4),
  ('10101010-1010-1010-1010-101010101010', 'Microservices', '#3B82F6', 15, 1, 3),
  ('20202020-2020-2020-2020-202020202020', 'Docker & Kubernetes', '#84CC16', 15, 0, 4),
  ('30303030-3030-3030-3030-303030303030', 'GraphQL', '#EC4899', 15, 2, 3),
  ('40404040-4040-4040-4040-404040404040', 'Flutter', '#14B8A6', 15, 1, 4),
  ('50505050-5050-5050-5050-505050505050', 'AWS Solutions', '#F97316', 15, 0, 3);

-- Criar níveis e XP para cada usuário
INSERT INTO public.user_levels (user_id, level, experience_points, total_experience, current_tier, level_progress) VALUES
  ('11111111-1111-1111-1111-111111111111', 15, 1750, 1750, 'veterano', 65.2),
  ('22222222-2222-2222-2222-222222222222', 8, 650, 650, 'calouro', 50.0),
  ('33333333-3333-3333-3333-333333333333', 22, 3200, 3200, 'veterano', 82.4),
  ('44444444-4444-4444-4444-444444444444', 12, 1100, 1100, 'veterano', 37.5),
  ('55555555-5555-5555-5555-555555555555', 28, 6500, 6500, 'expert', 37.5),
  ('66666666-6666-6666-6666-666666666666', 5, 400, 400, 'calouro', 0.0),
  ('77777777-7777-7777-7777-777777777777', 18, 2400, 2400, 'veterano', 52.4),
  ('88888888-8888-8888-8888-888888888888', 35, 9200, 9200, 'expert', 60.0),
  ('99999999-9999-9999-9999-999999999999', 7, 550, 550, 'calouro', 50.0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 25, 4800, 4800, 'veterano', 95.0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 31, 7800, 7800, 'expert', 70.0),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 9, 750, 750, 'calouro', 75.0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 20, 2900, 2900, 'veterano', 71.2),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 14, 1500, 1500, 'veterano', 87.3),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 42, 12800, 12800, 'expert', 95.0),
  ('10101010-1010-1010-1010-101010101010', 16, 1900, 1900, 'veterano', 21.3),
  ('20202020-2020-2020-2020-202020202020', 26, 5200, 5200, 'expert', 5.0),
  ('30303030-3030-3030-3030-303030303030', 11, 950, 950, 'calouro', 95.0),
  ('40404040-4040-4040-4040-404040404040', 38, 10500, 10500, 'expert', 87.5),
  ('50505050-5050-5050-5050-505050505050', 52, 16200, 16200, 'lenda', 15.0);

-- Criar algumas conquistas para os usuários
INSERT INTO public.achievements (user_id, achievement_id, name, description, icon, category, rarity, experience_reward) VALUES
  ('11111111-1111-1111-1111-111111111111', 'first_task_completed', 'Primeira Tarefa', 'Completou sua primeira tarefa', '✅', 'productivity', 'common', 50),
  ('11111111-1111-1111-1111-111111111111', 'week_streak', 'Semana Produtiva', 'Completou tarefas por 7 dias seguidos', '🔥', 'consistency', 'uncommon', 100),
  ('22222222-2222-2222-2222-222222222222', 'first_subject', 'Primeira Matéria', 'Adicionou sua primeira matéria', '📚', 'academic', 'common', 25),
  ('33333333-3333-3333-3333-333333333333', 'attendance_master', 'Presença Exemplar', 'Não faltou nenhuma vez no mês', '🎯', 'attendance', 'rare', 200),
  ('44444444-4444-4444-4444-444444444444', 'level_10', 'Veterano', 'Alcançou o nível 10', '⭐', 'progression', 'uncommon', 150),
  ('55555555-5555-5555-5555-555555555555', 'expert_tier', 'Especialista', 'Alcançou o tier Expert', '💎', 'progression', 'rare', 300),
  ('66666666-6666-6666-6666-666666666666', 'early_bird', 'Madrugador', 'Completou tarefa antes das 8h', '🌅', 'productivity', 'common', 75),
  ('77777777-7777-7777-7777-777777777777', 'note_taker', 'Anotador', 'Criou 10 anotações', '📝', 'productivity', 'uncommon', 125),
  ('88888888-8888-8888-8888-888888888888', 'high_achiever', 'Alto Desempenho', 'Manteve média alta por 3 meses', '🏆', 'academic', 'epic', 500),
  ('99999999-9999-9999-9999-999999999999', 'social_butterfly', 'Social', 'Participou de 5 grupos de estudo', '🦋', 'social', 'uncommon', 100),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'perfectionist', 'Perfeccionista', 'Completou 20 tarefas sem erros', '💯', 'productivity', 'rare', 250),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'night_owl', 'Coruja', 'Estudou após meia-noite 10 vezes', '🦉', 'dedication', 'uncommon', 100),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'organizer', 'Organizador', 'Manteve agenda atualizada por 30 dias', '📅', 'organization', 'rare', 200),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'code_warrior', 'Guerreiro do Código', 'Resolveu 50 exercícios de programação', '⚔️', 'programming', 'rare', 300),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'team_player', 'Jogador de Equipe', 'Ajudou 10 colegas com dúvidas', '🤝', 'social', 'uncommon', 150),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'legend', 'Lenda Viva', 'Alcançou o tier Lenda', '👑', 'progression', 'legendary', 1000),
  ('10101010-1010-1010-1010-101010101010', 'dedicated_student', 'Estudante Dedicado', 'Estudou por 100 horas', '📖', 'dedication', 'rare', 250),
  ('20202020-2020-2020-2020-202020202020', 'tech_enthusiast', 'Entusiasta Tech', 'Explorou 5 tecnologias diferentes', '💻', 'learning', 'uncommon', 125),
  ('30303030-3030-3030-3030-303030303030', 'fast_learner', 'Aprendiz Rápido', 'Completou curso em tempo recorde', '⚡', 'learning', 'rare', 200),
  ('50505050-5050-5050-5050-505050505050', 'ultimate_master', 'Mestre Supremo', 'Dominou todas as competências', '🌟', 'mastery', 'legendary', 1500);

-- Criar algumas faltas para simular dados reais
INSERT INTO public.absences (user_id, date) VALUES
  ('11111111-1111-1111-1111-111111111111', '2024-03-15'),
  ('11111111-1111-1111-1111-111111111111', '2024-04-02'),
  ('22222222-2222-2222-2222-222222222222', '2024-03-20'),
  ('22222222-2222-2222-2222-222222222222', '2024-04-10'),
  ('22222222-2222-2222-2222-222222222222', '2024-05-03'),
  ('33333333-3333-3333-3333-333333333333', '2024-03-25'),
  ('44444444-4444-4444-4444-444444444444', '2024-04-15'),
  ('55555555-5555-5555-5555-555555555555', '2024-03-30'),
  ('55555555-5555-5555-5555-555555555555', '2024-05-08'),
  ('77777777-7777-7777-7777-777777777777', '2024-04-22'),
  ('88888888-8888-8888-8888-888888888888', '2024-03-18'),
  ('99999999-9999-9999-9999-999999999999', '2024-04-05'),
  ('99999999-9999-9999-9999-999999999999', '2024-05-12'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-03-28'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-04-18'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-05-05'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-03-22'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '2024-04-12'),
  ('10101010-1010-1010-1010-101010101010', '2024-05-01'),
  ('30303030-3030-3030-3030-303030303030', '2024-04-25');

-- Criar anotações e tarefas para os usuários
INSERT INTO public.notes (user_id, title, description, type, priority, status, date, completed) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Estudar para prova de Algoritmos', 'Revisar árvores binárias e ordenação', 'task', 'high', 'in_progress', '2024-07-20', false),
  ('11111111-1111-1111-1111-111111111111', 'Projeto de POO', 'Implementar sistema de biblioteca', 'assignment', 'medium', 'pending', '2024-07-25', false),
  ('11111111-1111-1111-1111-111111111111', 'Entrega do relatório', 'Relatório de estágio completo', 'assignment', 'high', 'completed', '2024-07-15', true),
  
  ('22222222-2222-2222-2222-222222222222', 'Lista de Cálculo I', 'Exercícios 15-30 do capítulo 3', 'task', 'medium', 'pending', '2024-07-22', false),
  ('22222222-2222-2222-2222-222222222222', 'Seminário de Lógica', 'Preparar apresentação sobre proposições', 'presentation', 'high', 'in_progress', '2024-07-24', false),
  
  ('33333333-3333-3333-3333-333333333333', 'Configurar servidor Linux', 'Instalar e configurar Apache', 'task', 'medium', 'completed', '2024-07-18', true),
  ('33333333-3333-3333-3333-333333333333', 'Documentar API REST', 'Criar documentação no Swagger', 'task', 'low', 'in_progress', '2024-07-26', false),
  
  ('44444444-4444-4444-4444-444444444444', 'App mobile Flutter', 'Desenvolver tela de login', 'assignment', 'high', 'in_progress', '2024-07-28', false),
  ('44444444-4444-4444-4444-444444444444', 'Estudar Machine Learning', 'Curso de regressão linear', 'study', 'medium', 'pending', '2024-08-01', false),
  
  ('55555555-5555-5555-5555-555555555555', 'Artigo científico', 'Pesquisa sobre redes neurais', 'research', 'high', 'in_progress', '2024-08-05', false),
  ('55555555-5555-5555-5555-555555555555', 'Implementar algoritmo genético', 'Para o projeto de IA', 'assignment', 'medium', 'pending', '2024-07-30', false),
  
  ('66666666-6666-6666-6666-666666666666', 'Prova de Java', 'Revisar polimorfismo e herança', 'exam', 'high', 'pending', '2024-07-23', false),
  ('77777777-7777-7777-7777-777777777777', 'Deploy da aplicação', 'Subir app React Native na Play Store', 'task', 'medium', 'in_progress', '2024-08-02', false),
  ('88888888-8888-8888-8888-888888888888', 'Análise de dados', 'Dataset de vendas com Python', 'assignment', 'high', 'completed', '2024-07-16', true),
  ('99999999-9999-9999-9999-999999999999', 'Protótipo UX', 'Figma do app de delivery', 'design', 'medium', 'in_progress', '2024-07-27', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Migração para AWS', 'Mover aplicação para a nuvem', 'task', 'high', 'pending', '2024-08-03', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Smart contract', 'Desenvolver contrato para marketplace NFT', 'assignment', 'medium', 'in_progress', '2024-07-31', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pentesting básico', 'Teste de penetração em app web', 'task', 'high', 'pending', '2024-07-29', false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Game em Unity', 'Plataforma 2D com física', 'assignment', 'medium', 'in_progress', '2024-08-04', false),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sensor IoT', 'Programar Arduino para monitoramento', 'task', 'low', 'completed', '2024-07-17', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Pipeline de dados', 'ETL com Spark e Hadoop', 'assignment', 'high', 'in_progress', '2024-08-06', false);

-- Criar algumas preferências de tema para usuários
INSERT INTO public.user_preferences (user_id, theme_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'blue'),
  ('22222222-2222-2222-2222-222222222222', 'green'),
  ('33333333-3333-3333-3333-333333333333', 'purple'),
  ('44444444-4444-4444-4444-444444444444', 'orange'),
  ('55555555-5555-5555-5555-555555555555', 'pink'),
  ('66666666-6666-6666-6666-666666666666', 'red'),
  ('77777777-7777-7777-7777-777777777777', 'cyan'),
  ('88888888-8888-8888-8888-888888888888', 'yellow'),
  ('99999999-9999-9999-9999-999999999999', 'indigo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'default');

-- Criar alguns dados de tracking para conquistas
INSERT INTO public.achievement_tracking (user_id, tracking_type, tracking_data, date_tracked) VALUES
  ('11111111-1111-1111-1111-111111111111', 'task_completion', '{"tasks_completed": 15, "week_streak": 7}', '2024-07-15'),
  ('22222222-2222-2222-2222-222222222222', 'subject_added', '{"subjects_count": 4}', '2024-07-15'),
  ('33333333-3333-3333-3333-333333333333', 'attendance', '{"days_present": 30, "month": "june"}', '2024-07-15'),
  ('44444444-4444-4444-4444-444444444444', 'level_progress', '{"level_reached": 12, "xp_gained": 150}', '2024-07-15'),
  ('55555555-5555-5555-5555-555555555555', 'tier_upgrade', '{"new_tier": "expert", "previous_tier": "veterano"}', '2024-07-15'),
  ('88888888-8888-8888-8888-888888888888', 'grade_tracking', '{"average_grade": 9.2, "months_consistent": 3}', '2024-07-15'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'mastery', '{"skills_mastered": 15, "tier": "lenda"}', '2024-07-15');