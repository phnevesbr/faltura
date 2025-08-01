import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useSystemLimits } from '../hooks/useSystemLimits';
import { useRateLimit } from '../hooks/useRateLimit';
import { toast } from 'sonner';

export interface AcademicProfile {
  id: string;
  name?: string;
  avatar?: string;
  course: string;
  university: string;
  shift: 'morning' | 'afternoon' | 'night';
  semesterStart: string;
  semesterEnd: string;
  createdAt: string;
  updatedAt: string;
}

interface SemesterHistory {
  id: string;
  course: string;
  university: string;
  shift: string;
  semesterStart: string;
  semesterEnd: string;
  subjectsData: any[];
  gradesData: any[];
  absencesData: any[];
  notesData: any[];
  achievementsData: any[];
  createdAt: string;
}

interface ProfileContextType {
  profile: AcademicProfile | null;
  semesterHistory: SemesterHistory[];
  updateProfile: (updates: Partial<AcademicProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  getDaysUntilSemesterEnd: () => number;
  archiveSemester: () => Promise<void>;
  startNewSemester: (semesterStart: string, semesterEnd: string) => Promise<void>;
  deleteSemesterHistory: (semesterId: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { limits } = useSystemLimits();
  const { checkRateLimit } = useRateLimit();
  const [profile, setProfile] = useState<AcademicProfile | null>(null);
  const [semesterHistory, setSemesterHistory] = useState<SemesterHistory[]>([]);

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      loadProfile();
      loadSemesterHistory();
      checkSemesterEnd();
    } else {
      setProfile(null);
      setSemesterHistory([]);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        const formattedProfile: AcademicProfile = {
          id: data.id,
          name: data.name || '',
          avatar: data.avatar || undefined,
          course: data.course || '',
          university: data.university || '',
          shift: data.shift as 'morning' | 'afternoon' | 'night' || 'morning',
          semesterStart: data.semester_start || new Date().toISOString().split('T')[0],
          semesterEnd: data.semester_end || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setProfile(formattedProfile);
      } else {
        // Se não existe perfil, criar um novo
        await createInitialProfile();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const createInitialProfile = async () => {
    if (!user) return;

    try {
      const defaultProfile = {
        user_id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '',
        course: user.user_metadata?.course || '',
        university: '',
        shift: 'morning',
        semester_start: new Date().toISOString().split('T')[0],
        semester_end: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      if (data) {
        const formattedProfile: AcademicProfile = {
          id: data.id,
          name: data.name || '',
          avatar: data.avatar || undefined,
          course: data.course || '',
          university: data.university || '',
          shift: data.shift as 'morning' | 'afternoon' | 'night' || 'morning',
          semesterStart: data.semester_start || new Date().toISOString().split('T')[0],
          semesterEnd: data.semester_end || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setProfile(formattedProfile);
      }
    } catch (error) {
      console.error('Error creating initial profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<AcademicProfile>) => {
    if (!user) return;

    // Check rate limit for profile edits
    const canProceed = await checkRateLimit('profile_edit', { userId: user.id });
    if (!canProceed) {
      throw new Error('Rate limit exceeded'); // Lançar erro para parar a execução
    }

    // Validar duração do semestre se ambas as datas estão sendo definidas ou atualizadas
    const semesterStart = updates.semesterStart || profile?.semesterStart;
    const semesterEnd = updates.semesterEnd || profile?.semesterEnd;
    
    if (semesterStart && semesterEnd) {
      const startDate = new Date(semesterStart);
      const endDate = new Date(semesterEnd);
      const diffInMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44); // Média de dias por mês
      
      if (diffInMonths > limits.maxSemesterDuration) {
        toast.error(`Duração do semestre excedida!`, {
          description: `A duração máxima permitida é de ${limits.maxSemesterDuration} meses.`,
        });
        return;
      }
    }
    
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.course !== undefined) dbUpdates.course = updates.course;
      if (updates.university !== undefined) dbUpdates.university = updates.university;
      if (updates.shift !== undefined) dbUpdates.shift = updates.shift;
      if (updates.semesterStart !== undefined) dbUpdates.semester_start = updates.semesterStart;
      if (updates.semesterEnd !== undefined) dbUpdates.semester_end = updates.semesterEnd;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (profile) {
        const updatedProfile = {
          ...profile,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        setProfile(updatedProfile);
      } else {
        // Se não existe profile, recarregar
        await loadProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        try {
          await updateProfile({ avatar: result });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const getDaysUntilSemesterEnd = (): number => {
    if (!profile?.semesterEnd) return 0;
    
    const endDate = new Date(profile.semesterEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const loadSemesterHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('semester_history')
        .select('*')
        .eq('user_id', user.id)
        .order('semester_end', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedHistory: SemesterHistory[] = data.map(item => ({
          id: item.id,
          course: item.course || '',
          university: item.university || '',
          shift: item.shift || 'morning',
          semesterStart: item.semester_start,
          semesterEnd: item.semester_end,
          subjectsData: Array.isArray(item.subjects_data) ? item.subjects_data : [],
          gradesData: Array.isArray(item.grades_data) ? item.grades_data : [],
          absencesData: Array.isArray(item.absences_data) ? item.absences_data : [],
          notesData: Array.isArray(item.notes_data) ? item.notes_data : [],
          achievementsData: Array.isArray(item.achievements_data) ? item.achievements_data : [],
          createdAt: item.created_at
        }));
        setSemesterHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error loading semester history:', error);
    }
  };

  const checkSemesterEnd = async () => {
    if (!profile || !user) return;

    const today = new Date();
    const semesterEnd = new Date(profile.semesterEnd);
    
    // Se o semestre já terminou, arquivar automaticamente
    if (today >= semesterEnd) {
      await archiveSemester();
    }
  };

  const archiveSemester = async () => {
    if (!profile || !user) return;

    try {
      // Buscar todos os dados do semestre atual
      const [subjectsData, absencesData, notesData, achievementsData] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', user.id),
        supabase.from('absences').select('*').eq('user_id', user.id),
        supabase.from('notes').select('*').eq('user_id', user.id),
        supabase.from('achievements').select('*').eq('user_id', user.id)
      ]);

      // Salvar no histórico
      const { error: historyError } = await supabase
        .from('semester_history')
        .insert({
          user_id: user.id,
          course: profile.course,
          university: profile.university,
          shift: profile.shift,
          semester_start: profile.semesterStart,
          semester_end: profile.semesterEnd,
          subjects_data: subjectsData.data || [],
          grades_data: [], // Implementar quando houver sistema de notas
          absences_data: absencesData.data || [],
          notes_data: notesData.data || [],
          achievements_data: achievementsData.data || []
        });

      if (historyError) throw historyError;

      // Limpar dados do semestre atual (incluindo conquistas e tracking)
      await Promise.all([
        supabase.from('subjects').delete().eq('user_id', user.id),
        supabase.from('absences').delete().eq('user_id', user.id),
        supabase.from('absence_subjects').delete().in('absence_id', 
          (absencesData.data || []).map(a => a.id)
        ),
        supabase.from('notes').delete().eq('user_id', user.id),
        supabase.from('schedule_slots').delete().eq('user_id', user.id),
        supabase.from('user_time_slots').delete().eq('user_id', user.id),
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('achievement_tracking').delete().eq('user_id', user.id)
      ]);

      // Recarregar dados
      await loadSemesterHistory();
      
      console.log('Semestre arquivado com sucesso!');
    } catch (error) {
      console.error('Error archiving semester:', error);
    }
  };

  const startNewSemester = async (semesterStart: string, semesterEnd: string) => {
    if (!profile || !user) return;

    try {
      console.log('Iniciando novo semestre - limpando conquistas...');
      
      // PRIMEIRO: Sempre limpar todas as conquistas antes de qualquer outra ação
      const deleteResults = await Promise.all([
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('achievement_tracking').delete().eq('user_id', user.id),
        supabase.from('achievements').delete().eq('user_id', user.id)
      ]);

      console.log('Resultados da limpeza de conquistas:', deleteResults);

      // Verificar se houve erros na limpeza
      deleteResults.forEach((result, index) => {
        const tables = ['user_achievements', 'achievement_tracking', 'achievements'];
        if (result.error) {
          console.error(`Erro ao limpar ${tables[index]}:`, result.error);
        } else {
          console.log(`${tables[index]} limpo com sucesso`);
        }
      });

      // SEGUNDO: Arquivar semestre atual se existir
      if (profile.semesterStart && profile.semesterEnd) {
        await archiveSemester();
      }

      // TERCEIRO: Limpar informações do perfil (curso e universidade) no restart
      await updateProfile({
        course: '',
        university: ''
      });

      // QUARTO: Atualizar o perfil com as novas datas
      await updateProfile({
        semesterStart,
        semesterEnd
      });
      
      // QUINTO: Emitir evento para resetar conquistas no contexto
      window.dispatchEvent(new CustomEvent('resetAchievements'));
      
      console.log('Novo semestre iniciado e conquistas totalmente resetadas!');
    } catch (error) {
      console.error('Error starting new semester:', error);
    }
  };

  const deleteSemesterHistory = async (semesterId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('semester_history')
        .delete()
        .eq('id', semesterId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Recarregar histórico
      await loadSemesterHistory();
      
      console.log('Semestre removido do histórico!');
    } catch (error) {
      console.error('Error deleting semester:', error);
      throw error;
    }
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      semesterHistory,
      updateProfile,
      uploadAvatar,
      getDaysUntilSemesterEnd,
      archiveSemester,
      startNewSemester,
      deleteSemesterHistory
    }}>
      {children}
    </ProfileContext.Provider>
  );
};