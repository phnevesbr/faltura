import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Building, 
  Calendar, 
  Trophy,
  Save,
  X,
  Upload,
  Star,
  Zap
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  user_id: string;
  email: string;
  course: string;
  university: string;
  shift: string;
  avatar: string;
  created_at: string;
  level: number;
  total_experience: number;
  current_tier: string;
  is_banned: boolean;
  ban_reason?: string;
  semester_start?: string;
  semester_end?: string;
}

interface UserEditDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserEditDialog: React.FC<UserEditDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setEditedUser({
        course: user.course || '',
        university: user.university || '',
        shift: user.shift || 'morning',
        semester_start: user.semester_start || '',
        semester_end: user.semester_end || '',
        level: user.level,
        total_experience: user.total_experience
      });
      
      // Verificar se o usuário é professor
      checkTeacherStatus();
    }
  }, [user]);

  const checkTeacherStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('role', 'moderator')
        .is('revoked_at', null)
        .maybeSingle();

      if (error) {
        console.error('Error checking teacher status:', error);
        return;
      }

      setIsTeacher(!!data);
    } catch (error) {
      console.error('Error checking teacher status:', error);
    }
  };

  const toggleTeacherRole = async () => {
    if (!user) return;
    
    try {
      setLoadingRoles(true);
      console.log('Toggling teacher role for user:', user.user_id, 'Current isTeacher:', isTeacher);
      
      const currentUser = await supabase.auth.getUser();
      console.log('Current admin user:', currentUser.data.user?.id);
      
      if (isTeacher) {
        // Remover papel de professor (moderator)
        console.log('Removing teacher role...');
        const { data, error } = await supabase
          .from('admin_roles')
          .update({ 
            revoked_at: new Date().toISOString()
          })
          .eq('user_id', user.user_id)
          .eq('role', 'moderator')
          .is('revoked_at', null)
          .select();

        console.log('Remove teacher role result:', { data, error });
        if (error) throw error;

        setIsTeacher(false);
        toast({
          title: "Sucesso",
          description: "Papel de professor removido",
        });
      } else {
        // Adicionar papel de professor (moderator)
        console.log('Adding teacher role...');
        const { data, error } = await supabase
          .from('admin_roles')
          .upsert({
            user_id: user.user_id,
            role: 'moderator',
            granted_by: currentUser.data.user?.id,
            permissions: {
              analytics: false,
              system_config: false,
              user_management: false,
              class_management: true
            },
            revoked_at: null
          }, {
            onConflict: 'user_id'
          })
          .select();

        console.log('Add teacher role result:', { data, error });
        if (error) throw error;

        setIsTeacher(true);
        toast({
          title: "Sucesso",
          description: "Usuário definido como professor",
        });
      }
    } catch (error: any) {
      console.error('Error toggling teacher role:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao alterar papel de professor',
        variant: "destructive",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Verificar permissões antes de fazer qualquer alteração
      const { data: hasPermission, error: permissionError } = await supabase
        .rpc('check_admin_permissions', { 
          user_id_param: (await supabase.auth.getUser()).data.user?.id,
          required_permission: 'user_management' 
        });

      if (permissionError) {
        console.error('Permission check error:', permissionError);
        throw new Error('Erro ao verificar permissões');
      }

      if (!hasPermission) {
        throw new Error('Você não tem permissão para editar usuários');
      }

      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          course: editedUser.course,
          university: editedUser.university,
          shift: editedUser.shift,
          semester_start: editedUser.semester_start,
          semester_end: editedUser.semester_end
        })
        .eq('user_id', user.user_id);

      if (profileError) throw profileError;

      // Update level and experience if they were changed
      if (editedUser.level !== user.level || editedUser.total_experience !== user.total_experience) {
        // Calculate tier based on new level/experience
        const newLevel = editedUser.level || user.level;
        const newTotalExp = editedUser.total_experience || user.total_experience;
        
        let tier = 'calouro';
        if (newTotalExp >= 15000 || newLevel >= 51) tier = 'lenda';
        else if (newTotalExp >= 5000 || newLevel >= 26) tier = 'expert';
        else if (newTotalExp >= 1000 || newLevel >= 11) tier = 'veterano';

        // Calculate level progress (simplified calculation)
        let progress = 0;
        if (newLevel < 10) {
          const currentLevelXP = (newLevel - 1) * 100;
          const nextLevelXP = newLevel * 100;
          progress = ((newTotalExp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        } else if (newLevel < 25) {
          const currentLevelXP = 1000 + (newLevel - 11) * 267;
          const nextLevelXP = 1000 + (newLevel - 10) * 267;
          progress = ((newTotalExp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        } else if (newLevel < 50) {
          const currentLevelXP = 5000 + (newLevel - 26) * 400;
          const nextLevelXP = 5000 + (newLevel - 25) * 400;
          progress = ((newTotalExp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        } else {
          const currentLevelXP = 15000 + (newLevel - 51) * 800;
          const nextLevelXP = 15000 + (newLevel - 50) * 800;
          progress = ((newTotalExp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        }

        const { error: levelError } = await supabase
          .from('user_levels')
          .upsert({
            user_id: user.user_id,
            level: newLevel,
            total_experience: newTotalExp,
            experience_points: newTotalExp,
            current_tier: tier,
            level_progress: Math.max(0, Math.min(100, progress))
          }, {
            onConflict: 'user_id'
          });

        if (levelError) throw levelError;
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao atualizar usuário',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      calouro: 'bg-gray-100 text-gray-800 border-gray-200',
      veterano: 'bg-blue-100 text-blue-800 border-blue-200',
      expert: 'bg-purple-100 text-purple-800 border-purple-200',
      lenda: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span>Editar Usuário</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user.email}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getTierColor(user.current_tier)}>
                  {user.current_tier}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Trophy className="h-3 w-3" />
                  <span>Nível {user.level}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Readonly Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Level and Experience Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Gamificação</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Nível</Label>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <Input
                    id="level"
                    type="number"
                    min="1"
                    max="100"
                    value={editedUser.level || user.level}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                    placeholder="Ex: 25"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_experience">Experiência Total</Label>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <Input
                    id="total_experience"
                    type="number"
                    min="0"
                    value={editedUser.total_experience || user.total_experience}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, total_experience: parseInt(e.target.value) || 0 }))}
                    placeholder="Ex: 5000"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Roles Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Papéis do Usuário</span>
            </h4>
            
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Professor</p>
                    <p className="text-sm text-muted-foreground">
                      Permite criar turmas e gerenciar alunos
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isTeacher && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  )}
                  <Button
                    variant={isTeacher ? "destructive" : "default"}
                    size="sm"
                    onClick={toggleTeacherRole}
                    disabled={loadingRoles}
                  >
                    {loadingRoles ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isTeacher ? (
                      "Remover"
                    ) : (
                      "Definir como Professor"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Informações Acadêmicas</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Curso</Label>
                <Input
                  id="course"
                  value={editedUser.course || ''}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, course: e.target.value }))}
                  placeholder="Ex: Engenharia de Software"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">Universidade</Label>
                <Input
                  id="university"
                  value={editedUser.university || ''}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, university: e.target.value }))}
                  placeholder="Ex: Universidade Federal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <Select 
                  value={editedUser.shift || 'morning'} 
                  onValueChange={(value) => setEditedUser(prev => ({ ...prev, shift: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Manhã</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                    <SelectItem value="evening">Noite</SelectItem>
                    <SelectItem value="full">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester_start">Início do Semestre</Label>
                <Input
                  id="semester_start"
                  type="date"
                  value={editedUser.semester_start || ''}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, semester_start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester_end">Fim do Semestre</Label>
                <Input
                  id="semester_end"
                  type="date"
                  value={editedUser.semester_end || ''}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, semester_end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Ban Information */}
          {user.is_banned && user.ban_reason && (
            <>
              <Separator />
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Usuário Banido</h4>
                <p className="text-sm text-destructive/80">{user.ban_reason}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;