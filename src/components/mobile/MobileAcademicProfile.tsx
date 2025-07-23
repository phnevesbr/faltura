
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, GraduationCap, Clock, MapPin, Edit, Save, X, History, Trash2, Plus, Archive } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import AvatarUpload from '../AvatarUpload';
import { toast } from 'sonner';

const MobileAcademicProfile: React.FC = () => {
  const { user } = useAuth();
  const { profile, semesterHistory, updateProfile, getDaysUntilSemesterEnd, archiveSemester, startNewSemester, deleteSemesterHistory } = useProfile();
  const { awardProfileUpdateXP, awardNewSemesterXP } = useGamification();
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNewSemester, setShowNewSemester] = useState(false);
  const [newSemesterData, setNewSemesterData] = useState({ semesterStart: '', semesterEnd: '' });
  const [formData, setFormData] = useState({
    course: profile?.course || '',
    university: profile?.university || '',
    shift: profile?.shift || 'morning',
    semesterStart: profile?.semesterStart || '',
    semesterEnd: profile?.semesterEnd || ''
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Perfil atualizado!');
      // Dar XP por atualizar perfil APENAS se a atualização foi bem-sucedida
      await awardProfileUpdateXP();
    } catch (error) {
      console.error('Error updating profile:', error);
      // Não dar XP se houve erro (incluindo rate limit)
    }
  };

  const handleCancel = () => {
    setFormData({
      course: profile?.course || '',
      university: profile?.university || '',
      shift: profile?.shift || 'morning',
      semesterStart: profile?.semesterStart || '',
      semesterEnd: profile?.semesterEnd || ''
    });
    setIsEditing(false);
  };

  const shiftLabels = {
    morning: 'Matutino',
    afternoon: 'Vespertino',
    night: 'Noturno'
  };

  const daysUntilEnd = getDaysUntilSemesterEnd();
  const isSemesterEnded = daysUntilEnd === 0 && profile?.semesterEnd && new Date() >= new Date(profile.semesterEnd);

  const handleArchiveSemester = async () => {
    await archiveSemester();
    toast.success('Semestre arquivado!');
  };

  const handleStartNewSemester = async () => {
    if (!newSemesterData.semesterStart || !newSemesterData.semesterEnd) {
      toast.error('Preencha todas as datas do novo semestre');
      return;
    }
    
    await startNewSemester(newSemesterData.semesterStart, newSemesterData.semesterEnd);
    await awardNewSemesterXP();
    setShowNewSemester(false);
    setNewSemesterData({ semesterStart: '', semesterEnd: '' });
    toast.success('Novo semestre iniciado!');
  };

  const handleDeleteSemester = async (semesterId: string) => {
    try {
      await deleteSemesterHistory(semesterId);
      toast.success('Semestre removido do histórico!');
    } catch (error) {
      toast.error('Erro ao remover semestre');
      console.error('Error deleting semester:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center space-y-3">
            <AvatarUpload size="lg" />
            <div>
              <CardTitle className="text-xl">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante'}</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div className="pt-2">
            {!isEditing ? (
              <div className="space-y-2">
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
                <Button onClick={() => setShowHistory(!showHistory)} variant="outline" size="sm" className="w-full">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Academic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Informações Acadêmicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course">Curso</Label>
            {isEditing ? (
              <Input
                id="course"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="Digite seu curso"
              />
            ) : (
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {profile?.course || 'Não informado'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">Universidade/Escola</Label>
            {isEditing ? (
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="Digite sua instituição"
              />
            ) : (
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {profile?.university || 'Não informado'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Turno</Label>
            {isEditing ? (
              <Select value={formData.shift} onValueChange={(value: any) => setFormData({ ...formData, shift: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Matutino</SelectItem>
                  <SelectItem value="afternoon">Vespertino</SelectItem>
                  <SelectItem value="night">Noturno</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {shiftLabels[profile?.shift || 'morning']}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Semester Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Semestre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>Início do Semestre</Label>
                <Input
                  type="date"
                  value={formData.semesterStart}
                  onChange={(e) => setFormData({ ...formData, semesterStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim do Semestre</Label>
                <Input
                  type="date"
                  value={formData.semesterEnd}
                  onChange={(e) => setFormData({ ...formData, semesterEnd: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded">
                <p className="text-sm font-medium">Período</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.semesterStart ? new Date(profile.semesterStart).toLocaleDateString('pt-BR') : 'Não informado'} - {profile?.semesterEnd ? new Date(profile.semesterEnd).toLocaleDateString('pt-BR') : 'Não informado'}
                </p>
              </div>
              
              {daysUntilEnd > 0 ? (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium text-green-700">
                      {daysUntilEnd} dias restantes no semestre
                    </p>
                  </div>
                </div>
              ) : isSemesterEnded ? (
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <p className="text-sm font-medium text-orange-700">
                    ⚠️ Semestre finalizado! Toque para arquivar.
                  </p>
                  <Button 
                    onClick={handleArchiveSemester} 
                    size="sm" 
                    className="w-full mt-2"
                  >
                    Arquivar Semestre
                  </Button>
                </div>
              ) : null}
              
              {/* Novo Semestre */}
              {!showNewSemester ? (
                <Button 
                  onClick={() => setShowNewSemester(true)} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Novo Semestre
                </Button>
              ) : (
                <div className="space-y-3 p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Novo Semestre</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterStart}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterEnd}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleStartNewSemester} size="sm" className="flex-1">
                      Iniciar
                    </Button>
                    <Button onClick={() => setShowNewSemester(false)} variant="outline" size="sm" className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-xl font-bold text-primary">
                  {profile?.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </p>
                <p className="text-xs text-muted-foreground">Dias no app</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xl font-bold text-blue-600">
                  {daysUntilEnd}
                </p>
                <p className="text-xs text-muted-foreground">Dias restantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semester History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Semestres</CardTitle>
          </CardHeader>
          <CardContent>
            {semesterHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">
                Nenhum semestre arquivado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {semesterHistory.map((semester) => (
                  <div key={semester.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{semester.course}</h4>
                        <p className="text-xs text-muted-foreground">{semester.university}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(semester.semesterStart).toLocaleDateString('pt-BR')} - {new Date(semester.semesterEnd).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSemester(semester.id)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-sm font-bold text-blue-600">
                          {semester.subjectsData.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Matérias</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <p className="text-sm font-bold text-red-600">
                          {semester.absencesData.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Faltas</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-sm font-bold text-green-600">
                          {semester.notesData.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Tarefas</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="text-sm font-bold text-purple-600">
                          {semester.achievementsData.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Conquistas</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileAcademicProfile;
