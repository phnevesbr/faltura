import React, { useState } from 'react';
import { Calendar, BookOpen, UserCheck, BarChart3, User, Trophy, Menu, X, Bell, Users, Award, FileText, Settings, ChevronRight, Shield, GraduationCap } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useIsAdmin } from '../../hooks/useIsAdmin';

interface ModernMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  notifications?: {
    subjects: number;
    notes: number;
    achievements: number;
    classes: number;
  };
  isStudent?: boolean;
}

const ModernMobileNav: React.FC<ModernMobileNavProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout,
  notifications = { subjects: 0, notes: 0, achievements: 0, classes: 0 },
  isStudent = false
}) => {
  const { isAdmin } = useIsAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainNavItems = [
    { 
      id: 'schedule', 
      icon: Calendar, 
      label: 'Grade',
      gradient: 'from-blue-500 to-blue-600',
      description: 'Horários das aulas'
    },
    { 
      id: 'subjects', 
      icon: BookOpen, 
      label: 'Matérias',
      gradient: 'from-purple-500 to-purple-600',
      description: 'Disciplinas cadastradas'
    },
    { 
      id: 'absences', 
      icon: UserCheck, 
      label: 'Faltas',
      gradient: 'from-green-500 to-green-600',
      description: 'Controle de presença'
    },
    { 
      id: 'stats', 
      icon: BarChart3, 
      label: 'Análises',
      gradient: 'from-orange-500 to-orange-600',
      description: 'Estatísticas e gráficos'
    }
  ];

  let menuItems = [
    { 
      id: 'profile', 
      icon: User, 
      label: 'Perfil',
      description: 'Suas informações pessoais',
      color: 'text-blue-600'
    },
    { 
      id: 'classes', 
      icon: Users, 
      label: 'Turmas',
      description: 'Gerenciar turmas e grupos',
      color: 'text-purple-600'
    },
    { 
      id: 'notes', 
      icon: FileText, 
      label: 'Anotações',
      description: 'Tarefas e lembretes',
      notification: notifications.notes,
      color: 'text-green-600'
    },
    { 
      id: 'achievements', 
      icon: Award, 
      label: 'Conquistas',
      description: 'Seus marcos e realizações',
      notification: notifications.achievements,
      color: 'text-yellow-600'
    },
    { 
      id: 'ranking', 
      icon: Trophy, 
      label: 'Ranking',
      description: 'Ranking global de usuários',
      color: 'text-orange-600'
    }
  ];

  // Add grades tab if user is student
  if (isStudent) {
    menuItems.splice(2, 0, {
      id: 'grades', 
      icon: GraduationCap, 
      label: 'Notas',
      description: 'Suas notas e avaliações',
      color: 'text-indigo-600'
    });
  }

  // Add admin item if user is admin
  if (isAdmin) {
    menuItems.push({
      id: 'admin',
      icon: Shield,
      label: 'Admin',
      description: 'Painel administrativo',
      color: 'text-red-600'
    });
  }

  const handleMenuItemClick = (id: string) => {
    onTabChange(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 px-4 py-2 z-40 shadow-lg">
        <div className="flex justify-between items-center max-w-sm mx-auto">
          {mainNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id)}
                data-tab={item.id}
                className={cn(
                  "relative flex flex-col items-center space-y-1 p-3 h-auto min-w-0 flex-1 rounded-xl transition-all duration-300",
                  isActive ? "bg-gradient-to-br " + item.gradient + " text-white shadow-lg scale-105" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <div className="relative">
                  <IconComponent className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                </div>
                <span className={cn(
                  "text-xs font-medium transition-all duration-300",
                  isActive ? "opacity-100 font-semibold" : "opacity-80"
                )}>
                  {item.label}
                </span>
              </Button>
            );
          })}

          {/* Menu Hambúrguer Moderno */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "relative flex flex-col items-center space-y-1 p-3 h-auto min-w-0 flex-1 rounded-xl transition-all duration-300",
                  "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <div className="relative">
                  <Menu className="h-5 w-5" />
                  {(notifications.notes > 0 || notifications.achievements > 0) && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-xs font-medium opacity-80">Menu</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[80vh] p-0 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Header do Menu */}
                <div className="text-center">
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900">Menu Principal</h3>
                  <p className="text-xs text-gray-600 mt-1">Acesse todas as funcionalidades</p>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all duration-300 hover:shadow-md border-0 bg-white/80 backdrop-blur-sm",
                          isActive && "ring-2 ring-blue-500 bg-blue-50/80"
                        )}
                        onClick={() => handleMenuItemClick(item.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "p-2 rounded-lg bg-gray-100 flex-shrink-0",
                                isActive && "bg-blue-100"
                              )}>
                                <IconComponent className={cn("h-4 w-4", item.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm">{item.label}</h4>
                                <p className="text-xs text-gray-600 truncate">{item.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {item.id === 'classes' && notifications.classes > 0 && (
                                <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                                  {notifications.classes > 9 ? '9+' : notifications.classes}
                                </Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Logout Button */}
                {onLogout && (
                  <div className="pt-3 border-t border-gray-200">
                    <Card className="cursor-pointer bg-red-50 border-red-200 hover:bg-red-100 transition-colors" onClick={onLogout}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-red-100">
                            <X className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="font-semibold text-red-700 text-sm">Sair do App</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default ModernMobileNav;