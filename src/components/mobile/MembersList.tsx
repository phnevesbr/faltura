import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Crown, LogOut, Mail } from 'lucide-react';

interface MembersListProps {
  classMembers: any[];
  currentClass: any;
  currentUserId: string;
  isLeader: boolean;
  onLeaveClass: () => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  classMembers,
  currentClass,
  currentUserId,
  isLeader,
  onLeaveClass
}) => {
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getDisplayName = (member: any) => {
    return member.profiles?.email?.split('@')[0] || `Usuário ${member.user_id.slice(0, 8)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">Membros da Turma</h3>
          <p className="text-sm text-gray-500">{classMembers.length} membros ativos</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {classMembers.map((member, index) => (
          <div 
            key={member.id} 
            className="group flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
              <Avatar className="h-10 w-10 ring-2 ring-gray-100 group-hover:ring-primary/20 transition-all flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-sm">
                  {getInitials(member.profiles?.email || member.user_id)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate text-sm">
                    {getDisplayName(member)}
                  </h4>
                  {member.user_id === currentClass.leader_id && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 text-xs px-2 py-0.5 flex-shrink-0">
                      <Crown className="h-2.5 w-2.5" />
                      <span className="hidden xs:inline">Líder</span>
                      <span className="xs:hidden">L</span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{member.profiles?.email || 'Email não disponível'}</span>
                </div>
              </div>
            </div>
            
            {member.user_id === currentUserId && !isLeader && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onLeaveClass}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs px-2 py-1 h-auto flex-shrink-0 ml-2"
              >
                <LogOut className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">Sair</span>
                <span className="xs:hidden">S</span>
              </Button>
            )}
          </div>
        ))}
        
        {classMembers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum membro na turma</p>
          </div>
        )}
      </div>
    </div>
  );
};