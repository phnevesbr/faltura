-- Criar tabela de turmas
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  leader_id UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de membros da turma
CREATE TABLE public.class_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Criar tabela de convites
CREATE TABLE public.class_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE NULL
);

-- Criar tabela de notificações de falta
CREATE TABLE public.absence_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  absence_date DATE NOT NULL,
  subjects TEXT[] NOT NULL,
  content_sent BOOLEAN NOT NULL DEFAULT false,
  content_sender_id UUID NULL,
  content_text TEXT NULL,
  content_photos TEXT[] NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  content_sent_at TIMESTAMP WITH TIME ZONE NULL
);

-- Habilitar RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para classes
CREATE POLICY "Users can view classes they're members of" 
ON public.classes 
FOR SELECT 
USING (
  auth.uid() = leader_id OR 
  EXISTS (
    SELECT 1 FROM public.class_members 
    WHERE class_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create classes" 
ON public.classes 
FOR INSERT 
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update their classes" 
ON public.classes 
FOR UPDATE 
USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete their classes" 
ON public.classes 
FOR DELETE 
USING (auth.uid() = leader_id);

-- Políticas para class_members
CREATE POLICY "Users can view members of their classes" 
ON public.class_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_id AND (
      leader_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.class_members cm2 
        WHERE cm2.class_id = id AND cm2.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Leaders can add members" 
ON public.class_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_id AND leader_id = auth.uid()
  )
);

CREATE POLICY "Users can remove themselves from classes" 
ON public.class_members 
FOR DELETE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_id AND leader_id = auth.uid()
  )
);

-- Políticas para class_invites
CREATE POLICY "Users can view invites they sent or received" 
ON public.class_invites 
FOR SELECT 
USING (
  inviter_id = auth.uid() OR 
  invitee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND email = invitee_email
  )
);

CREATE POLICY "Leaders can create invites" 
ON public.class_invites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_id AND leader_id = auth.uid()
  )
);

CREATE POLICY "Invitees can update invite status" 
ON public.class_invites 
FOR UPDATE 
USING (
  invitee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND email = invitee_email
  )
);

-- Políticas para absence_notifications
CREATE POLICY "Class members can view absence notifications" 
ON public.absence_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.class_members 
    WHERE class_id = absence_notifications.class_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = absence_notifications.class_id AND leader_id = auth.uid()
  )
);

CREATE POLICY "Class members can create absence notifications" 
ON public.absence_notifications 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.class_members 
    WHERE class_id = absence_notifications.class_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Class members can update absence notifications" 
ON public.absence_notifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.class_members 
    WHERE class_id = absence_notifications.class_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = absence_notifications.class_id AND leader_id = auth.uid()
  )
);

-- Criar trigger para updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para verificar limites de membros
CREATE OR REPLACE FUNCTION check_class_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM public.class_members 
    WHERE class_id = NEW.class_id
  ) >= (
    SELECT max_members 
    FROM public.classes 
    WHERE id = NEW.class_id
  ) THEN
    RAISE EXCEPTION 'Turma já atingiu o limite máximo de membros';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para verificar limite de membros
CREATE TRIGGER check_member_limit_trigger
  BEFORE INSERT ON public.class_members
  FOR EACH ROW
  EXECUTE FUNCTION check_class_member_limit();