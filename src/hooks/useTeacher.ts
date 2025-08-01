import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeacherSubject {
  id: string;
  teacher_id: string;
  subject_name: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherClass {
  id: string;
  teacher_id: string;
  class_name: string;
  subject_name: string;
  class_code: string;
  description?: string;
  max_students: number;
  minimum_grade: number;
  maximum_grade: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  student_profile?: {
    email: string;
    course: string;
  };
}

export const useTeacher = () => {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário é professor
  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'teacher')
          .is('revoked_at', null)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar status de professor:', error);
          setIsTeacher(false);
        } else {
          setIsTeacher(!!data);
        }
      } catch (error) {
        console.error('Erro ao verificar professor:', error);
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherStatus();
  }, [user]);

  // Carregar matérias do professor
  const loadSubjects = async () => {
    if (!user || !isTeacher) return;

    try {
      const { data, error } = await supabase
        .from('teacher_subjects')
        .select('*')
        .eq('teacher_id', user.id)
        .order('subject_name');

      if (error) {
        console.error('Erro ao carregar matérias:', error);
        return;
      }

      setSubjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
    }
  };

  // Carregar turmas do professor
  const loadClasses = async () => {
    if (!user || !isTeacher) return;

    try {
      const { data, error } = await supabase
        .from('teacher_classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar turmas:', error);
        return;
      }

      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  useEffect(() => {
    if (isTeacher && user) {
      loadSubjects();
      loadClasses();
    }
  }, [isTeacher, user]);

  // Adicionar matéria
  const addSubject = async (subjectName: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .insert({
          teacher_id: user.id,
          subject_name: subjectName
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Você já leciona esta matéria');
        } else {
          toast.error('Erro ao adicionar matéria');
        }
        return false;
      }

      toast.success('Matéria adicionada com sucesso!');
      await loadSubjects();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
      toast.error('Erro ao adicionar matéria');
      return false;
    }
  };

  // Remover matéria
  const removeSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .delete()
        .eq('id', subjectId);

      if (error) {
        toast.error('Erro ao remover matéria');
        return false;
      }

      toast.success('Matéria removida com sucesso!');
      await loadSubjects();
      return true;
    } catch (error) {
      console.error('Erro ao remover matéria:', error);
      toast.error('Erro ao remover matéria');
      return false;
    }
  };

  // Criar turma
  const createClass = async (classData: {
    class_name: string;
    subject_name: string;
    description?: string;
    max_students?: number;
    minimum_grade?: number;
    maximum_grade?: number;
  }) => {
    if (!user) return null;

    try {
      // O código será gerado automaticamente pelo trigger
      const { data, error } = await supabase
        .from('teacher_classes')
        .insert({
          teacher_id: user.id,
          class_name: classData.class_name,
          subject_name: classData.subject_name,
          description: classData.description,
          max_students: classData.max_students || 30,
          minimum_grade: classData.minimum_grade || 6.0,
          maximum_grade: classData.maximum_grade || 10.0,
          class_code: '' // Será sobrescrito pelo trigger
        })
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar turma');
        return null;
      }

      toast.success('Turma criada com sucesso!');
      await loadClasses();
      return data;
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      toast.error('Erro ao criar turma');
      return null;
    }
  };

  // Buscar alunos de uma turma
  const getClassStudents = async (classId: string): Promise<ClassStudent[]> => {
    try {
      const { data, error } = await supabase
        .from('teacher_class_students')
        .select('*')
        .eq('class_id', classId);

      if (error) {
        console.error('Erro ao buscar alunos:', error);
        return [];
      }

      // Buscar dados dos perfis separadamente
      const studentsWithProfiles = await Promise.all(
        (data || []).map(async (student) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, course')
            .eq('user_id', student.student_id)
            .single();

          return {
            ...student,
            student_profile: profile || { email: '', course: '' }
          };
        })
      );

      return studentsWithProfiles;
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      return [];
    }
  };

  // Adicionar aluno por email
  const addStudentByEmail = async (classId: string, email: string) => {
    try {
      // Buscar o usuário pelo email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        toast.error('Usuário não encontrado com este email');
        return false;
      }

      // Adicionar à turma
      const { error } = await supabase
        .from('teacher_class_students')
        .insert({
          class_id: classId,
          student_id: profileData.user_id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Aluno já está nesta turma');
        } else {
          toast.error('Erro ao adicionar aluno');
        }
        return false;
      }

      toast.success('Aluno adicionado à turma!');
      return true;
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
      toast.error('Erro ao adicionar aluno');
      return false;
    }
  };

  // Remover aluno da turma
  const removeStudentFromClass = async (classId: string, studentId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_class_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);

      if (error) {
        toast.error('Erro ao remover aluno');
        return false;
      }

      toast.success('Aluno removido da turma!');
      return true;
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast.error('Erro ao remover aluno');
      return false;
    }
  };

  return {
    isTeacher,
    loading,
    subjects,
    classes,
    addSubject,
    removeSubject,
    createClass,
    getClassStudents,
    addStudentByEmail,
    removeStudentFromClass,
    refreshData: () => {
      loadSubjects();
      loadClasses();
    }
  };
};