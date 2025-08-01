import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Users, 
  FileText, 
  GraduationCap,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import TestNotificationButton from './TestNotificationButton';
import { useIsMobile } from '../hooks/use-mobile';

const NotificationSettings: React.FC = () => {
  const {
    settings,
    isSupported,
    permission,
    requestPermission,
    updateSettings
  } = useNotifications();
  const isMobile = useIsMobile();

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
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

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellOff className="h-5 w-5" />
            <span>Notificações não suportadas</span>
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Configurações de Notificação</span>
          </CardTitle>
          <CardDescription>
            Configure quando e como receber notificações do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
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
              {permission === 'granted' && (
                <TestNotificationButton />
              )}
            </div>
          </div>

          {/* Notification Categories */}
          <div className="space-y-4">
            <h4 className="font-medium">Tipos de Notificação</h4>
            
            <div className="space-y-4">
              {/* Smart Reminders - Always shown */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <Label htmlFor="reminders" className="font-medium">
                      Lembretes Inteligentes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações 1 hora antes das aulas começarem
                    </p>
                  </div>
                </div>
                <Switch
                  id="reminders"
                  checked={settings.reminders}
                  onCheckedChange={() => handleToggle('reminders')}
                />
              </div>

              {/* Class Notifications - Always shown */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-orange-500" />
                  <div>
                    <Label htmlFor="absences" className="font-medium">
                      Notificações de Turma
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Quando colegas registram faltas ou compartilham conteúdo
                    </p>
                  </div>
                </div>
                <Switch
                  id="absences"
                  checked={settings.absences}
                  onCheckedChange={() => handleToggle('absences')}
                />
              </div>

              {/* Desktop-only notifications */}
              {!isMobile && (
                <>
                  {/* Notes Deadlines */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-green-500" />
                      <div>
                        <Label htmlFor="notes" className="font-medium">
                          Prazos de Anotações
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Alertas quando tarefas e provas estão próximas do vencimento
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="notes"
                      checked={settings.notes}
                      onCheckedChange={() => handleToggle('notes')}
                    />
                  </div>

                  {/* Achievements */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <div>
                        <Label htmlFor="achievements" className="font-medium">
                          Conquistas
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Quando você ganha novas conquistas ou sobe de nível
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="achievements"
                      checked={settings.achievements}
                      onCheckedChange={() => handleToggle('achievements')}
                    />
                  </div>

                  {/* Other Notifications */}
                  <div className="space-y-4 pt-4 border-t">
                    <h5 className="text-sm font-medium text-muted-foreground">Outras Notificações</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="subjects" className="text-sm">
                          Matérias
                        </Label>
                        <Switch
                          id="subjects"
                          checked={settings.subjects}
                          onCheckedChange={() => handleToggle('subjects')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grade" className="text-sm">
                          Notas
                        </Label>
                        <Switch
                          id="grade"
                          checked={settings.grade}
                          onCheckedChange={() => handleToggle('grade')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="profile" className="text-sm">
                          Perfil
                        </Label>
                        <Switch
                          id="profile"
                          checked={settings.profile}
                          onCheckedChange={() => handleToggle('profile')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="xp_rewards" className="text-sm">
                          Ganhar XP
                        </Label>
                        <Switch
                          id="xp_rewards"
                          checked={settings.xp_rewards}
                          onCheckedChange={() => handleToggle('xp_rewards')}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Warning for disabled notifications */}
          {permission !== 'granted' && (
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
    </div>
  );
};

export default NotificationSettings;
