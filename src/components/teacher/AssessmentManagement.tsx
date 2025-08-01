import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, ClipboardList, FileText, Trash2, Edit, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeacherAssessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: 'prova' | 'trabalho' | 'teste' | 'atividade';
  max_score: number;
  assessment_date: string;
  class_id: string;
}

interface TeacherClass {
  id: string;
  class_name: string;
  subject_name: string;
  description: string | null;
  max_students: number;
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

interface AssessmentManagementProps {
  selectedClass: TeacherClass;
  assessments: TeacherAssessment[];
  classStudents: ClassStudent[];
  onAssessmentsUpdate: () => void;
}

const AssessmentManagement: React.FC<AssessmentManagementProps> = ({
  selectedClass,
  assessments,
  classStudents,
  onAssessmentsUpdate
}) => {
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [showManageGrades, setShowManageGrades] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<TeacherAssessment | null>(null);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGrades, setEditingGrades] = useState<{[key: string]: {score: string, feedback: string}}>({});
  
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    assessment_type: 'prova' as const,
    max_score: 10,
    assessment_date: new Date().toISOString().split('T')[0]
  });

  const handleCreateAssessment = async () => {
    if (!newAssessment.title.trim()) return;
    
    setLoading(true);
    try {
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
        toast.error('Erro ao criar avaliação: ' + error.message);
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
      onAssessmentsUpdate();
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      toast.error('Erro inesperado ao criar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string, assessmentTitle: string) => {
    if (!confirm(`Tem certeza que deseja deletar a avaliação "${assessmentTitle}"? Esta ação é irreversível e removerá todas as notas dos alunos.`)) {
      return;
    }

    try {
      // Primeiro, remover todas as notas desta avaliação
      const { error: gradesError } = await supabase
        .from('student_grades')
        .delete()
        .eq('assessment_id', assessmentId);

      if (gradesError) {
        console.error('Erro ao remover notas:', gradesError);
        toast.error('Erro ao remover notas da avaliação');
        return;
      }

      // Depois, remover a avaliação
      const { error: assessmentError } = await supabase
        .from('teacher_assessments')
        .delete()
        .eq('id', assessmentId);

      if (assessmentError) {
        console.error('Erro ao deletar avaliação:', assessmentError);
        toast.error('Erro ao deletar avaliação');
        return;
      }

      toast.success('Avaliação deletada com sucesso!');
      onAssessmentsUpdate();
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error);
      toast.error('Erro inesperado ao deletar avaliação');
    }
  };

  const loadStudentGrades = async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_grades')
        .select(`
          id,
          student_id,
          score,
          feedback,
          submission_status,
          submitted_at,
          graded_at
        `)
        .eq('assessment_id', assessmentId);

      if (error) {
        console.error('Erro ao carregar notas:', error);
        return;
      }

      setStudentGrades(data || []);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    }
  };

  const ensureStudentGradesExist = async (assessmentId: string) => {
    // Carregar notas existentes
    await loadStudentGrades(assessmentId);
    
    // Verificar quais alunos não têm notas ainda
    const existingGradeStudentIds = studentGrades.map(g => g.student_id);
    const studentsWithoutGrades = classStudents.filter(s => !existingGradeStudentIds.includes(s.student_id));
    
    if (studentsWithoutGrades.length > 0) {
      const gradesToCreate = studentsWithoutGrades.map(student => ({
        student_id: student.student_id,
        assessment_id: assessmentId,
        score: null,
        submission_status: 'pendente',
        feedback: null
      }));

      try {
        const { error } = await supabase
          .from('student_grades')
          .insert(gradesToCreate);

        if (error && !error.message.includes('duplicate key')) {
          console.error('Erro ao criar registros de notas:', error);
        }
        
        // Recarregar notas após inserção
        await loadStudentGrades(assessmentId);
      } catch (error) {
        console.error('Erro ao criar registros de notas:', error);
      }
    }
  };

  const createStudentGradeIfNeeded = async (studentId: string, assessmentId: string) => {
    const { data, error } = await supabase
      .from('student_grades')
      .insert({
        student_id: studentId,
        assessment_id: assessmentId,
        score: null,
        submission_status: 'pendente',
        feedback: null
      })
      .select()
      .single();

    if (error && !error.message.includes('duplicate key')) {
      console.error('Erro ao criar registro de nota:', error);
      return null;
    }

    return data;
  };

  const handleManageGrades = async (assessment: TeacherAssessment) => {
    setSelectedAssessment(assessment);
    await ensureStudentGradesExist(assessment.id);
    
    // Inicializar estado de edição com os valores atuais
    const initialGrades: {[key: string]: {score: string, feedback: string}} = {};
    classStudents.forEach(student => {
      const grade = studentGrades.find(g => g.student_id === student.student_id);
      initialGrades[student.student_id] = {
        score: grade?.score?.toString() || '',
        feedback: grade?.feedback || ''
      };
    });
    setEditingGrades(initialGrades);
    setShowManageGrades(true);
  };

  const updateStudentGrade = async (gradeId: string, score: number | null, feedback: string, showToast: boolean = true) => {
    try {
      const { error } = await supabase
        .from('student_grades')
        .update({
          score: score,
          feedback: feedback || null,
          submission_status: score !== null ? 'entregue' : 'pendente',
          graded_at: score !== null ? new Date().toISOString() : null
        })
        .eq('id', gradeId);

      if (error) {
        console.error('Erro ao atualizar nota:', error);
        if (showToast) {
          toast.error('Erro ao atualizar nota');
        }
        return;
      }

      if (showToast) {
        toast.success('Nota atualizada com sucesso!');
      }
      if (selectedAssessment) {
        await loadStudentGrades(selectedAssessment.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      if (showToast) {
        toast.error('Erro inesperado ao atualizar nota');
      }
    }
  };

  const handleSaveAllGrades = async () => {
    if (!selectedAssessment) return;
    
    setLoading(true);
    try {
      const gradesToUpsert = [];
      
      for (const student of classStudents) {
        const editingGrade = editingGrades[student.student_id];
        if (!editingGrade) continue;
        
        const score = editingGrade.score ? parseFloat(editingGrade.score) : null;
        const feedback = editingGrade.feedback.trim() || null;
        
        gradesToUpsert.push({
          student_id: student.student_id,
          assessment_id: selectedAssessment.id,
          score: score,
          feedback: feedback,
          submission_status: score !== null ? 'entregue' : 'pendente',
          graded_at: score !== null ? new Date().toISOString() : null
        });
      }
      
      if (gradesToUpsert.length > 0) {
        const { error } = await supabase
          .from('student_grades')
          .upsert(gradesToUpsert, {
            onConflict: 'assessment_id,student_id'
          });

        if (error) {
          console.error('Erro ao salvar notas:', error);
          toast.error('Erro ao salvar notas: ' + error.message);
          return;
        }
      }
      
      toast.success('Todas as notas foram salvas com sucesso!');
      await loadStudentGrades(selectedAssessment.id);
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      toast.error('Erro ao salvar as notas');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Avaliações</h3>
        <Dialog open={showCreateAssessment} onOpenChange={setShowCreateAssessment}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Avaliação</DialogTitle>
              <DialogDescription>
                Crie uma nova avaliação para a turma "{selectedClass.class_name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="assessment_title">Título</Label>
                <Input
                  id="assessment_title"
                  placeholder="Ex: Prova de Matemática"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="assessment_type">Tipo</Label>
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
              <div className="grid grid-cols-2 gap-4">
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
                  disabled={!newAssessment.title.trim() || loading}
                >
                  {loading ? 'Criando...' : 'Criar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateAssessment(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma avaliação criada</p>
          <p className="text-sm">Crie sua primeira avaliação</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{getAssessmentIcon(assessment.assessment_type)}</span>
                <div className="flex-1">
                  <p className="font-medium">{assessment.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {assessment.assessment_type} • Nota máxima: {assessment.max_score} • 
                    Data: {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}
                  </p>
                  {assessment.description && (
                    <p className="text-xs text-muted-foreground mt-1">{assessment.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManageGrades(assessment)}
                  title="Gerenciar notas"
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAssessment(assessment.id, assessment.title)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Deletar avaliação"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Gerenciar Notas - Design Moderno */}
      <Dialog open={showManageGrades} onOpenChange={setShowManageGrades}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-6 border-b">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Gerenciar Notas: {selectedAssessment?.title}
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {selectedAssessment?.assessment_type} • Nota máxima: {selectedAssessment?.max_score} • 
                  Data: {selectedAssessment ? new Date(selectedAssessment.assessment_date).toLocaleDateString('pt-BR') : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {classStudents.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum aluno matriculado</h3>
                <p className="text-slate-500">Adicione alunos à turma para gerenciar suas notas</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 rounded-xl font-semibold text-slate-700 text-sm">
                  <div className="col-span-4">Aluno</div>
                  <div className="col-span-2">Nota</div>
                  <div className="col-span-4">Feedback</div>
                  <div className="col-span-2">Status</div>
                </div>

                {/* Lista de alunos */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {classStudents.map((student, index) => {
                    const grade = studentGrades.find(g => g.student_id === student.student_id);
                    
                    return (
                      <div key={student.id} className={`grid grid-cols-12 gap-4 px-6 py-4 rounded-xl border transition-all hover:shadow-md ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                      }`}>
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                            {student.profiles?.email?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.profiles?.email || 'Email não encontrado'}</p>
                            <p className="text-sm text-slate-500">{student.profiles?.course || 'Curso não informado'}</p>
                          </div>
                        </div>
                        
                        <div className="col-span-2 flex items-center">
                          <div className="relative w-full">
                            <Input
                              type="number"
                              min="0"
                              max={selectedAssessment?.max_score}
                              step="0.1"
                              value={editingGrades[student.student_id]?.score || ''}
                              onChange={(e) => {
                                setEditingGrades(prev => ({
                                  ...prev,
                                  [student.student_id]: {
                                    ...prev[student.student_id],
                                    score: e.target.value
                                  }
                                }));
                              }}
                              placeholder="0.0"
                              className="text-center font-medium"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                              /{selectedAssessment?.max_score}
                            </span>
                          </div>
                        </div>
                        
                        <div className="col-span-4 flex items-center">
                          <Input
                            value={editingGrades[student.student_id]?.feedback || ''}
                            onChange={(e) => {
                              setEditingGrades(prev => ({
                                ...prev,
                                [student.student_id]: {
                                  ...prev[student.student_id],
                                  feedback: e.target.value
                                }
                              }));
                            }}
                            placeholder="Comentários sobre a avaliação..."
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="col-span-2 flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={grade?.score ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {grade?.submission_status || 'Pendente'}
                          </Badge>
                          {grade?.graded_at && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(grade.graded_at).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {classStudents.filter(s => {
                        const grade = studentGrades.find(g => g.student_id === s.student_id);
                        return grade?.score;
                      }).length}
                    </p>
                    <p className="text-sm text-slate-600">Avaliados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {classStudents.filter(s => {
                        const grade = studentGrades.find(g => g.student_id === s.student_id);
                        return !grade?.score;
                      }).length}
                    </p>
                    <p className="text-sm text-slate-600">Pendentes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{classStudents.length}</p>
                    <p className="text-sm text-slate-600">Total</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-6 border-t bg-slate-50 -mx-6 px-6 -mb-6 pb-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ClipboardList className="h-4 w-4" />
              <span>
                {classStudents.filter(s => {
                  const grade = studentGrades.find(g => g.student_id === s.student_id);
                  return grade?.score;
                }).length} de {classStudents.length} alunos avaliados
              </span>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowManageGrades(false)}
                disabled={loading}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveAllGrades}
                disabled={loading}
                className="px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Todas as Notas'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentManagement;