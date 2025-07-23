-- Corrigir o problema de recursão infinita na política de admin_roles
-- Primeiro, removemos as políticas problemáticas
DROP POLICY IF EXISTS "Allow super admins to manage roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow bootstrap admin full access" ON public.admin_roles;

-- Criar função de segurança para verificar admin status
CREATE OR REPLACE FUNCTION public.is_super_admin_safe(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE admin_roles.user_id = $1 
    AND role = 'super_admin' 
    AND revoked_at IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 
    AND email = 'suport154@gmail.com'
  );
$$;

-- Recriar as políticas sem recursão
CREATE POLICY "Allow bootstrap admin full access"
ON public.admin_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND email = 'suport154@gmail.com'
  )
);

CREATE POLICY "Allow super admins to manage roles"
ON public.admin_roles
FOR ALL
TO authenticated
USING (
  public.is_super_admin_safe(auth.uid())
);

-- Verificar se a coluna created_at existe na tabela achievement_tracking
-- Se não existir, vamos garantir que existe
ALTER TABLE public.achievement_tracking 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Criar configurações padrão do sistema se não existirem
INSERT INTO public.system_settings (setting_key, setting_value, description, category)
VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção. Voltaremos em breve."}', 'Controla o modo de manutenção do sistema', 'system'),
  ('registration_enabled', '{"enabled": true}', 'Permite novos registros de usuários', 'auth'),
  ('notification_settings', '{"email_enabled": true, "push_enabled": false}', 'Configurações de notificações', 'notifications'),
  ('max_absence_limit', '{"value": 25}', 'Limite máximo de faltas por matéria', 'academic'),
  ('upload_size_limit', '{"value": 10}', 'Limite de tamanho de upload em MB', 'system'),
  ('achievement_multiplier', '{"value": 1.0}', 'Multiplicador de experiência para conquistas', 'gamification')
ON CONFLICT (setting_key) DO NOTHING;