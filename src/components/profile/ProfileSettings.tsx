import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { 
  Settings, 
  Bell, 
  Shield, 
  Download, 
  Trash2,
  Clock,
  Users,
  FileText,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { useNotifications } from '../../hooks/useNotifications';

interface ProfileSettingsProps {
  onClose: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    settings: notificationSettings, 
    shouldShowNotification, 
    refreshSettings, 
    updateSettings, 
    loading: notificationLoading,
    isSupported,
    permission,
    requestPermission
  } = useNotifications();
  const [loading, setLoading] = useState(false);

  // Não precisamos mais carregar separadamente, usamos o hook

  const handleNotificationChange = (key: string, value: boolean) => {
    // Alterando configuração de notificação
    updateSettings({ [key]: value });
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">Permitidas</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Negadas</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
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
    <div className="space-y-6">

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
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Status das Permissões</p>
                  <p className="text-sm text-muted-foreground">
                    {permission === 'granted' 
                      ? 'Notificações habilitadas para este site' 
                      : 'Permissão necessária para receber notificações'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getPermissionBadge()}
                {permission !== 'granted' && (
                  <Button onClick={requestPermission} size="sm">
                    Permitir
                  </Button>
                )}
              </div>
            </div>
          )}

            <div className="space-y-4">

            {/* Class Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-orange-500" />
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notificações de Turma</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando colegas registram faltas ou compartilham conteúdo
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.absences}
                onCheckedChange={(checked) => {
                  handleNotificationChange('absences', checked);
                  if (checked) {
                    toast({
                      title: "Notificações de Turma Ativadas",
                      description: "Você receberá notificações da turma."
                    });
                  }
                }}
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
                    Alertas quando tarefas e provas estão próximas do vencimento
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.notes}
                onCheckedChange={(checked) => {
                  handleNotificationChange('notes', checked);
                  if (checked) {
                    toast({
                      title: "Alertas de Prazo Ativados",
                      description: "Você receberá alertas sobre prazos."
                    });
                  }
                }}
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
                    Quando você ganha novas conquistas ou sobe de nível
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.achievements}
                onCheckedChange={(checked) => {
                  handleNotificationChange('achievements', checked);
                  if (checked) {
                    toast({
                      title: "Notificações de Conquistas Ativadas",
                      description: "Você receberá notificações dos achievements e XP."
                    });
                  }
                }}
              />
            </div>

            <Separator />

            {/* Other Basic Notifications */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">Outras Notificações</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grade" className="text-sm">Grade</Label>
                  <Switch
                    id="grade"
                    checked={notificationSettings.grade}
                    onCheckedChange={(checked) => handleNotificationChange('grade', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="subjects" className="text-sm">Matérias</Label>
                  <Switch
                    id="subjects"
                    checked={notificationSettings.subjects}
                    onCheckedChange={(checked) => handleNotificationChange('subjects', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="profile" className="text-sm">Perfil</Label>
                  <Switch
                    id="profile"
                    checked={notificationSettings.profile}
                    onCheckedChange={(checked) => handleNotificationChange('profile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="xp_rewards" className="text-sm">Ganhar XP</Label>
                  <Switch
                    id="xp_rewards"
                    checked={notificationSettings.xp_rewards}
                    onCheckedChange={(checked) => handleNotificationChange('xp_rewards', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Warning for disabled notifications */}
          {isSupported && permission !== 'granted' && (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">
                  Notificações desabilitadas
                </p>
                <p className="text-yellow-700">
                  Para receber notificações, você precisa permitir o acesso nas configurações do seu navegador.
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
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="w-full">
          Fechar
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;