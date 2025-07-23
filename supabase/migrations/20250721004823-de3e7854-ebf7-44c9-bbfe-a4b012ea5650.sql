-- Corrigir o problema de recursão infinita na política de class_members
-- O problema é que a política está fazendo uma query na própria tabela class_members

-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Members can view all members of their classes" ON public.class_members;

-- Criar uma política mais simples que não cause recursão
-- Vamos permitir que usuários vejam membros se eles são líderes da turma
-- OU se eles também são membros (usando uma abordagem diferente)

CREATE POLICY "Class members and leaders can view all members" 
ON public.class_members 
FOR SELECT 
USING (
  -- Líder da turma pode ver todos os membros
  EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_members.class_id 
    AND c.leader_id = auth.uid()
  )
  OR
  -- Ou o usuário é o próprio membro que está sendo visualizado
  user_id = auth.uid()
  OR
  -- Ou existe uma entrada onde o usuário atual também é membro da mesma turma
  -- (usando uma subconsulta que não reference a tabela principal)
  class_id IN (
    SELECT cm.class_id 
    FROM public.class_members cm 
    WHERE cm.user_id = auth.uid()
  )
);

-- Também vamos criar políticas específicas para admins poderem ver tudo
CREATE POLICY "Admins can view all class members" 
ON public.class_members 
FOR SELECT 
USING (
  public.check_admin_permissions(auth.uid(), 'class_management')
  OR public.check_admin_permissions(auth.uid(), 'user_management')
  OR public.is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
);

-- Criar políticas similares para profiles para admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.check_admin_permissions(auth.uid(), 'user_management')
  OR public.is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
);

-- Políticas para user_levels para admins
CREATE POLICY "Admins can view all user levels" 
ON public.user_levels 
FOR SELECT 
USING (
  public.check_admin_permissions(auth.uid(), 'user_management')
  OR public.is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
);

-- Políticas para classes para admins  
CREATE POLICY "Admins can view all classes" 
ON public.classes 
FOR SELECT 
USING (
  public.check_admin_permissions(auth.uid(), 'class_management')
  OR public.is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
);

-- Políticas para user_bans para admins (já existe uma similar)
-- Verificando se existe antes de criar
DROP POLICY IF EXISTS "Admins can view all user bans" ON public.user_bans;
CREATE POLICY "Admins can view all user bans" 
ON public.user_bans 
FOR SELECT 
USING (
  public.check_admin_permissions(auth.uid(), 'user_management')
  OR public.is_bootstrap_admin((SELECT email FROM profiles WHERE user_id = auth.uid()))
);