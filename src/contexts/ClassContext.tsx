import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAchievements } from './AchievementsContext';
import { useSystemLimits } from '@/hooks/useSystemLimits';

interface Class {
  id: string;
  name: string;
  leader_id: string;
  max_members: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface ClassMember {
  id: string;
  class_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    email: string;
  };
}

interface ClassInvite {
  id: string;
  class_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
}

interface AbsenceNotification {
  id: string;
  class_id: string;
  user_id: string;
  absence_date: string;
  subjects: string[];
  content_sent: boolean;
  content_sender_id: string | null;
  content_text: string | null;
  content_photos: string[] | null;
  created_at: string;
  content_sent_at: string | null;
  profiles?: {
    email: string;
  };
}

interface ClassAlert {
  id: string;
  class_id: string;
  user_id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
  };
}

interface ClassContextType {
  classes: Class[];
  currentClass: Class | null;
  classMembers: ClassMember[];
  invites: ClassInvite[];
  absenceNotifications: AbsenceNotification[];
  classAlerts: ClassAlert[];
  loading: boolean;
  createClass: (name: string) => Promise<void>;
  inviteToClass: (classId: string, email: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  leaveClass: (classId: string) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  createAbsenceNotification: (classId: string, absenceDate: string, subjects: string[]) => Promise<void>;
  sendContent: (notificationId: string, text: string, photos?: File[]) => Promise<void>;
  setCurrentClass: (classData: Class | null) => void;
  fetchClassData: (classId: string) => Promise<void>;
  fetchInvites: () => Promise<void>;
  fetchAbsenceNotifications: (classId: string) => Promise<void>;
  fetchClassAlerts: (classId: string) => Promise<void>;
  clearOldNotifications: (classId: string, daysOld?: number) => Promise<number>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const useClass = () => {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackJoinedClass, trackClassMembersUpdate } = useAchievements();
  const { checkClassMembershipLimit } = useSystemLimits();
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [invites, setInvites] = useState<ClassInvite[]>([]);
  const [absenceNotifications, setAbsenceNotifications] = useState<AbsenceNotification[]>([]);
  const [classAlerts, setClassAlerts] = useState<ClassAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar turmas onde o usuário é líder ou membro
      const { data: leaderClasses, error: leaderError } = await supabase
        .from('classes')
        .select('*')
        .eq('leader_id', user.id)
        .order('created_at', { ascending: false });

      if (leaderError) throw leaderError;

      const { data: memberClasses, error: memberError } = await supabase
        .from('class_members')
        .select('classes(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Combinar turmas onde é líder e membro
      const allClasses = [
        ...(leaderClasses || []),
        ...(memberClasses?.map(m => m.classes).filter(Boolean) || [])
      ];

      // Remover duplicatas
      const uniqueClasses = allClasses.filter((cls, index, self) => 
        self.findIndex(c => c.id === cls.id) === index
      );

      // Buscar contagem de membros para cada turma
      const classesWithMemberCount = await Promise.all(
        uniqueClasses.map(async (classItem) => {
          const { count } = await supabase
            .from('class_members')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id);

          return {
            ...classItem,
            member_count: count || 0
          };
        })
      );

      setClasses(classesWithMemberCount);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar turmas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClassData = async (classId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar membros da turma
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', classId);

      if (membersError) throw membersError;

      // Buscar perfis dos membros
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(member => member.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combinar dados dos membros com perfis
        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profiles: profilesData?.find(profile => profile.user_id === member.user_id)
        }));

        setClassMembers(membersWithProfiles);
      } else {
        setClassMembers([]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar membros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('class_invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites((data || []) as ClassInvite[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar convites",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAbsenceNotifications = async (classId: string) => {
    if (!user) return;

    try {
      // Buscar notificações de ausência
      const { data: notificationsData, error } = await supabase
        .from('absence_notifications')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar perfis dos usuários que fizeram as notificações
      if (notificationsData && notificationsData.length > 0) {
        const userIds = notificationsData.map(notification => notification.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combinar dados das notificações com perfis
        const notificationsWithProfiles = notificationsData.map(notification => ({
          ...notification,
          profiles: profilesData?.find(profile => profile.user_id === notification.user_id)
        }));

        setAbsenceNotifications(notificationsWithProfiles as AbsenceNotification[]);
      } else {
        setAbsenceNotifications([]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar notificações",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createClass = async (name: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          name,
          leader_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Adicionar o líder como membro
      await supabase
        .from('class_members')
        .insert([{
          class_id: data.id,
          user_id: user.id,
        }]);

      // Track joining class achievement (for leader joining their own class)
      trackJoinedClass();

      toast({
        title: "Turma criada",
        description: "Sua turma foi criada com sucesso!",
      });

      fetchClasses();
    } catch (error: any) {
      toast({
        title: "Erro ao criar turma",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const inviteToClass = async (classId: string, email: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('class_invites')
        .insert([{
          class_id: classId,
          inviter_id: user.id,
          invitee_email: email,
        }]);

      if (error) throw error;

      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const acceptInvite = async (inviteId: string) => {
    if (!user) return;

    try {
      // Verificar limite de participação em turmas
      const limitCheck = await checkClassMembershipLimit(user.id);
      if (!limitCheck.canAdd) {
        toast({
          title: "Limite de participação excedido!",
          description: `Você já participa de ${limitCheck.currentCount} turmas. Limite máximo: ${limitCheck.limit}`,
          variant: "destructive"
        });
        return;
      }

      // Buscar o convite
      const { data: invite, error: inviteError } = await supabase
        .from('class_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (inviteError) throw inviteError;

      // Atualizar status do convite
      const { error: updateError } = await supabase
        .from('class_invites')
        .update({
          status: 'accepted',
          invitee_id: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      // Adicionar como membro da turma
      const { error: memberError } = await supabase
        .from('class_members')
        .insert([{
          class_id: invite.class_id,
          user_id: user.id,
        }]);

      if (memberError) throw memberError;

      // Track joining class achievement
      trackJoinedClass();

      // Check if class has >40 members now and track
      const { data: memberCount } = await supabase
        .from('class_members')
        .select('id', { count: 'exact' })
        .eq('class_id', invite.class_id);

      if (memberCount && memberCount.length > 40) {
        trackClassMembersUpdate(memberCount.length);
      }

      toast({
        title: "Convite aceito",
        description: "Você entrou na turma!",
      });

      fetchClasses();
      fetchInvites();
    } catch (error: any) {
      toast({
        title: "Erro ao aceitar convite",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const declineInvite = async (inviteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('class_invites')
        .update({
          status: 'declined',
          invitee_id: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Convite recusado",
        description: "Convite recusado com sucesso",
      });

      fetchInvites();
    } catch (error: any) {
      toast({
        title: "Erro ao recusar convite",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const leaveClass = async (classId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Saiu da turma",
        description: "Você saiu da turma com sucesso",
      });

      fetchClasses();
      if (currentClass?.id === classId) {
        setCurrentClass(null);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sair da turma",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteClass = async (classId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('leader_id', user.id);

      if (error) throw error;

      toast({
        title: "Turma excluída",
        description: "Turma excluída com sucesso",
      });

      fetchClasses();
      if (currentClass?.id === classId) {
        setCurrentClass(null);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao excluir turma",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchClassAlerts = async (classId: string) => {
    if (!user) return;

    try {
      // Buscar alertas da turma
      const { data: alertsData, error } = await supabase
        .from('class_alerts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar perfis dos usuários que criaram os alertas
      if (alertsData && alertsData.length > 0) {
        const userIds = alertsData.map(alert => alert.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combinar dados dos alertas com perfis
        const alertsWithProfiles = alertsData.map(alert => ({
          ...alert,
          profiles: profilesData?.find(profile => profile.user_id === alert.user_id)
        }));

        setClassAlerts(alertsWithProfiles as ClassAlert[]);
      } else {
        setClassAlerts([]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar alertas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createAbsenceNotification = async (classId: string, absenceDate: string, subjects: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('absence_notifications')
        .insert([{
          class_id: classId,
          user_id: user.id,
          absence_date: absenceDate,
          subjects,
        }]);

      if (error) throw error;

      toast({
        title: "Falta registrada",
        description: "Sua falta foi registrada e os membros da turma foram notificados",
      });

      fetchAbsenceNotifications(classId);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar falta",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const uploadImage = async (file: File, classId: string): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${classId}/${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('class-content')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('class-content')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const sendContent = async (notificationId: string, text: string, photos?: File[]) => {
    if (!user) return;

    try {
      let photoUrls: string[] = [];

      // Upload photos if provided
      if (photos && photos.length > 0 && currentClass) {
        photoUrls = await Promise.all(
          photos.map(photo => uploadImage(photo, currentClass.id))
        );
      }

      const { error } = await supabase
        .from('absence_notifications')
        .update({
          content_sent: true,
          content_sender_id: user.id,
          content_text: text,
          content_photos: photoUrls,
          content_sent_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Conteúdo enviado",
        description: "Conteúdo enviado com sucesso!",
      });

      if (currentClass) {
        fetchAbsenceNotifications(currentClass.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar conteúdo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchInvites();
    }
  }, [user]);

  // Effect to fetch class data when currentClass changes
  useEffect(() => {
    if (currentClass && user) {
      fetchClassData(currentClass.id);
      fetchAbsenceNotifications(currentClass.id);
      fetchClassAlerts(currentClass.id);
    } else {
      setClassMembers([]);
      setAbsenceNotifications([]);
      setClassAlerts([]);
    }
  }, [currentClass, user]);

  return (
    <ClassContext.Provider
      value={{
        classes,
        currentClass,
        classMembers,
        invites,
        absenceNotifications,
        classAlerts,
        loading,
        createClass,
        inviteToClass,
        acceptInvite,
        declineInvite,
        leaveClass,
        deleteClass,
        createAbsenceNotification,
        sendContent,
        setCurrentClass,
        fetchClassData,
        fetchInvites,
        fetchAbsenceNotifications,
        fetchClassAlerts,
        clearOldNotifications: async (classId: string, daysOld: number = 30) => {
          if (!user) return 0;
          
          try {
            const { data, error } = await supabase.rpc('clear_old_absence_notifications', {
              class_id_param: classId,
              days_old: daysOld
            });

            if (error) throw error;

            // Refresh notifications after clearing
            if (currentClass) {
              await fetchAbsenceNotifications(currentClass.id);
            }

            return data || 0;
          } catch (error: any) {
            throw new Error(error.message);
          }
        },
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};