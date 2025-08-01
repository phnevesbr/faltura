-- Tornar o usuário atual um super admin bootstrap
INSERT INTO public.admin_roles (user_id, role, permissions, granted_by)
SELECT 
  '1693f7ea-c704-4d66-a6e1-e8d9b188061c',
  'super_admin',
  '{"analytics": true, "system_config": true, "user_management": true, "class_management": true}'::jsonb,
  '1693f7ea-c704-4d66-a6e1-e8d9b188061c'
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_roles 
  WHERE user_id = '1693f7ea-c704-4d66-a6e1-e8d9b188061c'
);