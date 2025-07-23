import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ImageModal } from '@/components/ui/image-modal';
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
  Bell,
  Send,
  FileText,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ModernClassManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkClassLeadershipLimit, checkClassMembershipLimit } = useSystemLimits();
  const { 
    classes, 
    currentClass, 
    classMembers, 
    invites, 
    absenceNotifications,
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
  const [contentText, setContentText] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; index: number; photos: string[] } | null>(null);

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
    await inviteToClass(currentClass.id, inviteEmail);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const handleCreateAbsence = async () => {
    if (!absenceDate || !absenceSubjects.trim() || !currentClass) return;
    const subjects = absenceSubjects.split(',').map(s => s.trim()).filter(s => s);
    await createAbsenceNotification(currentClass.id, absenceDate, subjects);
    setAbsenceDate('');
    setAbsenceSubjects('');
    setShowAbsenceModal(false);
  };

  const handleSendContent = async (notificationId: string) => {
    if (!contentText.trim()) return;
    
    setIsUploading(true);
    try {
      await sendContent(notificationId, contentText, selectedFiles);
      setContentText('');
      setSelectedFiles([]);
      setSelectedNotification(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllNotifications = async () => {
    if (!currentClass) return;
    
    try {
      const { data, error } = await supabase.rpc('clear_all_absence_notifications', {
        class_id_param: currentClass.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${data} notificações foram removidas.`,
      });
      
      fetchAbsenceNotifications(currentClass.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao limpar notificações",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentClass) return;
    
    try {
      const { error } = await supabase
        .from('absence_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Notificação removida",
        description: "A notificação foi removida com sucesso.",
      });

      await fetchAbsenceNotifications(currentClass.id);
    } catch (error: any) {
      toast({
        title: "Erro ao remover notificação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectClass = async (classData: any) => {
    setCurrentClass(classData);
    await fetchClassData(classData.id);
    await fetchAbsenceNotifications(classData.id);
  };

  const isLeader = (classData: any) => user?.id === classData.leader_id;

  const handleUpdateClass = async () => {
    if (!currentClass || !classNameEdit.trim()) return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: classNameEdit.trim()
        })
        .eq('id', currentClass.id);

      if (error) throw error;

      toast({
        title: "Turma atualizada",
        description: "O nome da turma foi atualizado com sucesso.",
      });

      // Atualizar dados locais
      setCurrentClass({
        ...currentClass,
        name: classNameEdit.trim()
      });
      
      setShowClassSettings(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar turma",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async () => {
    if (!currentClass) return;
    
    try {
      await deleteClass(currentClass.id);
      setCurrentClass(null);
      setShowClassSettings(false);
      
      toast({
        title: "Turma removida",
        description: "A turma foi removida com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover turma",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Header */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background animate-pulse"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gerenciador de Turmas
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Crie e gerencie suas turmas acadêmicas, colabore com colegas e compartilhe conteúdo
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Turmas Ativas</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{classes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Convites Pendentes</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{invites.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Turmas Lideradas</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {classes.filter(c => isLeader(c)).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create New Class */}
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-primary mb-2">Criar Nova Turma</h3>
                  <p className="text-muted-foreground">
                    Comece criando uma nova turma para colaborar com seus colegas
                  </p>
                </div>
                <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Nova Turma
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl text-center">Criar Nova Turma</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="className" className="text-sm font-medium">Nome da Turma</Label>
                        <Input
                          id="className"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Ex: Matemática Avançada 2024"
                          className="h-12"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleCreateClass} className="flex-1 h-12">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Turma
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateClass(false)} className="h-12">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Classes Grid */}
          {classes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Users className="h-6 w-6" />
                  Minhas Turmas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((classItem) => (
                    <Card 
                      key={classItem.id} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                      onClick={() => selectClass(classItem)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
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
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {classes.length === 0 && (
            <Card className="border-dashed border-2 border-muted-foreground/25">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma turma encontrada</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Você ainda não tem nenhuma turma. Crie uma nova turma ou aguarde ser convidado para uma.
                </p>
                <Button onClick={() => setShowCreateClass(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeira Turma
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pending Invites */}
          {invites.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Mail className="h-5 w-5" />
                  Convites Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Class Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentClass(null)}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-primary">{currentClass.name}</h1>
                    {isLeader(currentClass) && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        <Crown className="h-4 w-4 mr-1" />
                        Líder
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4" />
                    {classMembers.length}/{currentClass.max_members} membros
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isLeader(currentClass) && (
                  <>
                    <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Convidar
                        </Button>
                      </DialogTrigger>
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
                            <Button onClick={handleInvite} className="flex-1">
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
                    <Dialog open={showClassSettings} onOpenChange={setShowClassSettings}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setClassNameEdit(currentClass.name);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Configurações da Turma</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-4">
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
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                            <Button 
                              onClick={handleUpdateClass} 
                              className="w-full"
                              disabled={!classNameEdit.trim()}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Salvar Alterações
                            </Button>
                            
                            <Button 
                              onClick={handleDeleteClass}
                              variant="destructive"
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Turma
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Management Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1">
            <TabsTrigger value="members" className="flex items-center gap-2 p-3">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 p-3">
              <Bell className="h-4 w-4" />
              Notificações
              {absenceNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {absenceNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 p-3">
              <FileText className="h-4 w-4" />
              Conteúdo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Membros da Turma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {(member.profiles?.email?.charAt(0) || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.profiles?.email?.split('@')[0] || `Usuário ${member.user_id.slice(0, 8)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </p>
                          {member.user_id === currentClass.leader_id && (
                            <Badge variant="secondary" className="mt-1">
                              <Crown className="h-3 w-3 mr-1" />
                              Líder
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Entrou em {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        {member.user_id === user?.id && !isLeader(currentClass) && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => leaveClass(currentClass.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Sair da Turma
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notificações de Falta</CardTitle>
                {isLeader(currentClass) && absenceNotifications.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAllNotifications}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {absenceNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
                    <p className="text-muted-foreground">
                      Não há notificações de falta registradas para esta turma.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {absenceNotifications.map((notification) => (
                      <Card key={notification.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle className="h-5 w-5 text-orange-500" />
                                  <p className="font-medium text-lg">
                                    {notification.user_id === user?.id 
                                      ? 'Você faltou' 
                                      : `${notification.profiles?.email?.split('@')[0] || 'Usuário'} faltou`
                                    }
                                  </p>
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {format(new Date(notification.absence_date), 'dd/MM/yyyy', { locale: ptBR })}
                                    </span>
                                  </div>
                                  {notification.subjects.length > 0 && (
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-4 w-4 mt-0.5" />
                                      <span>
                                        Matérias: {notification.subjects.join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!notification.content_sent && notification.user_id !== user?.id && (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedNotification(notification.id)}
                                    disabled={selectedNotification === notification.id}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Enviar Conteúdo
                                  </Button>
                                )}
                                {isLeader(currentClass) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {notification.content_sent && (
                              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <p className="font-medium text-green-800 dark:text-green-200">Conteúdo enviado</p>
                                </div>
                                <p className="text-green-700 dark:text-green-300">{notification.content_text}</p>
                                {notification.content_photos && notification.content_photos.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm text-green-600 dark:text-green-400 mb-2">Arquivos anexados:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {notification.content_photos.map((photo, index) => (
                                        <img
                                          key={index}
                                          src={photo}
                                          alt={`Anexo ${index + 1}`}
                                          className="w-20 h-20 object-cover rounded-lg border"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {selectedNotification === notification.id && (
                              <div className="border-t pt-4 space-y-4">
                                <div>
                                  <Label htmlFor="contentText">Conteúdo da aula</Label>
                                  <Textarea
                                    id="contentText"
                                    value={contentText}
                                    onChange={(e) => setContentText(e.target.value)}
                                    placeholder="Descreva o conteúdo da aula que foi perdida..."
                                    className="mt-2"
                                    rows={4}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="fileUpload">Anexar imagens (opcional)</Label>
                                  <Input
                                    id="fileUpload"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="mt-2"
                                  />
                                  {selectedFiles.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      <p className="text-sm text-muted-foreground">
                                        {selectedFiles.length} arquivo(s) selecionado(s):
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedFiles.map((file, index) => (
                                          <div key={index} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                                            <span className="text-sm">{file.name}</span>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => removeFile(index)}
                                              className="h-6 w-6 p-0"
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleSendContent(notification.id)}
                                    disabled={isUploading || !contentText.trim()}
                                    className="flex-1"
                                  >
                                    {isUploading ? (
                                      <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Enviando...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar Conteúdo
                                      </>
                                    )}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedNotification(null);
                                      setContentText('');
                                      setSelectedFiles([]);
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conteúdos da Turma
                </CardTitle>
              </CardHeader>
              <CardContent>
                {absenceNotifications.filter(n => n.content_sent).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum conteúdo compartilhado</h3>
                    <p className="text-muted-foreground">
                      Os conteúdos enviados nas notificações de falta aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {absenceNotifications
                      .filter(n => n.content_sent)
                      .sort((a, b) => new Date(b.content_sent_at || '').getTime() - new Date(a.content_sent_at || '').getTime())
                      .map((notification) => {
                        const senderProfile = classMembers.find(m => m.user_id === notification.content_sender_id)?.profiles;
                        
                        return (
                          <Card key={notification.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                {/* Header com info da falta */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-lg">
                                      Conteúdo de {format(new Date(notification.absence_date), 'dd/MM/yyyy', { locale: ptBR })}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      Matérias: {notification.subjects.join(', ')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      Enviado por: {senderProfile?.email?.split('@')[0] || 'Usuário'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(notification.content_sent_at || ''), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>

                                <Separator />

                                {/* Conteúdo */}
                                <div className="space-y-4">
                                  {notification.content_text && (
                                    <div>
                                      <h5 className="font-medium mb-2">Descrição do conteúdo:</h5>
                                      <div className="bg-muted/30 rounded-lg p-4">
                                        <p className="text-foreground whitespace-pre-wrap">{notification.content_text}</p>
                                      </div>
                                    </div>
                                  )}

                                   {notification.content_photos && notification.content_photos.length > 0 && (
                                     <div>
                                       <h5 className="font-medium mb-3">Imagens anexadas ({notification.content_photos.length}):</h5>
                                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                         {notification.content_photos.map((photo, index) => (
                                           <div key={index} className="group relative">
                                             <img
                                               src={photo}
                                               alt={`Conteúdo ${index + 1}`}
                                               className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-md hover:shadow-lg"
                                               onClick={() => setSelectedImage({ url: photo, index, photos: notification.content_photos })}
                                             />
                                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                               <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                                                 <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                 </svg>
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          imageAlt={`Conteúdo ${selectedImage.index + 1}`}
          imageIndex={selectedImage.index}
          totalImages={selectedImage.photos.length}
          onNext={() => {
            const nextIndex = (selectedImage.index + 1) % selectedImage.photos.length;
            setSelectedImage({
              ...selectedImage,
              url: selectedImage.photos[nextIndex],
              index: nextIndex
            });
          }}
          onPrevious={() => {
            const prevIndex = selectedImage.index === 0 ? selectedImage.photos.length - 1 : selectedImage.index - 1;
            setSelectedImage({
              ...selectedImage,
              url: selectedImage.photos[prevIndex],
              index: prevIndex
            });
          }}
        />
      )}
    </div>
  );
};