import React from 'react';
import { Bell, User, Users, Search, Sparkles, Calendar, Clock, Download, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface ModernMobileHeaderProps {
  user?: any;
  activeTab: string;
  notifications?: {
    subjects: number;
    notes: number;
    achievements: number;
    classes: number;
  };
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

const ModernMobileHeader: React.FC<ModernMobileHeaderProps> = ({ 
  user, 
  activeTab,
  notifications = { subjects: 0, notes: 0, achievements: 0, classes: 0 },
  onNotificationClick,
  onSettingsClick
}) => {
  const getTabInfo = (tab: string) => {
    const tabConfig = {
      schedule: {
        title: 'Grade Horária',
        subtitle: 'Seus horários de hoje',
        icon: Calendar,
        gradient: 'from-blue-500 to-blue-600',
        time: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      },
      subjects: {
        title: 'Matérias',
        subtitle: 'Suas disciplinas',
        icon: Clock,
        gradient: 'from-purple-500 to-purple-600',
        time: 'Semestre atual'
      },
      absences: {
        title: 'Controle de Faltas',
        subtitle: 'Acompanhe sua frequência',
        icon: Calendar,
        gradient: 'from-green-500 to-green-600',
        time: 'Atualizado agora'
      },
      stats: {
        title: 'Estatísticas',
        subtitle: 'Seu desempenho',
        icon: Calendar,
        gradient: 'from-orange-500 to-orange-600',
        time: 'Dados em tempo real'
      },
      profile: {
        title: 'Perfil',
        subtitle: 'Suas informações',
        icon: Calendar,
        gradient: 'from-blue-500 to-blue-600',
        time: 'Atualizado'
      },
      classes: {
        title: 'Turmas',
        subtitle: 'Seus grupos',
        icon: Calendar,
        gradient: 'from-purple-500 to-purple-600',
        time: 'Conectado'
      },
      notes: {
        title: 'Anotações',
        subtitle: 'Tarefas e lembretes',
        icon: Calendar,
        gradient: 'from-green-500 to-green-600',
        time: 'Organizado'
      },
      achievements: {
        title: 'Conquistas',
        subtitle: 'Seus marcos',
        icon: Calendar,
        gradient: 'from-yellow-500 to-yellow-600',
        time: 'Parabéns!'
      },
      ranking: {
        title: 'Ranking Global',
        subtitle: 'Top 20 usuários com maior XP',
        icon: Calendar,
        gradient: 'from-orange-500 to-orange-600',
        time: 'Competindo'
      }
    };
    return tabConfig[tab as keyof typeof tabConfig] || tabConfig.schedule;
  };

  const currentTabInfo = getTabInfo(activeTab);
  const totalNotifications = notifications.classes;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante';

  return (
    <div className={cn(
      "bg-gradient-to-br",
      currentTabInfo.gradient,
      "text-white relative overflow-hidden"
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/50 rounded-full translate-y-24 -translate-x-24" />
      </div>

      <div className="relative px-6 py-6 space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{userName}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onNotificationClick}
              className="relative h-10 w-10 p-0 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0"
            >
              <Users className="h-5 w-5" />
              {totalNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center"
                >
                  {totalNotifications > 9 ? '9+' : totalNotifications}
                </Badge>
              )}
            </Button>

            {/* Profile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="h-10 w-10 p-0 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Current Tab Info */}
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold">{currentTabInfo.title}</h2>
            <p className="text-white/80 text-sm">{currentTabInfo.subtitle}</p>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default ModernMobileHeader;