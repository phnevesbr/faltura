import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Save, 
  X, 
  User, 
  Trophy, 
  History, 
  Settings, 
  GraduationCap,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'sonner';

// Componentes modernos
import DesktopProfileHeader from './DesktopProfileHeader';
import DesktopAcademicSection from './DesktopAcademicSection';
import DesktopSemesterSection from './DesktopSemesterSection';
import DesktopGamificationSection from './DesktopGamificationSection';
import DesktopHistorySection from './DesktopHistorySection';
import ProfileSettings from './ProfileSettings';

const DesktopModernProfile: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const { awardProfileUpdateXP } = useGamification();
  const { shouldShowNotification } = useNotifications();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
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
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      if (shouldShowNotification('profile')) {
        toast.success('👤 Perfil atualizado com sucesso!', {
          description: 'Suas informações foram salvas.'
        });
      }
      // Dar XP por atualizar perfil APENAS se a atualização foi bem-sucedida
      await awardProfileUpdateXP();
    } catch (error) {
      toast.error('Erro ao atualizar perfil', {
        description: 'Tente novamente em alguns instantes.'
      });
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
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
    setIsEditing(!isEditing);
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6 relative">
      {/* Header do Perfil */}
      <div className="relative z-10">
        <DesktopProfileHeader
          profile={profile}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSettingsClick={() => setShowSettings(true)}
        />
      </div>

      {/* Barra de status quando editando */}
      {isEditing && (
        <div className="relative z-20">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Modo de edição ativo</div>
                    <div className="text-sm text-muted-foreground">
                      Faça as alterações necessárias e clique em salvar
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSave} 
                    size="lg" 
                    className="gap-2 relative z-30"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button 
                    onClick={handleCancel} 
                    variant="outline" 
                    size="lg" 
                    className="gap-2 relative z-30"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principais */}
      <div className="relative z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/50 rounded-xl p-1 relative z-30">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md relative z-30">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md relative z-30">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Acadêmico</span>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md relative z-30">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Gamificação</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md relative z-30">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 relative z-20">
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <DesktopAcademicSection
                isEditing={isEditing}
                formData={formData}
                profile={profile}
                onFormDataChange={setFormData}
              />
              <DesktopSemesterSection
                isEditing={isEditing}
                formData={formData}
                onFormDataChange={setFormData}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-8 relative z-20">
          <div>
            <DesktopAcademicSection
              isEditing={isEditing}
              formData={formData}
              profile={profile}
              onFormDataChange={setFormData}
            />
          </div>
        </TabsContent>

        <TabsContent value="gamification" className="relative z-20">
          <div>
            <DesktopGamificationSection />
          </div>
        </TabsContent>

        <TabsContent value="history" className="relative z-20">
          <div>
            <DesktopHistorySection />
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Configurações */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              Configurações do Perfil
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <ProfileSettings onClose={() => setShowSettings(false)} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopModernProfile;