import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Crown, Plus, Settings, Users } from 'lucide-react';

interface ClassHeaderProps {
  currentClass: any;
  isLeader: boolean;
  classMembers: any[];
  onBack: () => void;
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  showClassSettings: boolean;
  setShowClassSettings: (show: boolean) => void;
  onSettingsOpen: () => void;
  children?: React.ReactNode;
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({
  currentClass,
  isLeader,
  classMembers,
  onBack,
  showInviteModal,
  setShowInviteModal,
  showClassSettings,
  setShowClassSettings,
  onSettingsOpen,
  children
}) => {
  return (
    <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white rounded-2xl p-6 shadow-xl mb-6">
      {/* Background pattern */}
      <div className="absolute inset-0 rounded-2xl opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10">
        {/* Top row with back button and actions */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {isLeader && (
            <div className="flex gap-2">
              <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                {children}
              </Dialog>
              
              <Dialog open={showClassSettings} onOpenChange={setShowClassSettings}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onSettingsOpen}
                    className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )}
        </div>
        
        {/* Class info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{currentClass.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {isLeader && (
                  <Badge className="bg-amber-500/90 text-white border-amber-300/50 flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Líder
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-white/30">
                  {classMembers.length}/{currentClass.max_members} membros
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};