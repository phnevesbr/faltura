import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentClass {
  id: string;
  class_name: string;
  subject_name: string;
  teacher_id: string;
  max_students: number;
  minimum_grade: number;
  maximum_grade: number;
  joined_at: string;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  assessment_type: string;
  max_score: number;
  assessment_date: string;
}

export interface Grade {
  id: string;
  assessment_id: string;
  score?: number;
  submission_status: string;
  feedback?: string;
  graded_at?: string;
  submitted_at?: string;
  assessment: Assessment;
}

export interface ClassWithGrades {
  class: StudentClass;
  grades: Grade[];
  stats: {
    totalScore: number;
    maxPossibleScore: number;
    currentPercentage: number;
    gradesByType: {
      [key: string]: {
        total: number;
        max: number;
        percentage: number;
      };
    };
  };
}

export const useStudentGrades = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    if (user) {
      loadStudentData();
    } else {
      setClasses([]);
      setIsStudent(false);
      setLoading(false);
    }
  }, [user]);

  const loadStudentData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Verificar se o usuário é estudante (está matriculado em alguma turma)
      const { data: studentClassesData, error: classError } = await supabase
        .from('teacher_class_students')
        .select(`
          id,
          class_id,
          joined_at,
          teacher_classes (
            id,
            class_name,
            subject_name,
            teacher_id,
            max_students,
            minimum_grade,
            maximum_grade
          )
        `)
        .eq('student_id', user.id);

      if (classError) {
        console.error('Erro ao carregar turmas do estudante:', classError);
        setIsStudent(false);
        setLoading(false);
        return;
      }

      if (!studentClassesData || studentClassesData.length === 0) {
        setIsStudent(false);
        setClasses([]);
        setLoading(false);
        return;
      }

      setIsStudent(true);

      // Buscar notas para cada turma
      const classesWithGrades: ClassWithGrades[] = [];

      for (const studentClass of studentClassesData) {
        if (!studentClass.teacher_classes) continue;

        const classData: StudentClass = {
          id: studentClass.teacher_classes.id,
          class_name: studentClass.teacher_classes.class_name,
          subject_name: studentClass.teacher_classes.subject_name,
          teacher_id: studentClass.teacher_classes.teacher_id,
          max_students: studentClass.teacher_classes.max_students,
          minimum_grade: studentClass.teacher_classes.minimum_grade || 6.0,
          maximum_grade: studentClass.teacher_classes.maximum_grade || 10.0,
          joined_at: studentClass.joined_at
        };

        // Primeiro buscar todas as avaliações desta turma
        const { data: assessmentsData } = await supabase
          .from('teacher_assessments')
          .select('id')
          .eq('class_id', classData.id);

        const assessmentIds = assessmentsData?.map(a => a.id) || [];

        if (assessmentIds.length === 0) {
          // Se não há avaliações, criar entrada vazia
          classesWithGrades.push({
            class: classData,
            grades: [],
            stats: calculateStats([])
          });
          continue;
        }

        // Buscar avaliações e notas desta turma
        const { data: gradesData, error: gradesError } = await supabase
          .from('student_grades')
          .select(`
            id,
            assessment_id,
            score,
            submission_status,
            feedback,
            graded_at,
            submitted_at,
            teacher_assessments (
              id,
              title,
              description,
              assessment_type,
              max_score,
              assessment_date
            )
          `)
          .eq('student_id', user.id)
          .in('assessment_id', assessmentIds);

        if (gradesError) {
          console.error('Erro ao carregar notas:', gradesError);
          continue;
        }

        const grades: Grade[] = (gradesData || []).map(grade => ({
          id: grade.id,
          assessment_id: grade.assessment_id,
          score: grade.score,
          submission_status: grade.submission_status,
          feedback: grade.feedback,
          graded_at: grade.graded_at,
          submitted_at: grade.submitted_at,
          assessment: {
            id: grade.teacher_assessments.id,
            title: grade.teacher_assessments.title,
            description: grade.teacher_assessments.description,
            assessment_type: grade.teacher_assessments.assessment_type,
            max_score: grade.teacher_assessments.max_score,
            assessment_date: grade.teacher_assessments.assessment_date
          }
        }));

        // Calcular estatísticas
        const stats = calculateStats(grades);

        classesWithGrades.push({
          class: classData,
          grades,
          stats
        });
      }

      setClasses(classesWithGrades);
    } catch (error) {
      console.error('Erro ao carregar dados do estudante:', error);
      setIsStudent(false);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (grades: Grade[]) => {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const gradesByType: { [key: string]: { total: number; max: number; percentage: number } } = {};

    grades.forEach(grade => {
      const score = grade.score || 0;
      const maxScore = grade.assessment.max_score;
      const type = grade.assessment.assessment_type;

      totalScore += score;
      maxPossibleScore += maxScore;

      if (!gradesByType[type]) {
        gradesByType[type] = { total: 0, max: 0, percentage: 0 };
      }

      gradesByType[type].total += score;
      gradesByType[type].max += maxScore;
    });

    // Calcular percentuais por tipo
    Object.keys(gradesByType).forEach(type => {
      const typeData = gradesByType[type];
      typeData.percentage = typeData.max > 0 ? (typeData.total / typeData.max) * 100 : 0;
    });

    const currentPercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      totalScore,
      maxPossibleScore,
      currentPercentage,
      gradesByType
    };
  };

  return {
    classes,
    loading,
    isStudent,
    refreshData: loadStudentData
  };
};