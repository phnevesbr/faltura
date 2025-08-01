import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useClass } from '@/contexts/ClassContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, 
  Users, 
  Plus, 
  Mail, 
  Settings, 
  Trash2,
  GraduationCap,
  CalendarX,
  Sparkles,
  Target
} from 'lucide-react';
import { ClassCard } from './ClassCard';
import { ClassHeader } from './ClassHeader';
import { MembersList } from './MembersList';
import { NotificationCard } from './NotificationCard';

export const ModernMobileClassManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [contentText, setContentText] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'notifications'>('members');

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    await createClass(newClassName);
    setNewClassName('');
    setShowCreateClass(false);
    toast({
      title: "Turma criada! 🎉",
      description: "Sua nova turma foi criada com sucesso.",
    });
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentClass) return;
    await inviteToClass(currentClass.id, inviteEmail);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const handleSendContent = async (notificationId: string) => {
    if (!contentText.trim()) return;
    
    setIsUploading(true);
    try {
      await sendContent(notificationId, contentText, selectedFiles);
      setContentText('');
      setSelectedFiles([]);
      setSelectedNotification(null);
      toast({
        title: "Conteúdo enviado! ✅",
        description: "O conteúdo foi enviado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar conteúdo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Apenas imagens são permitidas.",
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
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
        title: "Sucesso! 🧹",
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
        title: "Turma atualizada! ✏️",
        description: "O nome da turma foi atualizado com sucesso.",
      });

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
      <div className="p-4 space-y-6 min-h-screen bg-background">
        {/* Header moderno */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white rounded-2xl p-6 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold">Turmas</h1>
                  <p className="text-white/80 text-sm">Gerencie suas turmas e colabore</p>
                </div>
              </div>
              
              <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl shadow-lg text-sm px-3 py-2 shrink-0">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden xs:inline">Nova Turma</span>
                    <span className="xs:hidden">Nova</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Criar Nova Turma
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="className" className="text-sm font-medium">Nome da Turma</Label>
                      <Input
                        id="className"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Ex: Matemática - 3º Ano"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateClass} className="flex-1">
                        <GraduationCap className="h-4 w-4 mr-2" />
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
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{classes.length}</div>
                <div className="text-white/80 text-sm">Turmas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{classes.filter(c => isLeader(c)).length}</div>
                <div className="text-white/80 text-sm">Liderando</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{invites.length}</div>
                <div className="text-white/80 text-sm">Convites</div>
              </div>
            </div>
          </div>
        </div>

        {/* Minhas Turmas */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Minhas Turmas</span>
                <p className="text-sm text-muted-foreground font-normal">{classes.length} turmas ativas</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma turma ainda</h3>
                <p className="text-muted-foreground mb-4">Crie sua primeira turma para começar a colaborar!</p>
                <Button onClick={() => setShowCreateClass(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Turma
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    isLeader={isLeader(classItem)}
                    onClick={() => selectClass(classItem)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Convites Pendentes */}
        {invites.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
              <div>
                <span className="text-xl font-bold">Convites Pendentes</span>
                <p className="text-sm text-muted-foreground font-normal">{invites.length} convite{invites.length !== 1 ? 's' : ''} aguardando</p>
              </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-950/50">
                 <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Convite para turma</p>
                    <p className="text-sm text-muted-foreground">
                      De: {invite.invitee_email}
                    </p>
                  </div>
                </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptInvite(invite.id)} className="bg-green-600 hover:bg-green-700">
                        Aceitar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => declineInvite(invite.id)}>
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
    );
  }

    return (
      <div className="p-4 space-y-6 min-h-screen bg-background">
        {/* Header da Turma */}
      <ClassHeader
        currentClass={currentClass}
        isLeader={isLeader(currentClass)}
        classMembers={classMembers}
        onBack={() => setCurrentClass(null)}
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        showClassSettings={showClassSettings}
        setShowClassSettings={setShowClassSettings}
        onSettingsOpen={() => setClassNameEdit(currentClass.name)}
      >
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Convidar Membro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail" className="text-sm font-medium">E-mail do usuário</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Digite o e-mail do usuário"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInvite} className="flex-1">
                Enviar Convite
              </Button>
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </ClassHeader>

      {/* Configurações da turma */}
      <Dialog open={showClassSettings} onOpenChange={setShowClassSettings}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configurações da Turma
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="classNameEdit" className="text-sm font-medium">Nome da Turma</Label>
              <Input
                id="classNameEdit"
                value={classNameEdit}
                onChange={(e) => setClassNameEdit(e.target.value)}
                placeholder="Nome da turma"
                className="mt-1"
              />
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

      {/* Tabs para Membros e Notificações */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === 'members' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('members')}
              className="flex-1 text-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Membros
            </Button>
            <Button
              variant={activeTab === 'notifications' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('notifications')}
              className="flex-1 text-sm"
            >
              <CalendarX className="h-4 w-4 mr-2" />
              Notificações
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {activeTab === 'members' ? (
            <MembersList
              classMembers={classMembers}
              currentClass={currentClass}
              currentUserId={user?.id || ''}
              isLeader={isLeader(currentClass)}
              onLeaveClass={() => leaveClass(currentClass.id)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <CalendarX className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-bold">Notificações de Falta</span>
                    <p className="text-sm text-muted-foreground">{absenceNotifications.length} notificações</p>
                  </div>
                </div>
                {isLeader(currentClass) && absenceNotifications.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAllNotifications}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              
              {absenceNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Target className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhuma falta registrada</h3>
                  <p className="text-muted-foreground">Quando alguém faltar, as notificações aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {absenceNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      currentUserId={user?.id || ''}
                      isLeader={isLeader(currentClass)}
                      selectedNotification={selectedNotification}
                      contentText={contentText}
                      selectedFiles={selectedFiles}
                      isUploading={isUploading}
                      onSelectNotification={setSelectedNotification}
                      onContentChange={setContentText}
                      onFileChange={handleFileChange}
                      onRemoveFile={removeFile}
                      onSendContent={handleSendContent}
                      onDeleteNotification={handleDeleteNotification}
                      onCancel={() => {
                        setSelectedNotification(null);
                        setSelectedFiles([]);
                        setContentText('');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};