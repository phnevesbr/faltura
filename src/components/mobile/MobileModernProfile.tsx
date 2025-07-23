import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Calendar, 
  GraduationCap, 
  Edit, 
  Save, 
  X, 
  History, 
  Plus, 
  Trophy, 
  Star,
  Zap,
  Crown,
  Settings,
  User,
  Award,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Target,
  Flame,
  Palette
} from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNotifications } from '../../hooks/useNotifications';
import AvatarUpload from '../AvatarUpload';
import ThemeSelector from '../profile/ThemeSelector';
import ProfileSettings from '../profile/ProfileSettings';
import ProfileSettingsMobile from '../profile/ProfileSettingsMobile';
import CompactGamificationProfile from '../profile/CompactGamificationProfile';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const MobileModernProfile: React.FC = () => {
  const { user } = useAuth();
  const { profile, semesterHistory, updateProfile, getDaysUntilSemesterEnd, archiveSemester, startNewSemester } = useProfile();
  const { userLevel, userBadges, getTierInfo, getWeeklyBadges, getMonthlyBadges, awardProfileUpdateXP, awardNewSemesterXP } = useGamification();
  const { trackThemeChange } = useAchievements();
  const { applyTheme, getCurrentTheme } = useThemeColors();
  const { shouldShowNotification } = useNotifications();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewSemester, setShowNewSemester] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [newSemesterData, setNewSemesterData] = useState({ semesterStart: '', semesterEnd: '' });
  
  const [formData, setFormData] = useState({
    course: profile?.course || '',
    university: profile?.university || '',
    shift: profile?.shift || 'morning',
    semesterStart: profile?.semesterStart || '',
    semesterEnd: profile?.semesterEnd || ''
  });

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

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
  }, [getCurrentTheme]);

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

  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);
    applyTheme(themeName);
    trackThemeChange();
  };

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

  const shiftLabels = {
    morning: 'Matutino',
    afternoon: 'Vespertino',
    night: 'Noturno'
  };

  const daysUntilEnd = getDaysUntilSemesterEnd();
  const isSemesterEnded = daysUntilEnd === 0 && profile?.semesterEnd && new Date() >= new Date(profile.semesterEnd);
  
  const tierInfo = userLevel ? getTierInfo(userLevel.current_tier) : getTierInfo('calouro');

  // Recompensas desbloqueadas por nível
  const getUnlockedRewards = () => {
    if (!userLevel) return [];
    
    const rewards = [];
    const level = userLevel.level;
    
    // Temas desbloqueados
    if (level >= 5) rewards.push({ type: 'theme', name: 'oceano', icon: '🌊' });
    if (level >= 10) rewards.push({ type: 'theme', name: 'floresta', icon: '🌲' });
    if (level >= 15) rewards.push({ type: 'theme', name: 'sunset', icon: '🌅' });
    if (level >= 25) rewards.push({ type: 'theme', name: 'cristal', icon: '💎' });
    if (level >= 30) rewards.push({ type: 'theme', name: 'neon', icon: '⚡' });
    if (level >= 40) rewards.push({ type: 'theme', name: 'vulcao', icon: '🌋' });
    if (level >= 50) rewards.push({ type: 'theme', name: 'lendario', icon: '👑' });
    
    return rewards;
  };

  const getNextReward = () => {
    if (!userLevel) return null;
    
    const allRewards = [
      { level: 5, type: 'theme', name: 'oceano', icon: '🌊' },
      { level: 10, type: 'theme', name: 'floresta', icon: '🌲' },
      { level: 15, type: 'theme', name: 'sunset', icon: '🌅' },
      { level: 25, type: 'theme', name: 'cristal', icon: '💎' },
      { level: 30, type: 'theme', name: 'neon', icon: '⚡' },
      { level: 40, type: 'theme', name: 'vulcao', icon: '🌋' },
      { level: 50, type: 'theme', name: 'lendario', icon: '👑' },
    ];
    
    return allRewards.find(reward => reward.level > userLevel.level);
  };

  const nextReward = getNextReward();
  const unlockedRewards = getUnlockedRewards();

  return (
    <div className="space-y-4 pb-6 relative">
      {/* Header integrado - Perfil + Gamificação */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 relative z-10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative z-20">
                <AvatarUpload size="lg" />
                {userLevel && (
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-background z-30",
                    tierInfo.color
                  )}>
                    {userLevel.level}
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante'}</CardTitle>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {userLevel && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <span className="mr-1">{tierInfo.emoji}</span>
                      {tierInfo.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* XP e Progresso */}
          {userLevel && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Experiência</div>
                <div className="text-lg font-bold text-primary">
                  {userLevel.experience_points.toLocaleString()} XP
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Nível {userLevel.level}</span>
                  <span>{userLevel.level_progress.toFixed(1)}%</span>
                </div>
                <Progress value={userLevel.level_progress} className="h-3" />
              </div>

              {/* Próxima recompensa */}
              {nextReward && (
                <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg">{nextReward.icon}</div>
                    <div>
                       <div className="font-semibold text-sm text-xp-text">
                        Próxima recompensa
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tema {nextReward.name} - Nível {nextReward.level}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Actions Quick */}
      <div className="grid grid-cols-2 gap-3 relative z-30">
        {!isEditing ? (
          <>
            <Button onClick={() => setIsEditing(true)} variant="outline" className="h-12 relative z-40">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
            <Button onClick={() => setShowSettings(true)} variant="outline" className="h-12 relative z-40">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSave} className="h-12 relative z-40">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={handleCancel} variant="outline" className="h-12 relative z-40">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </>
        )}
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 relative z-20">
        <TabsList className="grid w-full grid-cols-3 h-11 relative z-30">
          <TabsTrigger value="overview" className="text-xs relative z-30">
            <User className="h-3 w-3 mr-1" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="gamification" className="text-xs relative z-30">
            <Palette className="h-3 w-3 mr-1" />
            Temas
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs relative z-30">
            <History className="h-3 w-3 mr-1" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab Overview - Informações Acadêmicas + Stats */}
        <TabsContent value="overview" className="space-y-4">
          {/* Informações Acadêmicas */}
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
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
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
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
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
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {shiftLabels[profile?.shift || 'morning']}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Semestre */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Semestre Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
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
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">Período</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.semesterStart ? new Date(profile.semesterStart).toLocaleDateString('pt-BR') : 'Não informado'} - {profile?.semesterEnd ? new Date(profile.semesterEnd).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                  
                  {daysUntilEnd > 0 ? (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-3 rounded-lg border border-green-500/20">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          {daysUntilEnd} dias restantes no semestre
                        </p>
                      </div>
                    </div>
                  ) : isSemesterEnded ? (
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-3 rounded-lg border border-orange-500/20">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
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
                </div>
              )}
              
              {/* Botão Iniciar Novo Semestre */}
              {!showNewSemester && !isSemesterEnded && (
                <div className="mt-4">
                  <Button 
                    onClick={() => setShowNewSemester(true)} 
                    variant="outline" 
                    className="w-full h-12 border-dashed border-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Iniciar Novo Semestre
                  </Button>
                </div>
              )}
              
              {/* Formulário Novo Semestre */}
              {showNewSemester && (
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Novo Semestre</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewSemester(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Data de Início</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterStart}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterStart: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Data de Fim</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterEnd}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterEnd: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleStartNewSemester} 
                      className="w-full"
                      size="sm"
                    >
                      Confirmar Novo Semestre
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/20">
                  <p className="text-2xl font-bold text-blue-600">
                    {profile?.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Dias no app</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
                  <p className="text-2xl font-bold text-green-600">
                    {daysUntilEnd > 0 ? daysUntilEnd : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Dias restantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Tab Gamificação - Apenas Temas */}
        <TabsContent value="gamification">
          <ThemeSelector />
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <History className="h-5 w-5 mr-2" />
                Histórico de Semestres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {semesterHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">Nenhum histórico ainda</p>
                  <p className="text-xs">Os semestres arquivados aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {semesterHistory.map((semester) => (
                    <div key={semester.id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="mb-3">
                        <h4 className="font-medium text-sm">{semester.course}</h4>
                        <p className="text-xs text-muted-foreground">{semester.university}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(semester.semesterStart).toLocaleDateString('pt-BR')} - {new Date(semester.semesterEnd).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <p className="text-lg font-bold text-blue-600">
                            {semester.subjectsData?.length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Matérias</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                          <p className="text-lg font-bold text-red-600">
                            {semester.absencesData?.length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Faltas</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <p className="text-lg font-bold text-green-600">
                            {semester.notesData?.length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Tarefas</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                          <p className="text-lg font-bold text-xp-text">
                            {semester.achievementsData?.length || 0}
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
        </TabsContent>
      </Tabs>

      {/* Modal de Configurações */}
      <ProfileSettingsMobile isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default MobileModernProfile;