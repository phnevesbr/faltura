import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Users,
  Activity,
  Settings,
  X,
  Eye,
  Trash2
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'system' | 'users' | 'security' | 'performance';
}

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    // Simulação de notificações para demo
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Alto uso de CPU detectado',
        message: 'O servidor está operando com 85% de uso de CPU nas últimas 2 horas.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
        isRead: false,
        priority: 'high',
        category: 'performance'
      },
      {
        id: '2',
        type: 'success',
        title: 'Backup concluído com sucesso',
        message: 'Backup diário da base de dados concluído sem erros às 03:00.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        isRead: true,
        priority: 'low',
        category: 'system'
      },
      {
        id: '3',
        type: 'info',
        title: 'Novo usuário registrado',
        message: '5 novos usuários se registraram na plataforma hoje.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isRead: false,
        priority: 'medium',
        category: 'users'
      },
      {
        id: '4',
        type: 'error',
        title: 'Falha na sincronização',
        message: 'Erro detectado na sincronização com serviços externos.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        isRead: false,
        priority: 'high',
        category: 'system'
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'success': return <CheckCircle className="h-5 w-5" />;
      case 'error': return <X className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'success': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      case 'error': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Settings className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'performance': return <Activity className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'high') return notif.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{unreadCount}</span>
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-xl">Notificações do Sistema</CardTitle>
              <CardDescription>Acompanhe eventos importantes e alertas</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="relative"
              >
                Não lidas
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white h-5 w-5 p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant={filter === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('high')}
                className="relative"
              >
                Urgentes
                {highPriorityCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white h-5 w-5 p-0 text-xs">
                    {highPriorityCount}
                  </Badge>
                )}
              </Button>
            </div>
            
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                  notification.isRead ? "bg-muted/30" : "bg-card shadow-sm",
                  !notification.isRead && "border-l-4 border-l-primary"
                )}
              >
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      getNotificationColor(notification.type)
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h4 className={cn(
                          "font-semibold",
                          notification.isRead ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {notification.title}
                        </h4>
                        
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            getPriorityColor(notification.priority)
                          )} />
                          
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryIcon(notification.category)}
                            <span className="ml-1 capitalize">{notification.category}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-sm",
                        notification.isRead ? "text-muted-foreground" : "text-foreground/80"
                      )}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(notification.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {filter === 'all' ? 'Nenhuma notificação' : 
                 filter === 'unread' ? 'Nenhuma notificação não lida' : 
                 'Nenhuma notificação urgente'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' ? 'Todas as notificações aparecerão aqui' :
                 filter === 'unread' ? 'Ótimo! Você está em dia com as notificações' :
                 'Não há alertas urgentes no momento'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminNotifications;