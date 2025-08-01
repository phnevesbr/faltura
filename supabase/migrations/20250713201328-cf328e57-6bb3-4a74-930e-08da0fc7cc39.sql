-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  avatar TEXT,
  course TEXT,
  university TEXT,
  shift TEXT CHECK (shift IN ('morning', 'afternoon', 'night')),
  semester_start DATE,
  semester_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weekly_hours INTEGER NOT NULL DEFAULT 2,
  color TEXT NOT NULL,
  max_absences INTEGER NOT NULL DEFAULT 15,
  current_absences INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule_slots table
CREATE TABLE public.schedule_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day >= 0 AND day <= 4),
  time_slot INTEGER NOT NULL CHECK (time_slot >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day, time_slot)
);

-- Create absences table
CREATE TABLE public.absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create absence_subjects table (many-to-many for subjects in an absence)
CREATE TABLE public.absence_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  absence_id UUID NOT NULL REFERENCES public.absences(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exam', 'assignment', 'activity')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist_items table for notes
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('integration', 'consistency', 'secret')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_secret BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for subjects
CREATE POLICY "Users can view their own subjects" ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subjects" ON public.subjects FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for schedule_slots
CREATE POLICY "Users can view their own schedule" ON public.schedule_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own schedule" ON public.schedule_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own schedule" ON public.schedule_slots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own schedule" ON public.schedule_slots FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for absences
CREATE POLICY "Users can view their own absences" ON public.absences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own absences" ON public.absences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own absences" ON public.absences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own absences" ON public.absences FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for absence_subjects
CREATE POLICY "Users can view their own absence subjects" ON public.absence_subjects 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.absences WHERE absences.id = absence_subjects.absence_id AND absences.user_id = auth.uid())
);
CREATE POLICY "Users can create their own absence subjects" ON public.absence_subjects 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.absences WHERE absences.id = absence_subjects.absence_id AND absences.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own absence subjects" ON public.absence_subjects 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.absences WHERE absences.id = absence_subjects.absence_id AND absences.user_id = auth.uid())
);

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for checklist_items
CREATE POLICY "Users can view their own checklist items" ON public.checklist_items 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND notes.user_id = auth.uid())
);
CREATE POLICY "Users can create their own checklist items" ON public.checklist_items 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND notes.user_id = auth.uid())
);
CREATE POLICY "Users can update their own checklist items" ON public.checklist_items 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND notes.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own checklist items" ON public.checklist_items 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND notes.user_id = auth.uid())
);

-- Create RLS policies for achievements
CREATE POLICY "Users can view their own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.achievements FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON public.checklist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, course, university, shift, semester_start, semester_end)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'course', ''),
    '',
    'morning',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '4 months'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();