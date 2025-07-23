
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, GraduationCap, Clock, MapPin, Edit, Save, X, Archive, Plus, History, Trash2, User, Trophy } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import AvatarUpload from './AvatarUpload';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';
import GamificationProfile from './GamificationProfile';
import OnboardingFlow from './OnboardingFlow';

const AcademicProfile: React.FC = () => {
  const { user } = useAuth();
  const { profile, semesterHistory, updateProfile, getDaysUntilSemesterEnd, archiveSemester, startNewSemester, deleteSemesterHistory } = useProfile();
  const { awardProfileUpdateXP, awardNewSemesterXP } = useGamification();
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNewSemester, setShowNewSemester] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    course: profile?.course || '',
    university: profile?.university || '',
    shift: profile?.shift || 'morning',
    semesterStart: profile?.semesterStart || '',
    semesterEnd: profile?.semesterEnd || ''
  });
  const [newSemesterData, setNewSemesterData] = useState({
    semesterStart: '',
    semesterEnd: ''
  });

  // Sync formData with profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        course: profile.course || '',
        university: profile.university || '',
        shift: profile.shift || 'morning',
        semesterStart: profile.semesterStart || '',
        semesterEnd: profile.semesterEnd || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
      // Dar XP por atualizar perfil APENAS se a atualização foi bem-sucedida
      await awardProfileUpdateXP();
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      console.error('Profile update error:', error);
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
    toast.success('Semestre arquivado com sucesso!');
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


  return (
    <div className="space-y-6 h-full min-h-[600px]">
        {/* Tabs para alternar entre perfil acadêmico e gamificação */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg max-w-md mx-auto">
          <Button
            variant={activeTab === 'info' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('info')}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Informações
          </Button>
          <Button
            variant={activeTab === 'gamification' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('gamification')}
            className="flex-1"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Gamificação
          </Button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="text-center pb-6">
          <div className="flex flex-col items-center space-y-4">
            <AvatarUpload size="lg" />
            <div>
              <CardTitle className="text-2xl">{user?.user_metadata?.name}</CardTitle>
              <CardDescription className="text-base">{user?.email}</CardDescription>
            </div>
          </div>
          
          <div className="pt-4 space-y-3">
            {!isEditing ? (
              <div className="flex justify-center gap-3 flex-wrap">
                <Button onClick={() => setIsEditing(true)} variant="outline" className="px-6">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
                <Button onClick={() => {
                  setShowHistory(!showHistory);
                  // Scroll automático para a seção de histórico
                  setTimeout(() => {
                    const historySection = document.getElementById('history-section');
                    if (historySection) {
                      historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }} variant="outline" className="px-6">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
                {isSemesterEnded && (
                  <Button onClick={handleArchiveSemester} variant="outline" className="px-6">
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar Semestre
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex justify-center space-x-3">
                <Button onClick={handleSave} className="px-8">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button onClick={handleCancel} variant="outline" className="px-8">
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
          <CardTitle className="text-xl flex items-center">
            <GraduationCap className="h-6 w-6 mr-3" />
            Informações Acadêmicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="course" className="text-base font-medium">Curso</Label>
              {isEditing ? (
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="Digite seu curso"
                  className="h-12"
                />
              ) : (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-muted-foreground">
                    {profile?.course || 'Não informado'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="university" className="text-base font-medium">Universidade/Escola</Label>
              {isEditing ? (
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="Digite sua instituição"
                  className="h-12"
                />
              ) : (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-muted-foreground">
                    {profile?.university || 'Não informado'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label className="text-base font-medium">Turno</Label>
              {isEditing ? (
                <Select value={formData.shift} onValueChange={(value: any) => setFormData({ ...formData, shift: value })}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Matutino</SelectItem>
                    <SelectItem value="afternoon">Vespertino</SelectItem>
                    <SelectItem value="night">Noturno</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-muted-foreground">
                    {shiftLabels[profile?.shift || 'morning']}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semester Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Calendar className="h-6 w-6 mr-3" />
            Informações do Semestre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Início do Semestre</Label>
                <Input
                  type="date"
                  value={formData.semesterStart}
                  onChange={(e) => setFormData({ ...formData, semesterStart: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">Fim do Semestre</Label>
                <Input
                  type="date"
                  value={formData.semesterEnd}
                  onChange={(e) => setFormData({ ...formData, semesterEnd: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-base font-medium mb-2">Período do Semestre</p>
                <p className="text-muted-foreground">
                  {profile?.semesterStart ? new Date(profile.semesterStart).toLocaleDateString('pt-BR') : 'Não informado'} - {profile?.semesterEnd ? new Date(profile.semesterEnd).toLocaleDateString('pt-BR') : 'Não informado'}
                </p>
              </div>
              
              {daysUntilEnd > 0 ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-base font-medium text-green-700">
                      {daysUntilEnd} dias restantes no semestre
                    </p>
                  </div>
                </div>
              ) : isSemesterEnded ? (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-orange-700">
                    ⚠️ Semestre finalizado! Arquive este semestre e inicie um novo.
                  </AlertDescription>
                </Alert>
              ) : null}
              
              {!showNewSemester ? (
                <Button 
                  onClick={() => setShowNewSemester(true)} 
                  variant="outline" 
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Novo Semestre
                </Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Novo Semestre</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Início</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterStart}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterEnd}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleStartNewSemester} size="sm">
                      Iniciar
                    </Button>
                    <Button onClick={() => setShowNewSemester(false)} variant="outline" size="sm">
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
            <CardTitle className="text-xl">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary mb-1">
                  {profile?.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Dias no app</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 mb-1">
                  {daysUntilEnd}
                </p>
                <p className="text-sm text-muted-foreground">Dias restantes</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl mb-1">
                  {profile?.shift === 'morning' ? '🌅' : profile?.shift === 'afternoon' ? '🌞' : '🌙'}
                </p>
                <p className="text-sm text-muted-foreground">Turno</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl mb-1">
                  {profile?.course ? '📚' : '❓'}
                </p>
                <p className="text-sm text-muted-foreground">Curso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semester History */}
      {showHistory && (
        <Card id="history-section">
          <CardHeader>
            <CardTitle className="text-xl">Histórico de Semestres</CardTitle>
          </CardHeader>
          <CardContent>
            {semesterHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum semestre arquivado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {semesterHistory.map((semester) => (
                  <div key={semester.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{semester.course}</h4>
                        <p className="text-sm text-muted-foreground">{semester.university}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(semester.semesterStart).toLocaleDateString('pt-BR')} - {new Date(semester.semesterEnd).toLocaleDateString('pt-BR')}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSemesterHistory(semester.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-lg font-bold text-blue-600">
                          {semester.subjectsData.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Matérias</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <p className="text-lg font-bold text-red-600">
                          {semester.absencesData.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Faltas</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-lg font-bold text-green-600">
                          {semester.notesData.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Tarefas</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="text-lg font-bold text-purple-600">
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
        )}

        {activeTab === 'gamification' && (
          <GamificationProfile />
        )}
      </div>
  );
};

export default AcademicProfile;
