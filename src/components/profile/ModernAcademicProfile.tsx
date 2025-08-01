import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Save, X, User, Trophy, History, Settings, Palette } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'sonner';

// Componentes modernos
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import AcademicInfoCard from './AcademicInfoCard';
import SemesterCard from './SemesterCard';
import ProfileSettings from './ProfileSettings';
import ThemeSelector from './ThemeSelector';
import RankingLeaderboard from '../RankingLeaderboard';

const ModernAcademicProfile: React.FC = () => {
  const { profile, semesterHistory, updateProfile, deleteSemesterHistory } = useProfile();
  const { awardProfileUpdateXP } = useGamification();
  const { shouldShowNotification } = useNotifications();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [formData, setFormData] = useState({
    course: profile?.course || '',
    university: profile?.university || '',
    shift: profile?.shift || 'morning',
    semesterStart: profile?.semesterStart || '',
    semesterEnd: profile?.semesterEnd || ''
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
      if (shouldShowNotification('profile')) {
        toast.success('👤 Perfil atualizado com sucesso!');
      }
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

  const handleEditToggle = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header do Perfil */}
      <ProfileHeader
        profile={profile}
        isEditing={isEditing}
        onEditToggle={handleEditToggle}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Estatísticas Rápidas */}
      <ProfileStats />

      {/* Actions Bar (apenas quando editando) */}
      {isEditing && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="h-4 w-4" />
                Modo de edição ativo
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2">
            <Palette className="h-4 w-4" />
            Temas
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AcademicInfoCard
              isEditing={isEditing}
              formData={formData}
              profile={profile}
              onFormDataChange={setFormData}
            />
            <SemesterCard
              isEditing={isEditing}
              formData={formData}
              onFormDataChange={setFormData}
            />
          </div>
        </TabsContent>


        <TabsContent value="themes">
          <ThemeSelector />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {semesterHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Nenhum histórico ainda</h3>
                  <p className="text-sm">
                    Os semestres arquivados aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Semestres Anteriores</h3>
                  <ScrollArea className={`${semesterHistory.length > 3 ? 'h-[400px]' : 'h-auto'}`}>
                    <div className="space-y-4 pr-4">
                      {semesterHistory.map((semester) => (
                        <Card key={semester.id} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">{semester.course}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {semester.university}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right text-sm text-muted-foreground">
                                  {new Date(semester.semesterStart).toLocaleDateString('pt-BR')} - {new Date(semester.semesterEnd).toLocaleDateString('pt-BR')}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteSemesterHistory(semester.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">
                                  {semester.subjectsData?.length || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Matérias</div>
                              </div>
                              <div className="text-center p-3 bg-red-50 rounded-lg">
                                <div className="text-lg font-bold text-red-600">
                                  {semester.absencesData?.length || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Faltas</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">
                                  {semester.notesData?.length || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Notas</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Configurações */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Perfil
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <ProfileSettings onClose={() => setShowSettings(false)} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModernAcademicProfile;