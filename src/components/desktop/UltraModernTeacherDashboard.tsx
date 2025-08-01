import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BookOpen, 
  Users, 
  Plus, 
  Copy, 
  Trash2, 
  UserPlus,
  GraduationCap,
  ClipboardList,
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Star,
  Trophy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  MoreVertical,
  BookCheck,
  UserCheck,
  Award,
  Zap,
  Activity,
  Grid3X3,
  List,
  Sparkles,
  Brain,
  Rocket,
  Crown,
  Flame,
  ChevronRight,
  Settings,
  School,
  LineChart,
  Calculator
} from 'lucide-react';
import StudentManagement from '../teacher/StudentManagement';
import AssessmentManagement from '../teacher/AssessmentManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface TeacherSubject {
  id: string;
  subject_name: string;
  created_at: string;
}

interface TeacherClass {
  id: string;
  class_name: string;
  subject_name: string;
  description: string | null;
  max_students: number;
  minimum_grade: number;
  maximum_grade: number;
  is_active: boolean;
  class_code: string;
  created_at: string;
}

interface ClassStudent {
  id: string;
  student_id: string;
  joined_at: string;
  profiles: {
    email: string;
    course: string;
  } | null;
}

interface TeacherAssessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: 'prova' | 'trabalho' | 'teste' | 'atividade';
  max_score: number;
  assessment_date: string;
  class_id: string;
}

const UltraModernTeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para modais
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [showManageClass, setShowManageClass] = useState(false);

  // Estados para formulários
  const [newSubject, setNewSubject] = useState('');
  const [newClass, setNewClass] = useState({
    class_name: '',
    subject_name: '',
    description: '',
    max_students: 30,
    minimum_grade: 6.0,
    maximum_grade: 10.0
  });
  const [studentEmail, setStudentEmail] = useState('');
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    assessment_type: 'prova' as const,
    max_score: 10,
    assessment_date: new Date().toISOString().split('T')[0]
  });

  // Calculate stats
  const totalStudents = classStudents.length;
  const totalClasses = classes.length;
  const totalAssessments = assessments.length;
  const activeClasses = classes.filter(c => c.is_active).length;

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadTeacherData();
      loadStudentData();
    }
  }, [user]);

  const loadTeacherData = async () => {
    try {
      await Promise.all([
        loadSubjects(),
        loadClasses()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do professor:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    const { data, error } = await supabase
      .from('teacher_subjects')
      .select('*')
      .eq('teacher_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar matérias:', error);
      return;
    }

    setSubjects(data || []);
  };

  const loadClasses = async () => {
    const { data, error } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('teacher_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar turmas:', error);
      return;
    }

    setClasses(data || []);
  };

  const loadClassStudents = async (classId: string) => {
    const { data, error } = await supabase
      .from('teacher_class_students')
      .select(`
        id,
        student_id,
        joined_at
      `)
      .eq('class_id', classId);

    if (error) {
      console.error('Erro ao carregar alunos:', error);
      return;
    }

    // Carregar dados dos perfis separadamente
    if (data && data.length > 0) {
      const studentIds = data.map(s => s.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, course')
        .in('user_id', studentIds);

      const studentsWithProfiles = data.map(student => ({
        ...student,
        profiles: profiles?.find(p => p.user_id === student.student_id) || null
      }));

      setClassStudents(studentsWithProfiles as ClassStudent[]);
    } else {
      setClassStudents([]);
    }
  };

  const loadAssessments = async (classId: string) => {
    const { data, error } = await supabase
      .from('teacher_assessments')
      .select('*')
      .eq('class_id', classId)
      .order('assessment_date', { ascending: false });

    if (error) {
      console.error('Erro ao carregar avaliações:', error);
      return;
    }

    setAssessments(data as TeacherAssessment[] || []);
  };

  const loadStudentData = async () => {
    if (!user) return;
    
    // Carregar turmas onde o usuário é aluno
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
          teacher_id
        )
      `)
      .eq('student_id', user.id);

    if (classError) {
      console.error('Erro ao carregar turmas do aluno:', classError);
      return;
    }

    setStudentClasses(studentClassesData || []);

    // Se tem turmas, carregar as notas
    if (studentClassesData && studentClassesData.length > 0) {
      const classIds = studentClassesData.map(sc => sc.class_id);
      
      // Carregar avaliações e notas
      const { data: gradesData, error: gradesError } = await supabase
        .from('student_grades')
        .select(`
          *,
          teacher_assessments (
            id,
            title,
            assessment_type,
            max_score,
            assessment_date,
            class_id
          )
        `)
        .eq('student_id', user.id);

      if (gradesError) {
        console.error('Erro ao carregar notas:', gradesError);
        return;
      }

      setStudentGrades(gradesData || []);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim() || !user) return;

    const { error } = await supabase
      .from('teacher_subjects')
      .insert({
        teacher_id: user.id,
        subject_name: newSubject.trim()
      });

    if (error) {
      console.error('Erro ao adicionar matéria:', error);
      toast.error('Erro ao adicionar matéria');
      return;
    }

    toast.success('Matéria adicionada com sucesso!');
    setNewSubject('');
    await loadSubjects();
  };

  const handleRemoveSubject = async (subjectId: string) => {
    const { error } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('id', subjectId);

    if (error) {
      console.error('Erro ao remover matéria:', error);
      toast.error('Erro ao remover matéria');
      return;
    }

    toast.success('Matéria removida com sucesso!');
    await loadSubjects();
  };

  const handleCreateClass = async () => {
    if (!newClass.class_name.trim() || !newClass.subject_name.trim() || !user) {
      return;
    }

    const insertData = {
      teacher_id: user.id,
      class_name: newClass.class_name.trim(),
      subject_name: newClass.subject_name,
      description: newClass.description.trim() || null,
      max_students: newClass.max_students,
      minimum_grade: newClass.minimum_grade,
      maximum_grade: newClass.maximum_grade,
      class_code: ''
    };

    const { data, error } = await supabase
      .from('teacher_classes')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Erro ao criar turma:', error);
      toast.error('Erro ao criar turma: ' + error.message);
      return;
    }

    toast.success('Turma criada com sucesso!');
    setNewClass({
      class_name: '',
      subject_name: '',
      description: '',
      max_students: 30,
      minimum_grade: 6.0,
      maximum_grade: 10.0
    });
    setShowCreateClass(false);
    await loadClasses();
  };

  const handleCopyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado para a área de transferência!');
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Tem certeza que deseja deletar a turma "${className}"? Esta ação é irreversível e removerá todos os alunos e avaliações da turma.`)) {
      return;
    }

    try {
      // Primeiro, remover todos os estudantes da turma
      const { error: studentsError } = await supabase
        .from('teacher_class_students')
        .delete()
        .eq('class_id', classId);

      if (studentsError) {
        console.error('Erro ao remover estudantes:', studentsError);
        toast.error('Erro ao remover estudantes da turma');
        return;
      }

      // Depois, remover todas as avaliações da turma
      const { error: assessmentsError } = await supabase
        .from('teacher_assessments')
        .delete()
        .eq('class_id', classId);

      if (assessmentsError) {
        console.error('Erro ao remover avaliações:', assessmentsError);
        toast.error('Erro ao remover avaliações da turma');
        return;
      }

      // Por fim, deletar a turma
      const { error: classError } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('id', classId);

      if (classError) {
        console.error('Erro ao deletar turma:', classError);
        toast.error('Erro ao deletar turma');
        return;
      }

      toast.success('Turma deletada com sucesso!');
      await loadClasses();
    } catch (error) {
      console.error('Erro ao deletar turma:', error);
      toast.error('Erro ao deletar turma');
    }
  };

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'prova': return BookOpen;
      case 'trabalho': return FileText;
      case 'teste': return CheckCircle2;
      case 'atividade': return Target;
      default: return ClipboardList;
    }
  };

  const getAssessmentColor = (type: string) => {
    switch (type) {
      case 'prova': return 'from-red-500 to-red-600';
      case 'trabalho': return 'from-blue-500 to-blue-600';
      case 'teste': return 'from-green-500 to-green-600';
      case 'atividade': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const filteredClasses = classes.filter(cls => 
    searchQuery === '' || 
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
            <School className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Carregando painel do professor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      <div className="container mx-auto p-8 space-y-10">
        {/* Ultra Modern Hero Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-10 text-white shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          
          {/* Floating Academic Orbs */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/30 to-emerald-500/30 blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-cyan-400/20 to-teal-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tight">
                      Academia <span className="text-white/80">Pro</span>
                    </h1>
                    <p className="text-emerald-100 text-xl font-medium">
                      Revolucione sua gestão educacional
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Users className="h-5 w-5 text-cyan-300" />
                    <span className="text-sm font-semibold">{totalClasses} turmas</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <GraduationCap className="h-5 w-5 text-teal-300" />
                    <span className="text-sm font-semibold">{totalStudents} alunos</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Trophy className="h-5 w-5 text-emerald-300" />
                    <span className="text-sm font-semibold">{totalAssessments} avaliações</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    placeholder="Buscar turmas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 w-full sm:w-80 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-2xl text-base"
                  />
                </div>
                
                <Button
                  onClick={() => {
                    setShowCreateClass(true);
                  }}
                  size="lg"
                  className="h-12 bg-white text-emerald-600 hover:bg-white/90 shadow-xl gap-3 font-bold rounded-2xl px-8"
                >
                  <Plus className="h-5 w-5" />
                  Nova Turma
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra Modern Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="h-14 p-1.5 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
              <TabsTrigger 
                value="overview" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <PieChart className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="classes" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <School className="h-4 w-4 mr-2" />
                Turmas ({totalClasses})
              </TabsTrigger>
              <TabsTrigger 
                value="students" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Alunos
              </TabsTrigger>
              <TabsTrigger 
                value="assessments" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Avaliações
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-xl"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-xl"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-8 mt-0">
            {/* Ultra Modern Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <School className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-100 text-sm font-medium">Total Turmas</p>
                      <p className="text-4xl font-black mt-1">{totalClasses}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-emerald-400/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/40 rounded-full transition-all duration-500"
                        style={{ width: `${totalClasses > 0 ? (activeClasses / totalClasses) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-100">{activeClasses} ativas</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-emerald-100">+{totalClasses}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-sm font-medium">Total Alunos</p>
                      <p className="text-4xl font-black mt-1">{totalStudents}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-200" />
                      <span className="text-sm text-blue-100">
                        {totalStudents > 0 ? `Média de ${Math.round(totalStudents / Math.max(totalClasses, 1))} por turma` : 'Aguardando alunos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-200">
                      <UserCheck className="h-4 w-4" />
                      <span>Engajamento alto</span>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-orange-100 text-sm font-medium">Avaliações</p>
                      <p className="text-4xl font-black mt-1">{totalAssessments}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-orange-200" />
                      <span className="text-sm text-orange-100">
                        {totalAssessments > 0 ? 'Sistema ativo' : 'Criar primeira avaliação'}
                      </span>
                    </div>
                    {totalAssessments > 0 && (
                      <div className="flex items-center gap-2 text-sm text-orange-200">
                        <Star className="h-4 w-4" />
                        <span>Qualidade excelente</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <LineChart className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-purple-100 text-sm font-medium">Desempenho</p>
                      <p className="text-4xl font-black mt-1">95%</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-purple-200" />
                      <span className="text-sm text-purple-100">
                        Performance excepcional
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-200">
                      <Sparkles className="h-4 w-4" />
                      <span>Feedback positivo</span>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>
            </div>

            {/* Quick Actions & Subject Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Rocket className="h-5 w-5 text-white" />
                    </div>
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setShowCreateClass(true)}
                    className="w-full h-14 justify-start gap-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-semibold text-base"
                  >
                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <Plus className="h-4 w-4" />
                    </div>
                    Criar Nova Turma
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full h-14 justify-start gap-4 border-2 border-blue-200 hover:bg-blue-50 rounded-2xl font-semibold text-base"
                    onClick={() => setActiveTab('students')}
                  >
                    <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    Gerenciar Alunos
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full h-14 justify-start gap-4 border-2 border-purple-200 hover:bg-purple-50 rounded-2xl font-semibold text-base"
                    onClick={() => setActiveTab('assessments')}
                  >
                    <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    Criar Avaliação
                  </Button>
                </CardContent>
              </Card>

              {/* Subject Management */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <BookCheck className="h-5 w-5 text-white" />
                    </div>
                    Gerenciar Matérias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da matéria..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="h-11 rounded-xl border-slate-200"
                    />
                    <Button 
                      onClick={handleAddSubject}
                      className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-slate-200 transition-colors">
                          <span className="font-medium text-slate-700">{subject.subject_name}</span>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRemoveSubject(subject.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-8 mt-0">
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-2xl font-bold">Suas Turmas ({filteredClasses.length})</span>
                  <Button 
                    onClick={() => setShowCreateClass(true)}
                    className="rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Turma
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredClasses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center mx-auto mb-6">
                      <School className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Crie sua primeira turma</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Comece organizando seus alunos em turmas para um melhor controle.</p>
                    <Button 
                      onClick={() => setShowCreateClass(true)}
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Turma
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    "gap-6",
                    viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"
                  )}>
                    {filteredClasses.map(cls => (
                      <Card key={cls.id} className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-slate-900 truncate">{cls.class_name}</h3>
                              <p className="text-emerald-600 font-medium">{cls.subject_name}</p>
                              {cls.description && (
                                <p className="text-slate-500 text-sm mt-1 line-clamp-2">{cls.description}</p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => {
                                  setSelectedClass(cls);
                                  loadClassStudents(cls.id);
                                  loadAssessments(cls.id);
                                  setShowManageClass(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedClass(cls);
                                  loadClassStudents(cls.id);
                                  loadAssessments(cls.id);
                                  setActiveTab('students');
                                }}>
                                  <Users className="h-4 w-4 mr-2" />
                                  Gerenciar Alunos
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedClass(cls);
                                  loadClassStudents(cls.id);
                                  loadAssessments(cls.id);
                                  setActiveTab('assessments');
                                }}>
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Gerenciar Avaliações
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyClassCode(cls.class_code)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copiar Código
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClass(cls.id, cls.class_name)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Capacidade</span>
                              <span className="font-semibold">{cls.max_students} alunos</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Nota Min/Máx</span>
                              <span className="font-semibold">{cls.minimum_grade} - {cls.maximum_grade}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={cls.is_active ? "default" : "secondary"} className="rounded-full">
                                {cls.is_active ? "Ativa" : "Inativa"}
                              </Badge>
                              {cls.class_code && (
                                <Badge variant="outline" className="rounded-full text-xs font-mono">
                                  {cls.class_code}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-8 mt-0">
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Users className="h-6 w-6" />
                  Gerenciamento de Alunos
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Gerencie os alunos em suas turmas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {!selectedClass ? (
                  <div className="text-center py-16">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Selecione uma Turma</h3>
                    <p className="text-slate-500">Vá para a aba "Turmas" e selecione uma turma para gerenciar alunos</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-1">Turma Selecionada</h4>
                      <p className="text-blue-700"><strong>{selectedClass.class_name}</strong> - {selectedClass.subject_name}</p>
                      <p className="text-sm text-blue-600">Código: {selectedClass.class_code}</p>
                    </div>
                    <StudentManagement 
                      selectedClass={selectedClass}
                      classStudents={classStudents}
                      onStudentsUpdate={() => loadClassStudents(selectedClass.id)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-8 mt-0">
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <BookOpen className="h-6 w-6" />
                  Avaliações
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Crie e gerencie avaliações para suas turmas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {!selectedClass ? (
                  <div className="text-center py-16">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Selecione uma Turma</h3>
                    <p className="text-slate-500">Vá para a aba "Turmas" e selecione uma turma para gerenciar avaliações</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-4 border border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-1">Turma Selecionada</h4>
                      <p className="text-emerald-700"><strong>{selectedClass.class_name}</strong> - {selectedClass.subject_name}</p>
                      <p className="text-sm text-emerald-600">Código: {selectedClass.class_code}</p>
                    </div>
                    <AssessmentManagement 
                      selectedClass={selectedClass}
                      assessments={assessments}
                      classStudents={classStudents}
                      onAssessmentsUpdate={() => loadAssessments(selectedClass.id)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Class Modal */}
        <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Criar Nova Turma</DialogTitle>
              <DialogDescription>
                Configure os detalhes da sua nova turma acadêmica.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_name">Nome da Turma</Label>
                  <Input
                    id="class_name"
                    placeholder="Ex: Turma A, 2024.1"
                    value={newClass.class_name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, class_name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject_name">Matéria</Label>
                  <Select
                    value={newClass.subject_name}
                    onValueChange={(value) => setNewClass(prev => ({ ...prev, subject_name: value }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione a matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.subject_name}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o conteúdo e objetivos da turma..."
                  value={newClass.description}
                  onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_students">Máximo de Alunos</Label>
                  <Input
                    id="max_students"
                    type="number"
                    min="1"
                    max="100"
                    value={newClass.max_students}
                    onChange={(e) => setNewClass(prev => ({ ...prev, max_students: parseInt(e.target.value) || 30 }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_grade">Nota Mínima</Label>
                  <Input
                    id="minimum_grade"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newClass.minimum_grade}
                    onChange={(e) => setNewClass(prev => ({ ...prev, minimum_grade: parseFloat(e.target.value) || 6.0 }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximum_grade">Nota Máxima</Label>
                  <Input
                    id="maximum_grade"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newClass.maximum_grade}
                    onChange={(e) => setNewClass(prev => ({ ...prev, maximum_grade: parseFloat(e.target.value) || 10.0 }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateClass(false)}
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateClass}
                className="flex-1 rounded-xl"
                disabled={!newClass.class_name.trim() || !newClass.subject_name}
              >
                Criar Turma
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Ver Detalhes da Turma */}
        <Dialog open={showManageClass} onOpenChange={setShowManageClass}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="pb-6 border-b">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <School className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    Detalhes da Turma: {selectedClass?.class_name}
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    {selectedClass?.subject_name} • Código: {selectedClass?.class_code}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {selectedClass && (
              <div className="flex-1 overflow-y-auto space-y-6 py-4">
                {/* Informações gerais da turma */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Alunos</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{classStudents.length}</p>
                    <p className="text-sm text-blue-600">de {selectedClass.max_students} máximo</p>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">Avaliações</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{assessments.length}</p>
                    <p className="text-sm text-emerald-600">criadas</p>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-900">Nota Mín/Máx</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">{selectedClass.minimum_grade} - {selectedClass.maximum_grade}</p>
                    <p className="text-sm text-purple-600">escala de avaliação</p>
                  </Card>
                </div>

                {/* Abas internas para gerenciamento */}
                <Tabs defaultValue="students-detail" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="students-detail">Alunos da Turma</TabsTrigger>
                    <TabsTrigger value="assessments-detail">Avaliações</TabsTrigger>
                  </TabsList>

                  {/* Aba Alunos */}
                  <TabsContent value="students-detail" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Lista de Alunos</h3>
                      <Badge variant="outline" className="text-sm">
                        {classStudents.length} alunos matriculados
                      </Badge>
                    </div>
                    
                    {classStudents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum aluno matriculado ainda</p>
                        <p className="text-sm">Use o código da turma para convidar alunos</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                        {classStudents.map((student) => (
                          <Card key={student.id} className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                {student.profiles?.email?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{student.profiles?.email || 'Email não encontrado'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.profiles?.course || 'Curso não informado'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Ingressou em: {new Date(student.joined_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Aba Avaliações */}
                  <TabsContent value="assessments-detail" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Avaliações da Turma</h3>
                      <Badge variant="outline" className="text-sm">
                        {assessments.length} avaliações
                      </Badge>
                    </div>
                    
                    {assessments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma avaliação criada ainda</p>
                        <p className="text-sm">Crie avaliações para acompanhar o progresso dos alunos</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {assessments.map((assessment) => {
                          const Icon = getAssessmentIcon(assessment.assessment_type);
                          return (
                            <Card key={assessment.id} className="p-4">
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg bg-gradient-to-r ${getAssessmentColor(assessment.assessment_type)} text-white`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold">{assessment.title}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      Nota máx: {assessment.max_score}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {assessment.assessment_type} • {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}
                                  </p>
                                  {assessment.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {assessment.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Informações adicionais */}
                <Card className="p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Informações da Turma
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedClass.is_active ? "default" : "secondary"} className="ml-2">
                        {selectedClass.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criada em:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedClass.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {selectedClass.description && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Descrição:</span>
                        <p className="mt-1 text-slate-700">{selectedClass.description}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <School className="h-4 w-4" />
                <span>Código da turma: <strong>{selectedClass?.class_code}</strong></span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedClass && handleCopyClassCode(selectedClass.class_code)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowManageClass(false)}
                className="px-6"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UltraModernTeacherDashboard;