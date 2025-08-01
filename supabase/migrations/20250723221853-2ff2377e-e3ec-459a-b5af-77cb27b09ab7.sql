-- Função segura para verificar se é professor
CREATE OR REPLACE FUNCTION public.is_teacher_safe(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE admin_roles.user_id = $1 
    AND role = 'teacher' 
    AND revoked_at IS NULL
  );
$$;

-- Função segura para verificar se é admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin_safe_teacher(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = $1 
    AND auth.users.email = 'suport154@gmail.com'
  ) OR EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE admin_roles.user_id = $1 
    AND role IN ('super_admin', 'admin') 
    AND revoked_at IS NULL
  );
$$;

-- Dropar todas as políticas existentes da tabela teacher_classes
DROP POLICY IF EXISTS "admin_all" ON public.teacher_classes;
DROP POLICY IF EXISTS "prof_own" ON public.teacher_classes;
DROP POLICY IF EXISTS "student_view" ON public.teacher_classes;

-- Criar novas políticas sem recursão
CREATE POLICY "Teachers can manage their own classes"
ON public.teacher_classes
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can view all teacher classes"
ON public.teacher_classes
FOR SELECT
TO authenticated
USING (is_admin_safe_teacher(auth.uid()));

CREATE POLICY "Students can view classes they joined"
ON public.teacher_classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students tcs
    WHERE tcs.class_id = teacher_classes.id 
    AND tcs.student_id = auth.uid()
  )
);