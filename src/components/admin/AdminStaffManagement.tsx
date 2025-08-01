import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Crown, 
  Shield, 
  UserPlus, 
  Search, 
  Settings,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  permissions: {
    analytics: boolean;
    system_config: boolean;
    user_management: boolean;
    class_management: boolean;
  };
  granted_at: string;
  granted_by: string | null;
  revoked_at: string | null;
  // Dados do perfil
  email?: string;
  course?: string;
  avatar?: string;
}

const AdminStaffManagement: React.FC = () => {
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { refetch: refetchPermissions } = useAdminPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<string>('moderator');
  const [newAdminPermissions, setNewAdminPermissions] = useState({
    analytics: true,
    system_config: false,
    user_management: true,
    class_management: true
  });
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    loadAdminRoles();
    getCurrentUserRole();
  }, []);

  const getCurrentUserRole = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser?.user) {
        const { data: role } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', currentUser.user.id)
          .is('revoked_at', null)
          .single();
        
        setCurrentUserRole(role?.role || '');
      }
    } catch (error) {
      console.error('Error getting current user role:', error);
    }
  };

  const loadAdminRoles = async () => {
    try {
      setLoading(true);
      
      // Buscar roles de admin
      const { data: roles, error: rolesError } = await supabase
        .from('admin_roles')
        .select('*')
        .is('revoked_at', null)
        .order('granted_at', { ascending: false });

      if (rolesError) {
        toast.error('Erro ao carregar administradores');
        console.error('Error loading admin roles:', rolesError);
        return;
      }

      // Buscar profiles para cada role
      const mappedRoles: AdminRole[] = [];
      
      for (const role of roles || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, course, avatar')
          .eq('user_id', role.user_id)
          .single();

        mappedRoles.push({
          ...role,
          permissions: role.permissions as AdminRole['permissions'],
          email: profile?.email || '',
          course: profile?.course || '',
          avatar: profile?.avatar || ''
        });
      }
      
      setAdminRoles(mappedRoles);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar administradores');
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail) {
      toast.error('Email é obrigatório');
      return;
    }

    try {
      // Primeiro, buscar o usuário pelo email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newAdminEmail)
        .single();

      if (profileError || !profile) {
        toast.error('Usuário não encontrado com esse email');
        return;
      }

      // Verificar se já possui algum role (ativo ou revogado)
      const { data: existingRoles, error: existingError } = await supabase
        .from('admin_roles')
        .select('id, revoked_at')
        .eq('user_id', profile.user_id);

      if (existingError) {
        console.error('Error checking existing roles:', existingError);
        toast.error('Erro ao verificar permissões existentes');
        return;
      }

      // Verificar se já tem role ativo
      const activeRole = existingRoles?.find(role => role.revoked_at === null);
      if (activeRole) {
        toast.error('Usuário já possui permissões administrativas ativas');
        return;
      }

      // Se já teve roles mas foram revogados, removê-los antes de adicionar novo
      if (existingRoles && existingRoles.length > 0) {
        const { error: deleteError } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', profile.user_id);

        if (deleteError) {
          console.error('Error deleting old roles:', deleteError);
          toast.error('Erro ao limpar permissões antigas');
          return;
        }
      }

      // Obter o usuário atual para granted_by
      const { data: currentUser } = await supabase.auth.getUser();

      // Adicionar role de admin
      const { error: insertError } = await supabase
        .from('admin_roles')
        .insert({
          user_id: profile.user_id,
          role: newAdminRole,
          permissions: newAdminPermissions,
          granted_by: currentUser?.user?.id || null
        });

      if (insertError) {
        toast.error('Erro ao adicionar administrador');
        console.error('Error adding admin:', insertError);
      } else {
        toast.success('Administrador adicionado com sucesso!');
        setIsAddDialogOpen(false);
        setNewAdminEmail('');
        setNewAdminRole('moderator');
        setNewAdminPermissions({
          analytics: true,
          system_config: false,
          user_management: true,
          class_management: true
        });
        loadAdminRoles();
        // Refetch permissions para atualizar o dashboard
        refetchPermissions();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao adicionar administrador');
    }
  };

  const revokeAdmin = async (roleId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', roleId);

      if (error) {
        toast.error('Erro ao revogar permissões');
        console.error('Error revoking admin:', error);
      } else {
        toast.success(`Permissões revogadas para ${email}`);
        loadAdminRoles();
        // Refetch permissions para atualizar o dashboard
        refetchPermissions();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao revogar permissões');
    }
  };

  const editAdmin = (role: AdminRole) => {
    setEditingRole(role);
    setIsEditDialogOpen(true);
  };

  const updateAdmin = async () => {
    if (!editingRole) return;

    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({
          role: editingRole.role,
          permissions: editingRole.permissions
        })
        .eq('id', editingRole.id);

      if (error) {
        toast.error('Erro ao atualizar administrador');
        console.error('Error updating admin:', error);
      } else {
        toast.success('Administrador editado com sucesso!');
        setIsEditDialogOpen(false);
        setEditingRole(null);
        loadAdminRoles();
        // Refetch permissions para atualizar o dashboard
        refetchPermissions();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao atualizar administrador');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white';
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'moderator':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'moderator':
        return <Settings className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const filteredRoles = adminRoles.filter(role =>
    role.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Gerenciamento de Staff</CardTitle>
                <CardDescription>Gerencie administradores e suas permissões no sistema</CardDescription>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Administrador</DialogTitle>
                  <DialogDescription>
                    Adicione um usuário como administrador e defina suas permissões
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email do Usuário</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@exemplo.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="role">Nível de Permissão</Label>
                     <Select value={newAdminRole} onValueChange={(value) => {
                       setNewAdminRole(value);
                       // Definir permissões padrão baseadas no nível
                       if (value === 'super_admin') {
                         setNewAdminPermissions({
                           analytics: true,
                           system_config: true,
                           user_management: true,
                           class_management: true
                         });
                       } else if (value === 'admin') {
                         setNewAdminPermissions({
                           analytics: true,
                           system_config: true,
                           user_management: true,
                           class_management: true
                         });
                       } else {
                         // Moderador: Analytics + Turmas + Usuários
                         setNewAdminPermissions({
                           analytics: true,
                           system_config: false,
                           user_management: true,
                           class_management: true
                         });
                       }
                     }}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="moderator">
                           <div className="flex items-center space-x-2">
                             <Settings className="h-4 w-4" />
                             <div>
                               <span>Moderador</span>
                               <p className="text-xs text-muted-foreground">Analytics + Turmas + Usuários</p>
                             </div>
                           </div>
                         </SelectItem>
                         <SelectItem value="admin">
                           <div className="flex items-center space-x-2">
                             <Shield className="h-4 w-4" />
                             <div>
                               <span>Administrador</span>
                               <p className="text-xs text-muted-foreground">Todas as permissões - staff</p>
                             </div>
                           </div>
                         </SelectItem>
                         {currentUserRole === 'super_admin' && (
                           <SelectItem value="super_admin">
                             <div className="flex items-center space-x-2">
                               <Crown className="h-4 w-4" />
                               <div>
                                 <span>Super Admin</span>
                                 <p className="text-xs text-muted-foreground">Todas as permissões + staff</p>
                               </div>
                             </div>
                           </SelectItem>
                         )}
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <Label>Permissões Específicas</Label>
                       {currentUserRole === 'super_admin' && (
                         <span className="text-xs text-muted-foreground">Como Super Admin, você pode personalizar qualquer permissão</span>
                       )}
                     </div>
                     <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                       {Object.entries(newAdminPermissions).map(([key, value]) => {
                         const getPermissionInfo = (permKey: string) => {
                           switch(permKey) {
                             case 'analytics': return { 
                               label: 'Analytics', 
                               desc: 'Visualizar estatísticas e relatórios do sistema',
                               restriction: '' 
                             };
                             case 'system_config': return { 
                               label: 'Configurações do Sistema', 
                               desc: 'Alterar configurações gerais e avançadas',
                               restriction: newAdminRole === 'moderator' ? 'Disponível apenas para Admin+' : ''
                             };
                             case 'user_management': return { 
                               label: 'Gestão de Usuários', 
                               desc: 'Gerenciar usuários comuns e banimentos',
                               restriction: '' 
                             };
                             case 'class_management': return { 
                               label: 'Gestão de Turmas', 
                               desc: 'Gerenciar turmas e suas configurações',
                               restriction: '' 
                             };
                             default: return { label: permKey.replace('_', ' '), desc: '', restriction: '' };
                           }
                         };
                         
                         const permInfo = getPermissionInfo(key);
                         const isDisabled = newAdminRole !== 'super_admin' && currentUserRole !== 'super_admin' && 
                                          ((newAdminRole === 'moderator' && key === 'system_config'));
                         
                         return (
                           <div key={key} className={`flex items-start space-x-3 p-2 hover:bg-muted/30 rounded ${isDisabled ? 'opacity-50' : ''}`}>
                             <input
                               type="checkbox"
                               id={key}
                               checked={value}
                               disabled={isDisabled}
                               onChange={(e) =>
                                 setNewAdminPermissions(prev => ({
                                   ...prev,
                                   [key]: e.target.checked
                                 }))
                               }
                               className="mt-1 rounded border-gray-300"
                             />
                             <div className="flex-1">
                               <label htmlFor={key} className={`text-sm font-medium cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}>
                                 {permInfo.label}
                               </label>
                               {permInfo.desc && (
                                 <p className="text-xs text-muted-foreground mt-0.5">{permInfo.desc}</p>
                               )}
                               {permInfo.restriction && (
                                 <p className="text-xs text-orange-600 mt-0.5">{permInfo.restriction}</p>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                   <div className="flex justify-end space-x-2 pt-4">
                     <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                       Cancelar
                     </Button>
                     <Button onClick={addAdmin} disabled={currentUserRole !== 'super_admin' && newAdminRole === 'super_admin'}>
                       Adicionar
                     </Button>
                   </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, curso ou nível..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Administradores Ativos ({filteredRoles.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Carregando administradores...</p>
              </div>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum administrador encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Adicionado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {role.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{role.email}</p>
                          {role.course && (
                            <p className="text-sm text-muted-foreground">{role.course}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("inline-flex items-center space-x-1", getRoleColor(role.role))}>
                        {getRoleIcon(role.role)}
                        <span className="capitalize">{role.role.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(role.permissions).map(([key, value]) => (
                          value && (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key.replace('_', ' ')}
                            </Badge>
                          )
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(role.granted_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center space-x-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => editAdmin(role)}
                           disabled={currentUserRole !== 'super_admin' && role.role === 'super_admin'}
                           className="text-primary hover:text-primary hover:bg-primary/10"
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => revokeAdmin(role.id, role.email || '')}
                           disabled={currentUserRole !== 'super_admin' && role.role === 'super_admin'}
                           className="text-destructive hover:text-destructive hover:bg-destructive/10"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Administrador</DialogTitle>
            <DialogDescription>
              Modifique o nível e permissões do administrador
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                  {editingRole.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{editingRole.email}</p>
                  {editingRole.course && (
                    <p className="text-sm text-muted-foreground">{editingRole.course}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">Nível de Permissão</Label>
                <Select 
                  value={editingRole.role} 
                  onValueChange={(value) => {
                    setEditingRole(prev => prev ? { ...prev, role: value } : null);
                    // Definir permissões padrão baseadas no nível
                    if (value === 'super_admin') {
                      setEditingRole(prev => prev ? {
                        ...prev,
                         role: value,
                         permissions: {
                           analytics: true,
                           system_config: true,
                           user_management: true,
                           class_management: true
                         }
                       } : null);
                     } else if (value === 'admin') {
                       setEditingRole(prev => prev ? {
                         ...prev,
                         role: value,
                         permissions: {
                           analytics: true,
                           system_config: true,
                           user_management: true,
                           class_management: true
                         }
                       } : null);
                     } else {
                       // Moderador: Analytics + Turmas + Usuários
                       setEditingRole(prev => prev ? {
                         ...prev,
                         role: value,
                         permissions: {
                           analytics: true,
                           system_config: false,
                           user_management: true,
                           class_management: true
                         }
                      } : null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="moderator">
                       <div className="flex items-center space-x-2">
                         <Settings className="h-4 w-4" />
                         <div>
                           <span>Moderador</span>
                           <p className="text-xs text-muted-foreground">Analytics + Turmas + Usuários</p>
                         </div>
                       </div>
                     </SelectItem>
                     <SelectItem value="admin">
                       <div className="flex items-center space-x-2">
                         <Shield className="h-4 w-4" />
                         <div>
                           <span>Administrador</span>
                           <p className="text-xs text-muted-foreground">Todas as permissões - staff</p>
                         </div>
                       </div>
                     </SelectItem>
                     {currentUserRole === 'super_admin' && (
                       <SelectItem value="super_admin">
                         <div className="flex items-center space-x-2">
                           <Crown className="h-4 w-4" />
                           <div>
                             <span>Super Admin</span>
                             <p className="text-xs text-muted-foreground">Todas as permissões + staff</p>
                           </div>
                         </div>
                       </SelectItem>
                     )}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <Label>Permissões Específicas</Label>
                   {currentUserRole === 'super_admin' && (
                     <span className="text-xs text-muted-foreground">Como Super Admin, você pode personalizar qualquer permissão</span>
                   )}
                 </div>
                 <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                   {Object.entries(editingRole.permissions).map(([key, value]) => {
                     const getPermissionInfo = (permKey: string) => {
                       switch(permKey) {
                         case 'analytics': return { 
                           label: 'Analytics', 
                           desc: 'Visualizar estatísticas e relatórios do sistema',
                           restriction: '' 
                         };
                         case 'system_config': return { 
                           label: 'Configurações do Sistema', 
                           desc: 'Alterar configurações gerais e avançadas',
                           restriction: editingRole.role === 'moderator' && currentUserRole !== 'super_admin' ? 'Disponível apenas para Admin+' : ''
                         };
                         case 'user_management': return { 
                           label: 'Gestão de Usuários', 
                           desc: 'Gerenciar usuários comuns e banimentos',
                           restriction: '' 
                         };
                         case 'class_management': return { 
                           label: 'Gestão de Turmas', 
                           desc: 'Gerenciar turmas e suas configurações',
                           restriction: '' 
                         };
                         default: return { label: permKey.replace('_', ' '), desc: '', restriction: '' };
                       }
                     };
                     
                     const permInfo = getPermissionInfo(key);
                     const isDisabled = editingRole.role !== 'super_admin' && currentUserRole !== 'super_admin' && 
                                      ((editingRole.role === 'moderator' && key === 'system_config'));
                     
                     return (
                       <div key={key} className={`flex items-start space-x-3 p-2 hover:bg-muted/30 rounded ${isDisabled ? 'opacity-50' : ''}`}>
                         <input
                           type="checkbox"
                           id={`edit-${key}`}
                           checked={value}
                           disabled={isDisabled}
                           onChange={(e) =>
                             setEditingRole(prev => prev ? {
                               ...prev,
                               permissions: {
                                 ...prev.permissions,
                                 [key]: e.target.checked
                               }
                             } : null)
                           }
                           className="mt-1 rounded border-gray-300"
                         />
                         <div className="flex-1">
                           <label htmlFor={`edit-${key}`} className={`text-sm font-medium cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}>
                             {permInfo.label}
                           </label>
                           {permInfo.desc && (
                             <p className="text-xs text-muted-foreground mt-0.5">{permInfo.desc}</p>
                           )}
                           {permInfo.restriction && (
                             <p className="text-xs text-orange-600 mt-0.5">{permInfo.restriction}</p>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={updateAdmin} disabled={currentUserRole !== 'super_admin' && editingRole?.role === 'super_admin'}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffManagement;