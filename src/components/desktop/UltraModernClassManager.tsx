import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ImageModal } from '@/components/ui/image-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClass } from '@/contexts/ClassContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSystemLimits } from '@/hooks/useSystemLimits';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, 
  Users, 
  Plus, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Image, 
  Trash2, 
  X, 
  Upload,
  ArrowLeft,
  Settings,
  UserPlus, 
  UserMinus,
  Bell,
  Send,
  FileText,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Target,
  Zap,
  Activity,
  Shield,
  Sparkles,
  Rocket,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { NotificationTypeModal } from '@/components/mobile/NotificationTypeModal';
import { ptBR } from 'date-fns/locale';

const UltraModernClassManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkClassLeadershipLimit, checkClassMembershipLimit } = useSystemLimits();
  const { 
    classes, 
    currentClass, 
    classMembers, 
    invites, 
    absenceNotifications,
    classAlerts,
    createClass, 
    inviteToClass, 
    acceptInvite, 
    declineInvite,
    leaveClass,
    deleteClass,
    createAbsenceNotification,
    sendContent,
    setCurrentClass,
    fetchClassData,
    fetchAbsenceNotifications,
    fetchClassAlerts,
    clearOldNotifications
  } = useClass();

  const [newClassName, setNewClassName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showClassSettings, setShowClassSettings] = useState(false);
  const [classNameEdit, setClassNameEdit] = useState('');
  const [absenceDate, setAbsenceDate] = useState('');
  const [absenceSubjects, setAbsenceSubjects] = useState('');
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [contentText, setContentText] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; index: number; photos: string[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Update classNameEdit when currentClass changes
  React.useEffect(() => {
    if (currentClass && currentClass.name !== classNameEdit) {
      setClassNameEdit(currentClass.name);
    }
  }, [currentClass]);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    
    if (user) {
      const limitCheck = await checkClassLeadershipLimit(user.id);
      if (!limitCheck.canAdd) {
        toast({
          title: "Limite de liderança excedido!",
          description: `Você já lidera ${limitCheck.currentCount} turmas. Limite máximo: ${limitCheck.limit}`,
          variant: "destructive"
        });
        return;
      }
    }
    
    await createClass(newClassName);
    setNewClassName('');
    setShowCreateClass(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentClass) return;
    
    if (user) {
      const limitCheck = await checkClassMembershipLimit(user.id);
      if (!limitCheck.canAdd) {
        toast({
          title: "Limite de membros excedido!",
          description: `Esta turma já tem ${limitCheck.currentCount} membros. Limite máximo: ${limitCheck.limit}`,
          variant: "destructive"
        });
        return;
      }
    }
    
    await inviteToClass(currentClass.id, inviteEmail);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const handleCreateAbsenceNotification = async () => {
    if (!currentClass || !absenceDate.trim() || !absenceSubjects.trim()) return;
    
    await createAbsenceNotification(currentClass.id, absenceDate, [absenceSubjects]);
    setAbsenceDate('');
    setAbsenceSubjects('');
    setShowAbsenceModal(false);
  };

  const handleUpdateClassName = async () => {
    if (!currentClass || !classNameEdit.trim()) return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .update({ name: classNameEdit.trim() })
        .eq('id', currentClass.id);

      if (error) throw error;

      // Update current class state
      const updatedClass = { ...currentClass, name: classNameEdit.trim() };
      setCurrentClass(updatedClass);

      // Refresh class data to update the UI
      await fetchClassData(currentClass.id);

      toast({
        title: "Turma atualizada",
        description: "O nome da turma foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar turma",
        description: error.message || "Ocorreu um erro ao atualizar o nome da turma.",
        variant: "destructive",
      });
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentClass) return;
    
    try {
      // Limpar notificações de ausência
      const { error: absenceError } = await supabase.rpc('clear_all_absence_notifications', {
        class_id_param: currentClass.id
      });

      if (absenceError) throw absenceError;

      // Limpar alertas de classe
      const { error: alertsError } = await supabase
        .from('class_alerts')
        .delete()
        .eq('class_id', currentClass.id);

      if (alertsError) throw alertsError;

      toast({
        title: "Notificações removidas",
        description: "Todas as notificações e alertas foram removidos com sucesso!",
      });

      // Refresh both notifications and alerts
      fetchAbsenceNotifications(currentClass.id);
      fetchClassAlerts(currentClass.id);
    } catch (error: any) {
      toast({
        title: "Erro ao limpar notificações",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const handleSendContent = async () => {
    if (!currentClass || !selectedNotification || (!contentText.trim() && selectedFiles.length === 0)) return;
    
    try {
      setIsUploading(true);
      
      await sendContent(selectedNotification, contentText, selectedFiles);
      setContentText('');
      setSelectedFiles([]);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Error sending content:', error);
      toast({
        title: "Erro ao enviar conteúdo",
        description: "Ocorreu um erro ao enviar o conteúdo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isLeader = (classItem: any) => {
    return classItem && user && classItem.leader_id === user.id;
  };

  // Statistics
  const totalClasses = classes.length;
  const leadershipCount = classes.filter(c => isLeader(c)).length;
  const membershipCount = totalClasses - leadershipCount;
  const pendingInvites = invites.length;
  const totalNotifications = absenceNotifications.length + classAlerts.length;
  const pendingNotifications = absenceNotifications.filter(n => !n.content_sent).length;

  // Show class overview if no class is selected
  if (!currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
        <div className="container mx-auto p-8 space-y-10">
          {/* Ultra Modern Hero Header */}
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-10 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            
            {/* Floating Orbs */}
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-500/30 blur-2xl"></div>
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-500/20 blur-3xl"></div>
            <div className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-5xl font-black tracking-tight">
                        Gestão de <span className="text-white/80">Turmas</span>
                      </h1>
                      <p className="text-emerald-100 text-xl font-medium">
                        Conecte-se com sua comunidade acadêmica
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                      <Users className="h-5 w-5 text-blue-300" />
                      <span className="text-sm font-semibold">{totalClasses} turmas totais</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                      <Crown className="h-5 w-5 text-yellow-300" />
                      <span className="text-sm font-semibold">{leadershipCount} liderando</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                      <Mail className="h-5 w-5 text-green-300" />
                      <span className="text-sm font-semibold">{pendingInvites} convites</span>
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
                    onClick={() => setShowCreateClass(true)}
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

          {/* Classes Grid */}
          {classes.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes
                    .filter(classItem => 
                      searchQuery.trim() === '' || 
                      classItem.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((classItem) => (
                    <Card 
                      key={classItem.id} 
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-emerald-200 dark:hover:border-emerald-800 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
                      onClick={() => setCurrentClass(classItem)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg group-hover:text-emerald-600 transition-colors">
                                {classItem.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Criada em {format(new Date(classItem.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                            {isLeader(classItem) && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                <Crown className="h-3 w-3 mr-1" />
                                Líder
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Membros: {classItem.member_count || 0}
                              </span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {classes.length === 0 && (
            <Card className="border-dashed border-2 border-muted-foreground/25 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma turma encontrada</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Você ainda não tem nenhuma turma. Crie uma nova turma ou aguarde ser convidado para uma.
                </p>
                <Button 
                  onClick={() => setShowCreateClass(true)} 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeira Turma
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pending Invites */}
          {invites.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-sky-50/50 dark:from-blue-950/20 dark:to-sky-950/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Mail className="h-5 w-5" />
                  Convites Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-sky-500/20 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Convite para turma</p>
                          <p className="text-sm text-muted-foreground">
                            De: {invite.invitee_email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => acceptInvite(invite.id)} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => declineInvite(invite.id)}>
                          <X className="h-4 w-4 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Class Dialog */}
        <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="className">Nome da Turma</Label>
                <Input
                  id="className"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Digite o nome da turma"
                  className="mt-2"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateClass()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateClass} className="flex-1" disabled={!newClassName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Turma
                </Button>
                <Button variant="outline" onClick={() => setShowCreateClass(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show class details when a class is selected
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      <div className="container mx-auto p-8 space-y-10">
        {/* Ultra Modern Class Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-10 text-white shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          
          {/* Floating Orbs */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-500/30 blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentClass(null)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        {currentClass.name}
                        {isLeader(currentClass) && (
                          <Badge className="bg-yellow-500/20 text-yellow-100 border border-yellow-400/30">
                            <Crown className="h-4 w-4 mr-1" />
                            Líder
                          </Badge>
                        )}
                      </h1>
                      <p className="text-emerald-100 text-lg font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {classMembers.length}/{currentClass.max_members} membros
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Bell className="h-5 w-5 text-blue-300" />
                    <span className="text-sm font-semibold">{totalNotifications} notificações</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <AlertCircle className="h-5 w-5 text-orange-300" />
                    <span className="text-sm font-semibold">{pendingNotifications} pendentes</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Calendar className="h-5 w-5 text-green-300" />
                    <span className="text-sm font-semibold">Criada em {format(new Date(currentClass.created_at), 'dd/MM', { locale: ptBR })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isLeader(currentClass) && (
                  <>
                    <Button
                      onClick={() => setShowInviteModal(true)}
                      className="h-12 bg-white text-emerald-600 hover:bg-white/90 shadow-xl gap-3 font-bold rounded-2xl px-6"
                    >
                      <UserPlus className="h-5 w-5" />
                      Convidar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setClassNameEdit(currentClass.name);
                        setShowClassSettings(true);
                      }}
                      className="h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/40 rounded-2xl"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <TabsList className="w-full h-16 bg-transparent p-0 space-x-0">
                <TabsTrigger 
                  value="overview" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-600 dark:text-gray-400 font-semibold text-base transition-all duration-300"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Membros
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-600 dark:text-gray-400 font-semibold text-base transition-all duration-300"
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Notificações ({totalNotifications})
                </TabsTrigger>
                {isLeader(currentClass) && (
                  <TabsTrigger 
                    value="manage" 
                    className="flex-1 h-full rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-600 dark:text-gray-400 font-semibold text-base transition-all duration-300"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Gerenciar
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-8 space-y-8">
              {/* Members Header */}
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Membros da Turma</h2>
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {classMembers.length} membro{classMembers.length !== 1 ? 's' : ''} ativo{classMembers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Members List */}
              <div className="grid gap-4">
                {classMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg">
                              {(member.profiles?.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{member.profiles?.email || 'Email não disponível'}</h3>
                            <p className="text-sm text-muted-foreground">
                              Membro desde {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.user_id === currentClass.leader_id && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Líder
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                          {isLeader(currentClass) && member.user_id !== currentClass.leader_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('class_members')
                                    .delete()
                                    .eq('class_id', currentClass.id)
                                    .eq('user_id', member.user_id);

                                  if (error) throw error;

                                  toast({
                                    title: "Membro removido",
                                    description: "Membro removido da turma com sucesso!",
                                  });

                                  // Refresh class data
                                  if (currentClass) {
                                    fetchClassData(currentClass.id);
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Erro ao remover membro",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {classMembers.length === 0 && (
                <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhum membro encontrado</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Esta turma ainda não possui membros. Convide pessoas para participar.
                    </p>
                    {isLeader(currentClass) && (
                      <Button onClick={() => setShowInviteModal(true)} size="lg">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Convidar Primeiro Membro
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notifications" className="p-8 space-y-8">
              {/* Notifications Header */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg">
                        <Bell className="h-8 w-8 text-white" />
                      </div>
                       <div>
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notificações da Turma</h2>
                         <p className="text-blue-600 dark:text-blue-400 font-medium">
                           {absenceNotifications.length + classAlerts.length} notificação{(absenceNotifications.length + classAlerts.length) !== 1 ? 'ões' : ''} total{(absenceNotifications.length + classAlerts.length) !== 1 ? 'is' : ''}
                         </p>
                       </div>
                    </div>
                    {isLeader(currentClass) && (
                      <div className="flex gap-2">
                        <Button onClick={() => setShowNotificationModal(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Notificação
                        </Button>
                        {(absenceNotifications.length > 0 || classAlerts.length > 0) && (
                          <Button 
                            variant="outline" 
                            onClick={handleClearAllNotifications}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Limpar Todas
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications List */}
              <div className="space-y-4">
                {/* Class Alerts */}
                {classAlerts.map((alert) => (
                  <Card key={`alert-${alert.id}`} className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-lg">{alert.title}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              alert.priority === 'high' ? 'bg-red-100 text-red-700' :
                              alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {alert.priority === 'high' ? '🔴 Alta' : alert.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300">{alert.message}</p>
                          <p className="text-sm text-gray-500">
                            Por: {alert.user_id === user?.id ? 'Você' : (alert.profiles?.email?.split('@')[0] || 'Usuário')} • 
                            {format(new Date(alert.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Absence Notifications */}
                {absenceNotifications.map((notification) => (
                  <Card key={notification.id} className={`${!notification.content_sent ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold text-lg">
                                Falta em {format(new Date(notification.absence_date), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              {!notification.content_sent && (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                              {notification.content_sent && (
                                <Badge className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Enviado
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground">
                              <strong>Matérias:</strong> {notification.subjects}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Criada em {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        {!notification.content_sent && isLeader(currentClass) && (
                          <div className="border-t pt-4 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`content-${notification.id}`}>Conteúdo da Aula</Label>
                              <Textarea
                                id={`content-${notification.id}`}
                                placeholder="Digite o conteúdo que foi abordado na aula..."
                                value={selectedNotification === notification.id ? contentText : ''}
                                onChange={(e) => {
                                  setSelectedNotification(notification.id);
                                  setContentText(e.target.value);
                                }}
                                className="min-h-24"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Anexos (opcional)</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  multiple
                                  onChange={handleFileSelect}
                                  className="hidden"
                                  id={`file-${notification.id}`}
                                  accept="image/*,application/pdf,.doc,.docx"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() => document.getElementById(`file-${notification.id}`)?.click()}
                                  className="w-fit"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Anexar Arquivos
                                </Button>
                              </div>

                              {selectedFiles.length > 0 && selectedNotification === notification.id && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Arquivos selecionados:</p>
                                  <div className="space-y-1">
                                    {selectedFiles.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                        <span className="text-sm truncate">{file.name}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeFile(index)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={handleSendContent}
                              disabled={selectedNotification !== notification.id || (!contentText.trim() && selectedFiles.length === 0) || isUploading}
                              className="w-full"
                            >
                              {isUploading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar Conteúdo
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {notification.content_sent && notification.content_text && (
                          <div className="border-t pt-4 space-y-2">
                            <h4 className="font-semibold text-green-600">Conteúdo Enviado:</h4>
                            <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                              {notification.content_text}
                            </p>
                            {notification.content_photos && notification.content_photos.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">Anexos:</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {notification.content_photos.map((url, index) => (
                                    <div key={index} className="relative">
                                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img
                                          src={url}
                                          alt={`Anexo ${index + 1}`}
                                          className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => setSelectedImage({ url, index, photos: notification.content_photos! })}
                                        />
                                      ) : (
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-center w-full h-20 bg-muted rounded hover:bg-muted/80 transition-colors"
                                        >
                                          <FileText className="h-8 w-8 text-muted-foreground" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {absenceNotifications.length === 0 && (
                <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                      <Bell className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma notificação encontrada</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Ainda não há notificações de falta para esta turma.
                    </p>
                    {isLeader(currentClass) && (
                      <Button onClick={() => setShowAbsenceModal(true)} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Criar Primeira Notificação
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {isLeader(currentClass) && (
              <TabsContent value="manage" className="p-8 space-y-8">
                {/* Management Header */}
                <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-red-200 dark:border-red-800">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Turma</h2>
                        <p className="text-red-600 dark:text-red-400 font-medium">Configurações administrativas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Management Actions */}
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configurações da Turma
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="classNameEdit">Nome da Turma</Label>
                        <Input
                          id="classNameEdit"
                          value={classNameEdit}
                          onChange={(e) => setClassNameEdit(e.target.value)}
                          placeholder="Nome da turma"
                          className="mt-2"
                        />
                      </div>
                      <Button 
                        onClick={handleUpdateClassName}
                        className="w-full"
                        disabled={!classNameEdit.trim() || classNameEdit === currentClass.name}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        Zona de Perigo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        As ações abaixo são permanentes e não podem ser desfeitas. Prossiga com cuidado.
                      </p>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja sair desta turma? Esta ação não pode ser desfeita.')) {
                              leaveClass(currentClass.id);
                              setCurrentClass(null);
                            }
                          }}
                          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Sair da Turma
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita e todos os dados serão perdidos.')) {
                              deleteClass(currentClass.id);
                              setCurrentClass(null);
                            }
                          }}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Turma Permanentemente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="inviteEmail">E-mail do usuário</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Digite o e-mail do usuário"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInvite} className="flex-1" disabled={!inviteEmail.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Convite
              </Button>
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAbsenceModal} onOpenChange={setShowAbsenceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Notificação de Falta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="absenceDate">Data da Falta</Label>
              <Input
                id="absenceDate"
                type="date"
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="absenceSubjects">Matérias</Label>
              <Input
                id="absenceSubjects"
                value={absenceSubjects}
                onChange={(e) => setAbsenceSubjects(e.target.value)}
                placeholder="Ex: Matemática, Português, História"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateAbsenceNotification} 
                className="flex-1"
                disabled={!absenceDate.trim() || !absenceSubjects.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Notificação
              </Button>
              <Button variant="outline" onClick={() => setShowAbsenceModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showClassSettings} onOpenChange={setShowClassSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações da Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="classNameEditDialog">Nome da Turma</Label>
                <Input
                  id="classNameEditDialog"
                  value={classNameEdit}
                  onChange={(e) => setClassNameEdit(e.target.value)}
                  placeholder="Nome da turma"
                  className="mt-2"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              <Button 
                onClick={async () => {
                  await handleUpdateClassName();
                  setShowClassSettings(false);
                }}
                className="flex-1"
                disabled={!classNameEdit.trim() || classNameEdit === currentClass.name}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setShowClassSettings(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          imageIndex={selectedImage.index}
          totalImages={selectedImage.photos.length}
        />
      )}

      {/* Notification Type Modal */}
      <NotificationTypeModal
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
      />
    </div>
  );
};

export default UltraModernClassManager;