import React from 'react';
import { Calendar, BookOpen, UserCheck, FileText, BarChart3, User, Trophy, Menu, X, Heart, Users, Shield, Award } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useIsTeacher } from '../hooks/useIsTeacher';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange, onLogout }) => {
  const { isAdmin } = useIsAdmin();
  const { isTeacher } = useIsTeacher();
  const navItems = [
    { id: 'schedule', icon: Calendar, label: 'Grade' },
    { id: 'subjects', icon: BookOpen, label: 'Matérias' },  
    { id: 'absences', icon: UserCheck, label: 'Faltas' },
    { id: 'stats', icon: BarChart3, label: 'Estatísticas' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
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
                "flex flex-col items-center space-y-1 p-2 h-auto min-w-0 flex-1",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              <IconComponent className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Button>
          );
        })}

        {/* Menu Hambúrguer */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center space-y-1 p-2 h-auto min-w-0 flex-1",
                activeTab === 'gamification' ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              <Menu className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white z-[100] border shadow-lg">
            <DropdownMenuItem onClick={() => onTabChange('profile')}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('classes')}>
              <Users className="mr-2 h-4 w-4" />
              Turmas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('notes')}>
              <FileText className="mr-2 h-4 w-4" />
              Anotações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTabChange('achievements')}>
              <Award className="mr-2 h-4 w-4" />
              Conquistas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default MobileBottomNav;