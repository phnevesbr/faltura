-- Corrigir políticas RLS para class_members para permitir que membros vejam outros membros da turma

-- Primeiro, remover a política restritiva para membros
DROP POLICY IF EXISTS "Users can view their own membership" ON public.class_members;

-- Criar nova política que permite membros verem outros membros da mesma turma
CREATE POLICY "Members can view all members of their classes" 
ON public.class_members 
FOR SELECT 
USING (
  -- Usuário pode ver membros se ele é membro da mesma turma OU se é líder da turma
  EXISTS (
    SELECT 1 FROM public.class_members cm 
    WHERE cm.class_id = class_members.class_id 
    AND cm.user_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_members.class_id 
    AND c.leader_id = auth.uid()
  )
);

-- Manter as políticas existentes para líderes e adicionar política para inserção pelos próprios usuários
-- A política "Leaders can view all members of their classes" já existe
-- A política "Users can add themselves to classes" já existe
-- A política "Users can remove their own membership" já existe

-- Verificar se a função is_admin está funcionando corretamente
-- Vamos criar uma função auxiliar para verificar permissões de admin sem recursão
CREATE OR REPLACE FUNCTION public.check_admin_permissions(user_id_param uuid, required_permission text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  user_permissions jsonb;
  is_bootstrap boolean;
BEGIN
  -- Verificar se é bootstrap admin
  SELECT is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = user_id_param)) INTO is_bootstrap;
  
  IF is_bootstrap THEN
    RETURN true;
  END IF;
  
  -- Buscar role e permissões do usuário
  SELECT role, permissions INTO user_role, user_permissions
  FROM admin_roles 
  WHERE user_id = user_id_param 
  AND revoked_at IS NULL 
  ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2  
      WHEN 'moderator' THEN 3
      ELSE 4
    END
  LIMIT 1;
  
  -- Se não tem role, não é admin
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Se é super_admin, tem todas as permissões
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Se não especificou permissão específica, qualquer admin/moderator serve
  IF required_permission IS NULL THEN
    RETURN user_role IN ('admin', 'moderator');
  END IF;
  
  -- Verificar permissão específica no JSON
  RETURN COALESCE((user_permissions->required_permission)::boolean, false);
END;
$$;

-- Atualizar função is_admin para usar a nova função
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT 
    CASE 
      WHEN user_id IS NULL THEN false
      ELSE public.check_admin_permissions(user_id)
    END;
$function$;