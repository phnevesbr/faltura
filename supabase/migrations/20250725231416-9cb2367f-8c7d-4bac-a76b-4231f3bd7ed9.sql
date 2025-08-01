-- Create table for class alerts/messages
CREATE TABLE public.class_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium'::text CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.class_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for class alerts
CREATE POLICY "Class members can view alerts" 
ON public.class_alerts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM class_members 
    WHERE class_members.class_id = class_alerts.class_id 
    AND class_members.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_alerts.class_id 
    AND classes.leader_id = auth.uid()
  )
);

CREATE POLICY "Class leaders can create alerts" 
ON public.class_alerts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_alerts.class_id 
    AND classes.leader_id = auth.uid()
  ) AND auth.uid() = user_id
);

CREATE POLICY "Class leaders can update their own alerts" 
ON public.class_alerts 
FOR UPDATE 
USING (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_alerts.class_id 
    AND classes.leader_id = auth.uid()
  )
);

CREATE POLICY "Class leaders can delete their own alerts" 
ON public.class_alerts 
FOR DELETE 
USING (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_alerts.class_id 
    AND classes.leader_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_class_alerts_updated_at
BEFORE UPDATE ON public.class_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.class_alerts 
ADD CONSTRAINT class_alerts_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_class_alerts_class_id ON public.class_alerts(class_id);
CREATE INDEX idx_class_alerts_created_at ON public.class_alerts(created_at DESC);