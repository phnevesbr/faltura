-- Criar tabela para conexões "Anjo da Guarda"
CREATE TABLE public.guardian_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  guardian_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, guardian_id)
);

-- Habilitar RLS
ALTER TABLE public.guardian_connections ENABLE ROW LEVEL SECURITY;

-- Políticas para guardian_connections
CREATE POLICY "Users can view their connections" 
ON public.guardian_connections 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = guardian_id);

CREATE POLICY "Users can create connections for themselves" 
ON public.guardian_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connections" 
ON public.guardian_connections 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = guardian_id);

CREATE POLICY "Users can delete their connections" 
ON public.guardian_connections 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = guardian_id);

-- Criar tabela para conteúdo compartilhado por anjos da guarda
CREATE TABLE public.shared_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  absence_id UUID NOT NULL,
  guardian_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;

-- Políticas para shared_content
CREATE POLICY "Users can view content for their absences" 
ON public.shared_content 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM absences 
    WHERE absences.id = shared_content.absence_id 
    AND absences.user_id = auth.uid()
  ) 
  OR auth.uid() = guardian_id
);

CREATE POLICY "Guardians can create content" 
ON public.shared_content 
FOR INSERT 
WITH CHECK (auth.uid() = guardian_id);

CREATE POLICY "Guardians can update their content" 
ON public.shared_content 
FOR UPDATE 
USING (auth.uid() = guardian_id);

CREATE POLICY "Guardians can delete their content" 
ON public.shared_content 
FOR DELETE 
USING (auth.uid() = guardian_id);

-- Criar tabela para notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('guardian_invite', 'absence_help_request', 'content_shared')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Users can view their notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_guardian_connections_updated_at
  BEFORE UPDATE ON public.guardian_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_content_updated_at
  BEFORE UPDATE ON public.shared_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();