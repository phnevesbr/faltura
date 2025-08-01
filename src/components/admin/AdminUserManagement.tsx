import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Edit3, 
  MoreHorizontal,
  Shield,
  Trophy,
  Calendar,
  Ban,
  Eye,
  Settings,
  Users as UsersIcon
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import UserEditDialog from './UserEditDialog';

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

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [banDuration, setBanDuration] = useState('7');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterTier]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get users with their profiles and levels
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          course,
          university,
          shift,
          avatar,
          created_at,
          semester_start,
          semester_end
        `);

      if (profilesError) throw profilesError;

      // Get user levels
      const { data: levels, error: levelsError } = await supabase
        .from('user_levels')
        .select('user_id, level, total_experience, current_tier');

      if (levelsError) throw levelsError;

      // Get banned users
      const { data: bans, error: bansError } = await supabase
        .from('user_bans')
        .select('user_id, reason, is_active')
        .eq('is_active', true);

      if (bansError) throw bansError;

      // Combine data
      const combinedUsers = profiles.map(profile => {
        const userLevel = levels.find(l => l.user_id === profile.user_id) || {
          level: 1,
          total_experience: 0,
          current_tier: 'calouro'
        };
        
        const userBan = bans.find(b => b.user_id === profile.user_id);
        
        return {
          ...profile,
          ...userLevel,
          is_banned: !!userBan,
          ban_reason: userBan?.reason
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.university?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tier
    if (filterTier !== 'all') {
      if (filterTier === 'banned') {
        filtered = filtered.filter(user => user.is_banned);
      } else {
        filtered = filtered.filter(user => user.current_tier === filterTier);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Motivo do banimento é obrigatório');
      return;
    }

    try {
      const expiresAt = banType === 'permanent' ? null : 
        new Date(Date.now() + parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: selectedUser.user_id,
          reason: banReason,
          ban_type: banType,
          expires_at: expiresAt,
          banned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Usuário banido com sucesso');
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Erro ao banir usuário');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_bans')
        .update({ 
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      toast.success('Usuário desbanido com sucesso');
      loadUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Erro ao desbanir usuário');
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      aprendiz: 'bg-green-100 text-green-800',
      confiavel: 'bg-blue-100 text-blue-800',
      exemplar: 'bg-purple-100 text-purple-800',
      veterano: 'bg-orange-100 text-orange-800',
      mestre: 'bg-red-100 text-red-800',
      lenda: 'bg-yellow-100 text-yellow-800',
      // Mantém compatibilidade com sistema antigo
      calouro: 'bg-gray-100 text-gray-800',
      expert: 'bg-purple-100 text-purple-800'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UsersIcon className="h-5 w-5 text-primary" />
            </div>
            <span>Gestão de Usuários</span>
          </CardTitle>
          <CardDescription>
            Gerencie todos os usuários da plataforma com controles avançados de edição e moderação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, curso ou universidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tiers</SelectItem>
                <SelectItem value="aprendiz">Aprendiz</SelectItem>
                <SelectItem value="confiavel">Confiável</SelectItem>
                <SelectItem value="exemplar">Exemplar</SelectItem>
                <SelectItem value="veterano">Veterano</SelectItem>
                <SelectItem value="mestre">Mestre</SelectItem>
                <SelectItem value="lenda">Lenda</SelectItem>
                <SelectItem value="banned">Banidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.university}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.course || 'Não informado'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{user.level}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{user.total_experience.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(user.current_tier)}>
                        {user.current_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">
                          <UserX className="h-3 w-3 mr-1" />
                          Banido
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditDialogOpen(true);
                          }}
                          title="Editar usuário"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {user.is_banned ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUnbanUser(user.user_id)}
                            title="Desbanir usuário"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setBanDialogOpen(true);
                            }}
                            title="Banir usuário"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros de busca
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Edit Dialog */}
      <UserEditDialog
        user={selectedUser}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onUserUpdated={loadUsers}
      />

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a banir {selectedUser?.email}. Esta ação impedirá o acesso do usuário à plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Banimento</label>
              <Select value={banType} onValueChange={(value: 'temporary' | 'permanent') => setBanType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporário</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {banType === 'temporary' && (
              <div>
                <label className="text-sm font-medium">Duração (dias)</label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Motivo do Banimento *</label>
              <Textarea
                placeholder="Descreva o motivo do banimento..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              Banir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;