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
  Search, 
  Users, 
  Calendar,
  AlertTriangle,
  Edit3,
  Trash2,
  Bell,
  Settings as SettingsIcon
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import ClassEditDialog from './ClassEditDialog';

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

const AdminClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      
      // Get classes with leader info
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          leader_id,
          max_members,
          created_at
        `);

      if (classesError) throw classesError;

      // Get leader emails
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email');

      if (profilesError) throw profilesError;

      // Get member counts
      const { data: memberCounts, error: memberCountsError } = await supabase
        .from('class_members')
        .select('class_id');

      if (memberCountsError) throw memberCountsError;

      // Get notification counts
      const { data: notifications, error: notificationsError } = await supabase
        .from('absence_notifications')
        .select('class_id, content_sent');

      if (notificationsError) throw notificationsError;

      // Combine data
      const combinedClasses = classesData.map(classItem => {
        const leader = profiles.find(p => p.user_id === classItem.leader_id);
        const memberCount = memberCounts.filter(m => m.class_id === classItem.id).length;
        const classNotifications = notifications.filter(n => n.class_id === classItem.id);
        const pendingNotifications = classNotifications.filter(n => !n.content_sent).length;

        return {
          ...classItem,
          leader_email: leader?.email || 'Email não encontrado',
          member_count: memberCount,
          pending_notifications: pendingNotifications,
          total_notifications: classNotifications.length
        };
      });

      setClasses(combinedClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  };

  const handleClearNotifications = async (classId: string, type: 'old' | 'all') => {
    try {
      const functionName = type === 'all' ? 'clear_all_absence_notifications' : 'clear_old_absence_notifications';
      
      const { data, error } = await supabase.rpc(functionName, {
        class_id_param: classId,
        ...(type === 'old' && { days_old: 30 })
      });

      if (error) throw error;

      toast.success(`${data} notificações removidas com sucesso`);
      loadClasses();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Erro ao limpar notificações');
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.leader_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando turmas...</p>
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
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>Gestão de Turmas</span>
          </CardTitle>
          <CardDescription>
            Monitore e gerencie turmas com controles avançados de moderação e edição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar turmas por nome ou líder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Classes Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Notificações</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{classItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Max: {classItem.max_members} membros
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{classItem.leader_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{classItem.member_count}/{classItem.max_members}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{classItem.total_notifications} total</span>
                        </div>
                        {classItem.pending_notifications > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {classItem.pending_notifications} pendentes
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(classItem.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedClass(classItem);
                            setEditDialogOpen(true);
                          }}
                          title="Editar turma"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {classItem.total_notifications > 0 && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleClearNotifications(classItem.id, 'old')}
                              title="Limpar notificações antigas"
                            >
                              Limpar Antigas
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleClearNotifications(classItem.id, 'all')}
                              title="Limpar todas as notificações"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClasses.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar o termo de busca' : 'Ainda não há turmas criadas'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class Edit Dialog */}
      <ClassEditDialog
        classData={selectedClass}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onClassUpdated={loadClasses}
      />
    </div>
  );
};

export default AdminClassManagement;