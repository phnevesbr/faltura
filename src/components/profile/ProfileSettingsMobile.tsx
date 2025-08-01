import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { 
  Settings, 
  Bell, 
  Shield, 
  Trash2,
  Clock,
  Users,
  FileText,
  GraduationCap,
  AlertTriangle,
  X
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { useNotifications } from '../../hooks/useNotifications';

interface ProfileSettingsMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSettingsMobile: React.FC<ProfileSettingsMobileProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    settings: notificationSettings, 
    updateSettings, 
    loading: notificationLoading,
    isSupported,
    permission,
    requestPermission
  } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleNotificationChange = (key: string, value: boolean) => {
    // Alterando configuração de notificação mobile
    updateSettings({ [key]: value });
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800 text-xs">Permitidas</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800 text-xs">Negadas</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendente</Badge>;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso."
      });
      
      onClose();
    } catch (error) {
      // Erro ao excluir conta
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <SheetTitle>Configurações do Perfil</SheetTitle>
          </div>
          <SheetDescription>
            Gerencie suas preferências e configurações de conta
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Permission Status */}
              {isSupported && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Status das Permissões</p>
                      <p className="text-xs text-muted-foreground">
                        {permission === 'granted' 
                          ? 'Notificações habilitadas' 
                          : 'Permissão necessária'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPermissionBadge()}
                    {permission !== 'granted' && (
                      <Button onClick={requestPermission} size="sm" className="text-xs">
                        Permitir
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Smart Reminders */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Lembretes Inteligentes</Label>
                      <p className="text-xs text-muted-foreground">
                        Notificações 1 hora antes das aulas
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.reminders}
                    onCheckedChange={(checked) => {
                      handleNotificationChange('reminders', checked);
                    }}
                    className="scale-75"
                  />
                </div>
                
                <Separator />

                {/* Class Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-orange-500" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Notificações de Turma</Label>
                      <p className="text-xs text-muted-foreground">
                        Faltas e conteúdo compartilhado
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.absences}
                    onCheckedChange={(checked) => {
                      handleNotificationChange('absences', checked);
                    }}
                    className="scale-75"
                  />
                </div>
                
                <Separator />

                {/* Notes Deadlines */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-green-500" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Prazos de Anotações</Label>
                      <p className="text-xs text-muted-foreground">
                        Alertas de tarefas e provas
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.notes}
                    onCheckedChange={(checked) => {
                      handleNotificationChange('notes', checked);
                    }}
                    className="scale-75"
                  />
                </div>
                
                <Separator />

                {/* Achievements */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Conquistas</Label>
                      <p className="text-xs text-muted-foreground">
                        Novas conquistas e níveis
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.achievements}
                    onCheckedChange={(checked) => {
                      handleNotificationChange('achievements', checked);
                    }}
                    className="scale-75"
                  />
                </div>

              </div>

              {/* Warning for disabled notifications */}
              {isSupported && permission !== 'granted' && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      Notificações desabilitadas
                    </p>
                    <p className="text-yellow-700">
                      Permita o acesso nas configurações do navegador.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacidade e Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Privacidade e Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá excluir permanentemente sua conta
                      e remover todos os seus dados dos nossos servidores.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={loading}
                    >
                      {loading ? 'Excluindo...' : 'Excluir Conta'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-3 pb-6">
            <Button variant="outline" onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSettingsMobile;
