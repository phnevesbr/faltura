import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { useAchievements } from './AchievementsContext';
import { supabase } from '../integrations/supabase/client';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'exam' | 'assignment' | 'activity';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  checklist: ChecklistItem[];
  completed: boolean;
  createdAt: Date;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'priority' | 'status' | 'checklist'> & {
    priority?: 'high' | 'medium' | 'low';
    status?: 'pending' | 'in_progress' | 'completed';
    checklist?: ChecklistItem[];
  }) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getUpcomingNotes: () => Note[];
  getTodayNotes: () => Note[];
  addChecklistItem: (noteId: string, text: string) => Promise<void>;
  updateChecklistItem: (noteId: string, itemId: string, updates: Partial<ChecklistItem>) => Promise<void>;
  deleteChecklistItem: (noteId: string, itemId: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { awardNoteCreationXP, awardNoteCompletionXP } = useGamification();
  const { trackNoteCreated } = useAchievements();
  const [notes, setNotes] = useState<Note[]>([]);

  // Load notes when user changes
  useEffect(() => {
    if (user) {
      loadNotes();
    } else {
      setNotes([]);
    }
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    try {
      const { data: notesData } = await supabase
        .from('notes')
        .select(`
          *,
          checklist_items (
            id,
            text,
            completed
          )
        `)
        .eq('user_id', user.id);

      if (notesData) {
        const formattedNotes = notesData.map((note: any) => ({
          id: note.id,
          title: note.title,
          description: note.description || '',
          date: new Date(note.date),
          type: note.type as 'exam' | 'assignment' | 'activity',
          priority: note.priority as 'high' | 'medium' | 'low',
          status: note.status as 'pending' | 'in_progress' | 'completed',
          completed: note.completed,
          createdAt: new Date(note.created_at),
          checklist: note.checklist_items.map((item: any) => ({
            id: item.id,
            text: item.text,
            completed: item.completed
          }))
        }));
        setNotes(formattedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const addNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'priority' | 'status' | 'checklist'> & {
    priority?: 'high' | 'medium' | 'low';
    status?: 'pending' | 'in_progress' | 'completed';
    checklist?: ChecklistItem[];
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: noteData.title,
          description: noteData.description,
          date: noteData.date.toISOString().split('T')[0],
          type: noteData.type,
          priority: noteData.priority || 'medium',
          status: noteData.status || 'pending',
          completed: noteData.completed
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        date: new Date(data.date),
        type: data.type as 'exam' | 'assignment' | 'activity',
        priority: data.priority as 'high' | 'medium' | 'low',
        status: data.status as 'pending' | 'in_progress' | 'completed',
        completed: data.completed,
        createdAt: new Date(data.created_at),
        checklist: []
      };

      // Add checklist items if provided
      if (noteData.checklist && noteData.checklist.length > 0) {
        for (const item of noteData.checklist) {
          await addChecklistItem(newNote.id, item.text);
        }
      }

      await loadNotes(); // Reload to get updated data with checklist
      await awardNoteCreationXP();
      trackNoteCreated();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;

    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString().split('T')[0];
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

      const { error } = await supabase
        .from('notes')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ));

      // Award XP if note is being marked as completed
      if (updates.completed === true && !notes.find(n => n.id === id)?.completed) {
        await awardNoteCompletionXP();
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getUpcomingNotes = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return notes.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= today && noteDate <= nextWeek && !note.completed;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getTodayNotes = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    return notes.filter(note => {
      const noteDate = new Date(note.date);
      noteDate.setHours(0, 0, 0, 0);
      return noteDate >= today && noteDate < tomorrow;
    });
  };

  const addChecklistItem = async (noteId: string, text: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert({
          note_id: noteId,
          text,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: ChecklistItem = {
        id: data.id,
        text: data.text,
        completed: data.completed
      };

      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, checklist: [...note.checklist, newItem] }
          : note
      ));
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const updateChecklistItem = async (noteId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    if (!user) return;

    try {
      const dbUpdates: any = {};
      if (updates.text !== undefined) dbUpdates.text = updates.text;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

      const { error } = await supabase
        .from('checklist_items')
        .update(dbUpdates)
        .eq('id', itemId);

      if (error) throw error;

      setNotes(prev => prev.map(note =>
        note.id === noteId 
          ? {
              ...note,
              checklist: note.checklist.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            }
          : note
      ));
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const deleteChecklistItem = async (noteId: string, itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setNotes(prev => prev.map(note =>
        note.id === noteId 
          ? {
              ...note,
              checklist: note.checklist.filter(item => item.id !== itemId)
            }
          : note
      ));
    } catch (error) {
      console.error('Error deleting checklist item:', error);
    }
  };

  return (
    <NotesContext.Provider value={{
      notes,
      addNote,
      updateNote,
      deleteNote,
      getUpcomingNotes,
      getTodayNotes,
      addChecklistItem,
      updateChecklistItem,
      deleteChecklistItem
    }}>
      {children}
    </NotesContext.Provider>
  );
};