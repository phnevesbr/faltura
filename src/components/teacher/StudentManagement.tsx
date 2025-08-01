import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClassStudent {
  id: string;
  student_id: string;
  joined_at: string;
  profiles: {
    email: string;
    course: string;
  } | null;
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

interface StudentManagementProps {
  selectedClass: TeacherClass;
  classStudents: ClassStudent[];
  onStudentsUpdate: () => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({
  selectedClass,
  classStudents,
  onStudentsUpdate
}) => {
  const [studentEmail, setStudentEmail] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddStudent = async () => {
    if (!studentEmail.trim()) return;
    
    setLoading(true);
    try {
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

      // Verificar limite de alunos
      if (classStudents.length >= selectedClass.max_students) {
        toast.error(`Limite de ${selectedClass.max_students} alunos atingido`);
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
        toast.error('Erro ao adicionar aluno: ' + error.message);
        return;
      }

      toast.success('Aluno adicionado com sucesso!');
      setStudentEmail('');
      setShowAddStudent(false);
      onStudentsUpdate();
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
      toast.error('Erro inesperado ao adicionar aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentEmail: string) => {
    if (!confirm(`Tem certeza que deseja remover o aluno "${studentEmail}" da turma "${selectedClass.class_name}"?`)) {
      return;
    }

    try {
      // Primeiro, buscar o student record para remover
      const studentToRemove = classStudents.find(s => s.id === studentId);
      if (!studentToRemove) {
        toast.error('Aluno não encontrado');
        return;
      }

      // Remover todas as notas do aluno nesta turma
      const { error: gradesError } = await supabase
        .from('student_grades')
        .delete()
        .eq('student_id', studentToRemove.student_id)
        .in('assessment_id', 
          await supabase
            .from('teacher_assessments')
            .select('id')
            .eq('class_id', selectedClass.id)
            .then(result => result.data?.map(a => a.id) || [])
        );

      if (gradesError) {
        console.error('Erro ao remover notas do aluno:', gradesError);
        // Continuar mesmo assim, pois as notas podem não existir
      }

      // Remover o aluno da turma
      const { error: studentError } = await supabase
        .from('teacher_class_students')
        .delete()
        .eq('id', studentId);

      if (studentError) {
        console.error('Erro ao remover aluno:', studentError);
        toast.error('Erro ao remover aluno: ' + studentError.message);
        return;
      }

      toast.success('Aluno removido com sucesso!');
      onStudentsUpdate();
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast.error('Erro inesperado ao remover aluno');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lista de Alunos</h3>
        <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={classStudents.length >= selectedClass.max_students}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Aluno</DialogTitle>
              <DialogDescription>
                Digite o email do aluno para adicioná-lo à turma "{selectedClass.class_name}"
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {classStudents.length}/{selectedClass.max_students} alunos
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddStudent} 
                  className="flex-1"
                  disabled={!studentEmail.trim() || loading}
                >
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddStudent(false);
                    setStudentEmail('');
                  }}
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

      {classStudents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum aluno matriculado</p>
          <p className="text-sm">Adicione alunos ou compartilhe o código da turma</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {classStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1">
                <p className="font-medium">{student.profiles?.email || 'Email não encontrado'}</p>
                <p className="text-sm text-muted-foreground">
                  Curso: {student.profiles?.course || 'Não informado'} | 
                  Ingressou em: {new Date(student.joined_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveStudent(student.id, student.profiles?.email || 'Aluno')}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Remover aluno"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentManagement;