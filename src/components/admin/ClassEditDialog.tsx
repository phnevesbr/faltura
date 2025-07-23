import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Users, 
  Mail, 
  Calendar, 
  Save,
  X,
  UserCheck,
  Settings,
  Bell,
  Trash2
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClassData {
  id: string;
  name: string;
  leader_id: string;
  leader_email: string;
  max_members: number;
  member_count: number;
  created_at: string;
  pending_notifications: number;
  total_notifications: number;
}

interface ClassEditDialogProps {
  classData: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
  onClassUpdated: () => void;
}

const ClassEditDialog: React.FC<ClassEditDialogProps> = ({
  classData,
  isOpen,
  onClose,
  onClassUpdated
}) => {
  const [editedClass, setEditedClass] = useState<Partial<ClassData>>({});
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (classData) {
      setEditedClass({
        name: classData.name,
        max_members: classData.max_members
      });
      loadMembers();
    }
  }, [classData]);

  const loadMembers = async () => {
    if (!classData) return;

    try {
      setLoadingMembers(true);
      
      const { data: memberIds, error: memberError } = await supabase
        .from('class_members')
        .select('user_id')
        .eq('class_id', classData.id);

      if (memberError) throw memberError;

      if (memberIds && memberIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, course, avatar')
          .in('user_id', memberIds.map(m => m.user_id));

        if (profilesError) throw profilesError;
        setMembers(profiles || []);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros da turma",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSave = async () => {
    if (!classData) return;

    try {
      setLoading(true);

      // Verificar permissões antes de fazer qualquer alteração
      const { data: hasPermission, error: permissionError } = await supabase
        .rpc('check_admin_permissions', { 
          user_id_param: (await supabase.auth.getUser()).data.user?.id,
          required_permission: 'class_management' 
        });

      if (permissionError) {
        console.error('Permission check error:', permissionError);
        throw new Error('Erro ao verificar permissões');
      }

      if (!hasPermission) {
        throw new Error('Você não tem permissão para editar turmas');
      }

      const { error } = await supabase
        .from('classes')
        .update({
          name: editedClass.name,
          max_members: editedClass.max_members
        })
        .eq('id', classData.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Turma atualizada com sucesso",
      });
      onClassUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating class:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar turma",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!classData) return;

    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classData.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Membro removido da turma",
      });
      loadMembers();
      onClassUpdated();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive",
      });
    }
  };

  const handleClearNotifications = async (type: 'old' | 'all') => {
    if (!classData) return;

    try {
      const functionName = type === 'all' ? 'clear_all_absence_notifications' : 'clear_old_absence_notifications';
      
      const { data, error } = await supabase.rpc(functionName, {
        class_id_param: classData.id,
        ...(type === 'old' && { days_old: 30 })
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${data} notificações removidas com sucesso`,
      });
      onClassUpdated();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar notificações",
        variant: "destructive",
      });
    }
  };

  if (!classData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>Editar Turma</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Header */}
          <div className="p-4 bg-muted/30 rounded-xl">
            <h3 className="font-semibold text-lg mb-2">{classData.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Criada em {new Date(classData.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>Líder: {classData.leader_email}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações da Turma</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Turma</Label>
                <Input
                  id="name"
                  value={editedClass.name || ''}
                  onChange={(e) => setEditedClass(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da turma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_members">Máximo de Membros</Label>
                <Input
                  id="max_members"
                  type="number"
                  min="1"
                  max="100"
                  value={editedClass.max_members || ''}
                  onChange={(e) => setEditedClass(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                  placeholder="Número máximo de membros"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Class Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{classData.member_count}</div>
              <div className="text-sm text-muted-foreground">Membros Ativos</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{classData.total_notifications}</div>
              <div className="text-sm text-muted-foreground">Total de Notificações</div>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{classData.pending_notifications}</div>
              <div className="text-sm text-muted-foreground">Notificações Pendentes</div>
            </div>
          </div>

          {/* Notifications Management */}
          {classData.total_notifications > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Gerenciar Notificações</span>
                </h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleClearNotifications('old')}
                    className="flex-1"
                  >
                    Limpar Antigas (30+ dias)
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleClearNotifications('all')}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Todas
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Members List */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Membros da Turma ({members.length})</span>
            </h4>
            
            {loadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : members.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium">
                            {member.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{member.email}</div>
                        <div className="text-xs text-muted-foreground">{member.course || 'Curso não informado'}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum membro encontrado
              </div>
            )}
          </div>
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

export default ClassEditDialog;