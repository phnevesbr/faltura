// Use the ultra modern version by default
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
  List
} from 'lucide-react';
import StudentManagement from '../teacher/StudentManagement';
import AssessmentManagement from '../teacher/AssessmentManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

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

const LegacyModernTeacherDashboard: React.FC = () => {
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
      case 'atividade': return Activity;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do professor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  Painel do Professor
                </h1>
                <p className="text-emerald-100 text-lg">
                  Gerencie suas turmas, alunos e avaliações com eficiência
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">{totalClasses} turmas ativas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-sm">{totalStudents} alunos</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar turmas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-white/20 border-white/30 text-white placeholder:text-emerald-100 focus:bg-white/30"
                  />
                </div>
                
                <Button
                  onClick={() => setShowCreateClass(true)}
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg gap-2 font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Nova Turma
                </Button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl"></div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 p-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
            <TabsTrigger value="overview" className="rounded-xl text-sm font-medium data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <PieChart className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="classes" className="rounded-xl text-sm font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <BookOpen className="h-4 w-4 mr-2" />
              Turmas ({totalClasses})
            </TabsTrigger>
            <TabsTrigger value="assessments" className="rounded-xl text-sm font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <ClipboardList className="h-4 w-4 mr-2" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-xl text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <Users className="h-4 w-4 mr-2" />
              Alunos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Total de Turmas</p>
                      <p className="text-3xl font-bold mt-1">{totalClasses}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-emerald-100">
                      {activeClasses} ativas de {totalClasses} total
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total de Alunos</p>
                      <p className="text-3xl font-bold mt-1">{totalStudents}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-blue-100">
                      Distribuídos nas turmas ativas
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Avaliações</p>
                      <p className="text-3xl font-bold mt-1">{totalAssessments}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-purple-100">
                      Criadas neste período
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Matérias</p>
                      <p className="text-3xl font-bold mt-1">{subjects.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <BookCheck className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-orange-100">
                      Disciplinas cadastradas
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>
            </div>

            {/* Recent Classes and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Classes */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-emerald-500" />
                      Turmas Recentes
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('classes')}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      Ver todas
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {classes.slice(0, 4).map(cls => (
                    <div key={cls.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{cls.class_name}</p>
                          <p className="text-sm text-muted-foreground">{cls.subject_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {cls.class_code}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCopyClassCode(cls.class_code)}
                          className="border-emerald-300 hover:bg-emerald-50"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {classes.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhuma turma criada ainda</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateClass(true)}
                        className="mt-2"
                      >
                        Criar primeira turma
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subject Management */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <BookCheck className="h-5 w-5 text-blue-500" />
                    Gerenciar Matérias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da matéria..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddSubject} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800">
                          <span className="text-sm font-medium">{subject.subject_name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveSubject(subject.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {subjects.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">Nenhuma matéria cadastrada</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Minhas Turmas</h2>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {filteredClasses.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20">
                <CardContent className="p-12 text-center">
                  <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                    {searchQuery ? 'Nenhuma turma encontrada' : 'Comece criando sua primeira turma'}
                  </h3>
                  <p className="text-emerald-600 dark:text-emerald-400 mb-4">
                    {searchQuery ? 'Tente ajustar a busca' : 'Organize seus alunos e gerencie avaliações facilmente'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowCreateClass(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Turma
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredClasses.map(cls => (
                  <Card key={cls.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{cls.class_name}</CardTitle>
                          <CardDescription className="text-sm font-medium text-emerald-600">
                            {cls.subject_name}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={cls.is_active ? 'default' : 'secondary'}
                          className={cls.is_active ? 'bg-emerald-500' : ''}
                        >
                          {cls.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cls.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{cls.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>0/{cls.max_students} alunos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Código:</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyClassCode(cls.class_code)}
                            className="h-7 px-2 text-xs font-mono"
                          >
                            {cls.class_code}
                            <Copy className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedClass(cls);
                            loadClassStudents(cls.id);
                            loadAssessments(cls.id);
                            setShowManageClass(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Gerenciar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClass(cls.id, cls.class_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                Gerenciamento de Avaliações
              </h3>
              <p className="text-muted-foreground mb-4">
                Selecione uma turma para gerenciar suas avaliações
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab('classes')}
              >
                Ir para Turmas
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                Gerenciamento de Alunos
              </h3>
              <p className="text-muted-foreground mb-4">
                Selecione uma turma para gerenciar seus alunos
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab('classes')}
              >
                Ir para Turmas
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Class Modal */}
        <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-500" />
                Criar Nova Turma
              </DialogTitle>
              <DialogDescription>
                Preencha as informações para criar uma nova turma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="class_name">Nome da Turma</Label>
                <Input
                  id="class_name"
                  placeholder="Ex: Turma A - Matemática"
                  value={newClass.class_name}
                  onChange={(e) => setNewClass(prev => ({ ...prev, class_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject_name">Matéria</Label>
                <Select
                  value={newClass.subject_name}
                  onValueChange={(value) => setNewClass(prev => ({ ...prev, subject_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma matéria" />
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
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição da turma..."
                  value={newClass.description}
                  onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_students">Máx. Alunos</Label>
                  <Input
                    id="max_students"
                    type="number"
                    min="1"
                    max="100"
                    value={newClass.max_students}
                    onChange={(e) => setNewClass(prev => ({ ...prev, max_students: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_grade">Nota Mín.</Label>
                  <Input
                    id="minimum_grade"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newClass.minimum_grade}
                    onChange={(e) => setNewClass(prev => ({ ...prev, minimum_grade: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximum_grade">Nota Máx.</Label>
                  <Input
                    id="maximum_grade"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newClass.maximum_grade}
                    onChange={(e) => setNewClass(prev => ({ ...prev, maximum_grade: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateClass(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateClass}
                disabled={!newClass.class_name.trim() || !newClass.subject_name}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Criar Turma
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Class Modal */}
        <Dialog open={showManageClass} onOpenChange={setShowManageClass}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                {selectedClass?.class_name}
              </DialogTitle>
              <DialogDescription>
                {selectedClass?.subject_name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="students">Alunos ({classStudents.length})</TabsTrigger>
                  <TabsTrigger value="assessments">Avaliações ({assessments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {classStudents.length} de {selectedClass?.max_students} alunos
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowAddStudent(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Adicionar Aluno
                    </Button>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {classStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{student.profiles?.email || 'Email não encontrado'}</p>
                              <p className="text-xs text-muted-foreground">
                                {student.profiles?.course || 'Curso não informado'}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(student.joined_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      ))}
                      {classStudents.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Nenhum aluno na turma</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="assessments" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {assessments.length} avaliações criadas
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateAssessment(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nova Avaliação
                    </Button>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {assessments.map(assessment => {
                        const Icon = getAssessmentIcon(assessment.assessment_type);
                        return (
                          <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{assessment.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {assessment.assessment_type} • Nota máxima: {assessment.max_score}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        );
                      })}
                      {assessments.length === 0 && (
                        <div className="text-center py-8">
                          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Nenhuma avaliação criada</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Export the ultra modern version instead
import UltraModernTeacherDashboard from './UltraModernTeacherDashboard';
export default UltraModernTeacherDashboard;