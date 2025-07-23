-- Create semester history table
CREATE TABLE public.semester_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course TEXT,
  university TEXT,
  shift TEXT,
  semester_start DATE NOT NULL,
  semester_end DATE NOT NULL,
  subjects_data JSONB DEFAULT '[]'::jsonb,
  grades_data JSONB DEFAULT '[]'::jsonb,
  absences_data JSONB DEFAULT '[]'::jsonb,
  notes_data JSONB DEFAULT '[]'::jsonb,
  achievements_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.semester_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own semester history" 
ON public.semester_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own semester history" 
ON public.semester_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own semester history" 
ON public.semester_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_semester_history_updated_at
BEFORE UPDATE ON public.semester_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();