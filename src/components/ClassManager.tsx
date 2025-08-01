import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClass } from '@/contexts/ClassContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useSystemLimits } from '@/hooks/useSystemLimits';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Users, Plus, Mail, Calendar, MessageSquare, Image, Trash2, X, Upload, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ClassManager = () => {
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
  const isMobile = useIsMobile();

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
    
    // Validar arquivos
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Máximo 5 imagens
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
      // Deletar notificação específica
      const { error } = await supabase
        .from('absence_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Notificação removida",
        description: "A notificação foi removida com sucesso.",
      });

      // Recarregar notificações
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
      <div className="space-y-6">
        {/* Lista de Turmas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Minhas Turmas
            </CardTitle>
            <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Turma
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Turma</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="className">Nome da Turma</Label>
                    <Input
                      id="className"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Digite o nome da turma"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateClass} className="flex-1">
                      Criar Turma
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateClass(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Você ainda não tem nenhuma turma. Crie uma nova turma para começar!
              </p>
            ) : (
              <div className="grid gap-4">
                {classes.map((classItem) => (
                  <Card key={classItem.id} className="cursor-pointer hover:bg-muted/50 bg-card" onClick={() => selectClass(classItem)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{classItem.name}</h3>
                          {isLeader(classItem) && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Líder
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(classItem.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Convites Pendentes */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Convites Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div>
                      <p className="font-medium">Convite para turma</p>
                      <p className="text-sm text-muted-foreground">
                        De: {invite.invitee_email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptInvite(invite.id)}>
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
    <div className="space-y-6">
      {/* Header da Turma */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setCurrentClass(null)}>
                ← Voltar
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentClass.name}
                  {isLeader(currentClass) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Líder
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {classMembers.length}/{currentClass.max_members} membros
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isLeader(currentClass) && (
                <>
                  <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Convidar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Convidar Membro</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="inviteEmail">E-mail do usuário</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Digite o e-mail do usuário"
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
        </CardHeader>
      </Card>

      {/* Membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {classMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.profiles?.email?.split('@')[0] || `Usuário ${member.user_id.slice(0, 8)}`}
                    </p>
                    {member.user_id === currentClass.leader_id && (
                      <Badge variant="secondary">Líder</Badge>
                    )}
                  </div>
                </div>
                {member.user_id === user?.id && !isLeader(currentClass) && (
                  <Button size="sm" variant="outline" onClick={() => leaveClass(currentClass.id)}>
                    Sair da Turma
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notificações de Faltas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notificações de Falta</CardTitle>
          {isLeader(currentClass) && absenceNotifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearAllNotifications}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {absenceNotifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma falta registrada
            </p>
          ) : (
            <div className="space-y-4">
              {absenceNotifications.map((notification) => (
                <Card key={notification.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {notification.user_id === user?.id 
                              ? 'Você' 
                              : (notification.profiles?.email?.split('@')[0] || 'Usuário')
                            } faltou no dia{' '}
                            {format(new Date(notification.absence_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Matérias: {notification.subjects.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.content_sent && notification.user_id !== user?.id && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedNotification(notification.id)}
                              disabled={selectedNotification === notification.id}
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
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {notification.content_sent && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">Conteúdo enviado:</p>
                          <p className="text-sm">{notification.content_text}</p>
                          {notification.content_photos && notification.content_photos.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <Image className="h-4 w-4" />
                                {notification.content_photos.length} foto(s) anexada(s):
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {notification.content_photos.map((photoUrl, index) => (
                                   <img
                                     key={index}
                                     src={photoUrl}
                                     alt={`Conteúdo ${index + 1}`}
                                     className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                     loading="lazy"
                                     onClick={() => {
                                       const modal = document.createElement('div');
                                       modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
                                       modal.innerHTML = `
                                         <div class="relative max-w-4xl max-h-full">
                                           <img src="${photoUrl}" class="max-w-full max-h-full object-contain" />
                                           <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-colors">
                                             ×
                                           </button>
                                         </div>
                                       `;
                                        modal.onclick = (e) => {
                                          if (e.target === modal || (e.target as HTMLElement).tagName === 'BUTTON') {
                                            document.body.removeChild(modal);
                                          }
                                        };
                                       document.body.appendChild(modal);
                                     }}
                                   />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedNotification === notification.id && (
                        <div className="space-y-3 p-3 border rounded-lg">
                          <Label htmlFor={`content-${notification.id}`}>Conteúdo do dia</Label>
                          <Textarea
                            id={`content-${notification.id}`}
                            value={contentText}
                            onChange={(e) => setContentText(e.target.value)}
                            placeholder="Digite o conteúdo das aulas que foram perdidas..."
                            rows={4}
                          />
                          <div className="flex flex-col gap-3">
                            {/* Upload de imagens */}
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                id={`file-upload-${notification.id}`}
                                onChange={handleFileChange}
                              />
                              <Label 
                                htmlFor={`file-upload-${notification.id}`}
                                className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Anexar Fotos (máx: 5, 5MB cada)
                              </Label>
                              
                              {/* Preview das imagens selecionadas */}
                              {selectedFiles.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 p-2 border rounded-lg bg-muted/50">
                                  {selectedFiles.map((file, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-20 object-cover rounded border"
                                      />
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                        onClick={() => removeFile(index)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {file.name}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleSendContent(notification.id)}
                                disabled={!contentText.trim() || isUploading}
                              >
                                {isUploading ? 'Enviando...' : 'Enviar'}
                              </Button>
                              <Button 
                                size="sm" 
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

    </div>
  );
};