-- CORREÇÃO DEFINITIVA: Remover todas as políticas problemáticas e recriar de forma segura

-- 1. Primeiro, remover todas as políticas existentes da tabela teacher_classes
DROP POLICY IF EXISTS "Bootstrap admin access" ON public.teacher_classes;
DROP POLICY IF EXISTS "Teachers manage own classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "Students view enrolled classes" ON public.teacher_classes;

-- 2. Criar funções de segurança simples e seguras
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin_direct(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND email = 'suport154@gmail.com'
  );
$$;

-- 3. Função para verificar se é teacher sem recursão
CREATE OR REPLACE FUNCTION public.is_teacher_direct(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_id_param 
    AND role = 'teacher' 
    AND revoked_at IS NULL
  );
$$;

-- 4. Recriar políticas de forma simples e direta
CREATE POLICY "Teachers can manage their classes" ON public.teacher_classes
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Bootstrap admin can view all classes" ON public.teacher_classes
FOR SELECT
TO authenticated
USING (is_bootstrap_admin_direct(auth.uid()));

CREATE POLICY "Students can view their enrolled classes" ON public.teacher_classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_class_students tcs
    WHERE tcs.class_id = teacher_classes.id 
    AND tcs.student_id = auth.uid()
  )
);

-- 5. Garantir que a função de geração de código está funcionando
CREATE OR REPLACE FUNCTION public.generate_class_code_safe()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Gerar código de 6 caracteres aleatórios
    new_code := UPPER(
      SUBSTRING(
        REPLACE(
          REPLACE(
            REPLACE(encode(gen_random_bytes(4), 'base64'), '/', ''), 
            '+', ''
          ), 
          '=', ''
        ) 
        FROM 1 FOR 6
      )
    );
    
    -- Verificar se o código já existe
    SELECT EXISTS(
      SELECT 1 FROM public.teacher_classes 
      WHERE class_code = new_code
    ) INTO code_exists;
    
    attempts := attempts + 1;
    
    -- Se não existe ou tentamos muito, retornar o código
    IF NOT code_exists OR attempts > 10 THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- 6. Criar trigger para auto-gerar códigos se necessário
CREATE OR REPLACE FUNCTION public.auto_generate_class_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se não foi fornecido um código ou está vazio, gerar automaticamente
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    NEW.class_code := generate_class_code_safe();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger apenas se não existir
DROP TRIGGER IF EXISTS trigger_auto_generate_class_code ON public.teacher_classes;
CREATE TRIGGER trigger_auto_generate_class_code
  BEFORE INSERT ON public.teacher_classes
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_class_code();