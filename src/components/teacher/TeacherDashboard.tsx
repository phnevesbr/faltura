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
  TrendingUp
} from 'lucide-react';
import StudentManagement from './StudentManagement';
import AssessmentManagement from './AssessmentManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);

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
    console.log('🎯 DEBUG: Carregando turmas para user:', user?.id);
    const { data, error } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('teacher_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🎯 DEBUG: Erro ao carregar turmas:', error);
      return;
    }

    console.log('🎯 DEBUG: Turmas carregadas:', data);
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
    console.log('🎯 DEBUG: Iniciando criação de turma');
    console.log('🎯 DEBUG: User:', user);
    console.log('🎯 DEBUG: NewClass:', newClass);
    
    if (!newClass.class_name.trim() || !newClass.subject_name.trim() || !user) {
      console.log('🎯 DEBUG: Validação falhou');
      return;
    }

    // O código será gerado automaticamente pelo trigger
    console.log('🎯 DEBUG: Inserindo turma...');

    const insertData = {
      teacher_id: user.id,
      class_name: newClass.class_name.trim(),
      subject_name: newClass.subject_name,
      description: newClass.description.trim() || null,
      max_students: newClass.max_students,
      minimum_grade: newClass.minimum_grade,
      maximum_grade: newClass.maximum_grade,
      class_code: '' // Será sobrescrito pelo trigger
    };
    
    console.log('🎯 DEBUG: Dados a inserir:', insertData);

    const { data, error } = await supabase
      .from('teacher_classes')
      .insert(insertData)
      .select();

    if (error) {
      console.error('🎯 DEBUG: Erro ao criar turma:', error);
      toast.error('Erro ao criar turma: ' + error.message);
      return;
    }

    console.log('🎯 DEBUG: Turma criada com sucesso:', data);
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
    
    console.log('🎯 DEBUG: Recarregando turmas...');
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

  const handleAddStudent = async () => {
    if (!studentEmail.trim() || !selectedClass) return;

    // Buscar o usuário pelo email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', studentEmail.trim())
      .maybeSingle();

    if (profileError) {
      console.error('Erro ao buscar usuário:', profileError);
      toast.error('Erro ao buscar usuário');
      return;
    }

    if (!profileData) {
      toast.error('Usuário não encontrado com este email');
      return;
    }

    // Verificar se já está na turma
    const { data: existingStudent } = await supabase
      .from('teacher_class_students')
      .select('id')
      .eq('class_id', selectedClass.id)
      .eq('student_id', profileData.user_id)
      .maybeSingle();

    if (existingStudent) {
      toast.error('Este aluno já está na turma');
      return;
    }

    const { error } = await supabase
      .from('teacher_class_students')
      .insert({
        class_id: selectedClass.id,
        student_id: profileData.user_id
      });

    if (error) {
      console.error('Erro ao adicionar aluno:', error);
      toast.error('Erro ao adicionar aluno');
      return;
    }

    toast.success('Aluno adicionado com sucesso!');
    setStudentEmail('');
    setShowAddStudent(false);
    await loadClassStudents(selectedClass.id);
  };

  const handleCreateAssessment = async () => {
    if (!newAssessment.title.trim() || !selectedClass) return;

    const { error } = await supabase
      .from('teacher_assessments')
      .insert({
        class_id: selectedClass.id,
        title: newAssessment.title.trim(),
        description: newAssessment.description.trim() || null,
        assessment_type: newAssessment.assessment_type,
        max_score: newAssessment.max_score,
        assessment_date: newAssessment.assessment_date
      });

    if (error) {
      console.error('Erro ao criar avaliação:', error);
      toast.error('Erro ao criar avaliação');
      return;
    }

    toast.success('Avaliação criada com sucesso!');
    setNewAssessment({
      title: '',
      description: '',
      assessment_type: 'prova',
      max_score: 10,
      assessment_date: new Date().toISOString().split('T')[0]
    });
    setShowCreateAssessment(false);
    await loadAssessments(selectedClass.id);
  };

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'prova': return '📚';
      case 'trabalho': return '📄';
      case 'teste': return '✅';
      case 'atividade': return '🛠️';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando painel do professor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel do Professor</h1>
          <p className="text-muted-foreground">Gerencie suas matérias, turmas e avaliações</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <GraduationCap className="h-4 w-4 mr-1" />
          Professor
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subjects">Matérias</TabsTrigger>
          <TabsTrigger value="classes">Turmas</TabsTrigger>
          <TabsTrigger value="assessments">Avaliações</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Matérias</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subjects.length}</div>
                <p className="text-xs text-muted-foreground">
                  Matérias que você leciona
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Turmas ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classes.reduce((total, cls) => total + (classStudents.length || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Alunos em suas turmas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Últimas turmas criadas */}
          <Card>
            <CardHeader>
              <CardTitle>Turmas Recentes</CardTitle>
              <CardDescription>Suas turmas criadas recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.slice(0, 3).map((cls) => (
                <div key={cls.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{cls.class_name}</p>
                    <p className="text-sm text-muted-foreground">{cls.subject_name}</p>
                  </div>
                  <Badge variant={cls.is_active ? "default" : "secondary"}>
                    {cls.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              ))}
              {classes.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma turma criada ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Matérias */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Suas Matérias
              </CardTitle>
              <CardDescription>
                Gerencie as matérias que você leciona
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da matéria (ex: Matemática)"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                />
                <Button onClick={handleAddSubject} disabled={!newSubject.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjects.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma matéria cadastrada</p>
                    <p className="text-sm">Adicione sua primeira matéria acima</p>
                  </div>
                ) : (
                  subjects.map((subject) => (
                    <Card key={subject.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{subject.subject_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(subject.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubject(subject.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Turmas */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Suas Turmas
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas turmas e alunos
                  </CardDescription>
                </div>
                <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Turma
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Turma</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para criar uma nova turma
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="class_name">Nome da Turma</Label>
                        <Input
                          id="class_name"
                          placeholder="ex: 1º Ano A"
                          value={newClass.class_name}
                          onChange={(e) => setNewClass(prev => ({
                            ...prev,
                            class_name: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject_name">Matéria</Label>
                        <Select 
                          value={newClass.subject_name}
                          onValueChange={(value) => setNewClass(prev => ({
                            ...prev,
                            subject_name: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma matéria" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.subject_name}>
                                {subject.subject_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {subjects.length === 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Adicione pelo menos uma matéria primeiro
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Textarea
                          id="description"
                          placeholder="Descrição da turma"
                          value={newClass.description}
                          onChange={(e) => setNewClass(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_students">Máximo de Alunos</Label>
                        <Input
                          id="max_students"
                          type="number"
                          min="1"
                          max="100"
                          value={newClass.max_students}
                          onChange={(e) => setNewClass(prev => ({
                            ...prev,
                            max_students: parseInt(e.target.value) || 30
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimum_grade">Nota Mínima para Aprovação</Label>
                        <Input
                          id="minimum_grade"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={newClass.minimum_grade}
                          onChange={(e) => setNewClass(prev => ({
                            ...prev,
                            minimum_grade: parseFloat(e.target.value) || 6.0
                          }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Nota mínima que os alunos precisam para serem aprovados (0.0 - 10.0)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="maximum_grade">Nota Máxima</Label>
                        <Input
                          id="maximum_grade"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={newClass.maximum_grade}
                          onChange={(e) => setNewClass(prev => ({
                            ...prev,
                            maximum_grade: parseFloat(e.target.value) || 10.0
                          }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Nota máxima da disciplina (0.0 - 10.0)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCreateClass} 
                          className="flex-1"
                          disabled={!newClass.class_name.trim() || !newClass.subject_name}
                        >
                          Criar Turma
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateClass(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {classes.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma turma criada</p>
                    <p className="text-sm">Crie sua primeira turma clicando no botão acima</p>
                  </div>
                ) : (
                  classes.map((classItem) => (
                    <Card key={classItem.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                            <CardDescription>{classItem.subject_name}</CardDescription>
                          </div>
                          <Badge variant={classItem.is_active ? "default" : "secondary"}>
                            {classItem.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Código da Turma</p>
                            <p className="text-lg font-mono">{classItem.class_code}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyClassCode(classItem.class_code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        {classItem.description && (
                          <p className="text-sm text-muted-foreground">{classItem.description}</p>
                        )}

                         <div className="flex gap-2">
                           <Dialog open={showManageClass} onOpenChange={setShowManageClass}>
                             <DialogTrigger asChild>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   setSelectedClass(classItem);
                                   loadClassStudents(classItem.id);
                                   loadAssessments(classItem.id);
                                 }}
                                 className="flex-1"
                               >
                                 <ClipboardList className="h-4 w-4 mr-2" />
                                 Gerenciar
                                </Button>
                              </DialogTrigger>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteClass(classItem.id, classItem.class_name)}
                                className="ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                             <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                               <DialogHeader>
                                 <DialogTitle>Gerenciar Turma: {classItem.class_name}</DialogTitle>
                                 <DialogDescription>
                                   {classItem.subject_name} • Código: {classItem.class_code}
                                 </DialogDescription>
                               </DialogHeader>
                              
                              <div className="space-y-6">
                                {/* Informações da turma */}
                                <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                                  <div>
                                    <p className="text-sm font-medium">Alunos Matriculados</p>
                                    <p className="text-2xl font-bold">{classStudents.length}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Máximo de Alunos</p>
                                    <p className="text-2xl font-bold">{classItem.max_students}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Nota Mínima</p>
                                    <p className="text-2xl font-bold">{classItem.minimum_grade?.toFixed(1) || '6.0'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Nota Máxima</p>
                                    <p className="text-2xl font-bold">{classItem.maximum_grade?.toFixed(1) || '10.0'}</p>
                                  </div>
                                </div>

                                 {/* Aba de Gerenciamento */}
                                 <Tabs defaultValue="students" className="w-full">
                                   <TabsList className="grid w-full grid-cols-2">
                                     <TabsTrigger value="students">Alunos</TabsTrigger>
                                     <TabsTrigger value="assessments">Avaliações</TabsTrigger>
                                   </TabsList>

                                   {/* Aba Alunos */}
                                   <TabsContent value="students" className="space-y-4">
                                     <StudentManagement 
                                       selectedClass={classItem}
                                       classStudents={classStudents}
                                       onStudentsUpdate={() => loadClassStudents(classItem.id)}
                                     />
                                   </TabsContent>

                                   {/* Aba Avaliações */}
                                   <TabsContent value="assessments" className="space-y-4">
                                     <AssessmentManagement 
                                       selectedClass={classItem}
                                       assessments={assessments}
                                       classStudents={classStudents}
                                       onAssessmentsUpdate={() => loadAssessments(classItem.id)}
                                     />
                                   </TabsContent>
                                 </Tabs>

                                <div className="flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowManageClass(false)}
                                  >
                                    Fechar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedClass(classItem)}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adicionar Aluno</DialogTitle>
                                <DialogDescription>
                                  Digite o email do aluno para adicioná-lo à turma "{classItem.class_name}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="student_email">Email do Aluno</Label>
                                  <Input
                                    id="student_email"
                                    type="email"
                                    placeholder="aluno@email.com"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleAddStudent} 
                                    className="flex-1"
                                    disabled={!studentEmail.trim()}
                                  >
                                    Adicionar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowAddStudent(false)}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Avaliações */}
        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Avaliações
                  </CardTitle>
                  <CardDescription>
                    Gerencie as avaliações de suas turmas
                  </CardDescription>
                </div>
                <Dialog open={showCreateAssessment} onOpenChange={setShowCreateAssessment}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedClass}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Avaliação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Avaliação</DialogTitle>
                      <DialogDescription>
                        Crie uma avaliação para a turma selecionada
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="assessment_title">Título da Avaliação</Label>
                        <Input
                          id="assessment_title"
                          placeholder="ex: Prova Bimestral"
                          value={newAssessment.title}
                          onChange={(e) => setNewAssessment(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="assessment_type">Tipo de Avaliação</Label>
                        <Select 
                          value={newAssessment.assessment_type}
                          onValueChange={(value: any) => setNewAssessment(prev => ({
                            ...prev,
                            assessment_type: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prova">📚 Prova</SelectItem>
                            <SelectItem value="trabalho">📄 Trabalho</SelectItem>
                            <SelectItem value="teste">✅ Teste</SelectItem>
                            <SelectItem value="atividade">🛠️ Atividade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="assessment_date">Data</Label>
                        <Input
                          id="assessment_date"
                          type="date"
                          value={newAssessment.assessment_date}
                          onChange={(e) => setNewAssessment(prev => ({
                            ...prev,
                            assessment_date: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_score">Nota Máxima</Label>
                        <Input
                          id="max_score"
                          type="number"
                          min="1"
                          max="100"
                          step="0.1"
                          value={newAssessment.max_score}
                          onChange={(e) => setNewAssessment(prev => ({
                            ...prev,
                            max_score: parseFloat(e.target.value) || 10
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="assessment_description">Descrição (opcional)</Label>
                        <Textarea
                          id="assessment_description"
                          placeholder="Descrição da avaliação"
                          value={newAssessment.description}
                          onChange={(e) => setNewAssessment(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCreateAssessment} 
                          className="flex-1"
                          disabled={!newAssessment.title.trim()}
                        >
                          Criar Avaliação
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateAssessment(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedClass ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma turma para gerenciar avaliações</p>
                  <p className="text-sm">Vá para a aba "Turmas" e clique em "Gerenciar" em uma turma</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Turma: {selectedClass.class_name}</p>
                    <p className="text-sm text-muted-foreground">Matéria: {selectedClass.subject_name}</p>
                  </div>
                  
                  {assessments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma avaliação criada</p>
                      <p className="text-sm">Crie sua primeira avaliação clicando no botão acima</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assessments.map((assessment) => (
                        <Card key={assessment.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center">
                                  <span className="mr-2">{getAssessmentIcon(assessment.assessment_type)}</span>
                                  {assessment.title}
                                </CardTitle>
                                <CardDescription>
                                  {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}
                                </CardDescription>
                              </div>
                              <Badge variant="outline">
                                Nota máx: {assessment.max_score}
                              </Badge>
                            </div>
                          </CardHeader>
                          {assessment.description && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{assessment.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default TeacherDashboard;