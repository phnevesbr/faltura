import React, { useState } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';
import { useSystemLimits } from '../../hooks/useSystemLimits';
import { cn } from '../../lib/utils';

interface TaskFormProps {
  editingNote?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ editingNote, onClose, onSuccess }) => {
  const { addNote, updateNote } = useNotes();
  const { shouldShowNotification } = useNotifications();
  const { user } = useAuth();
  const { checkTaskLimit } = useSystemLimits();
  const [formData, setFormData] = useState({
    title: editingNote?.title || '',
    description: editingNote?.description || '',
    date: editingNote?.date ? new Date(editingNote.date) : new Date(),
    type: editingNote?.type || 'assignment' as 'exam' | 'assignment' | 'activity',
    priority: editingNote?.priority || 'medium' as 'low' | 'medium' | 'high',
    status: editingNote?.status || 'pending' as 'pending' | 'in-progress' | 'completed'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Por favor, adicione um título para a tarefa.");
      return;
    }

    // Verificar limite apenas para novas tarefas
    if (!editingNote && user) {
      const limitCheck = await checkTaskLimit(user.id);
      if (!limitCheck.canAdd) {
        toast.error(`Limite de tarefas excedido!`, {
          description: `Você já tem ${limitCheck.currentCount} tarefas. Limite máximo: ${limitCheck.limit}`,
        });
        return;
      }
    }

    if (editingNote) {
      updateNote(editingNote.id, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        type: formData.type,
        priority: formData.priority,
        status: formData.status
      });
      if (shouldShowNotification('notes')) {
        toast.success("📝 Tarefa atualizada!", {
          description: "Sua tarefa foi atualizada com sucesso.",
        });
      }
    } else {
      addNote({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        completed: formData.status === 'completed',
        checklist: []
      });
      if (shouldShowNotification('notes')) {
        toast.success("📝 Tarefa criada!", {
          description: "Nova tarefa adicionada com sucesso.",
        });
      }
    }

    onSuccess();
  };

  const priorityColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600', 
    high: 'text-red-600'
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  };

  const statusLabels = {
    pending: 'Pendente',
    'in-progress': 'Em Andamento',
    completed: 'Concluída'
  };

  const typeLabels = {
    exam: 'Prova',
    assignment: 'Trabalho',
    activity: 'Atividade'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          {editingNote ? 'Editar Tarefa' : 'Nova Tarefa'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Projeto de História"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">📚 Prova</SelectItem>
                  <SelectItem value="assignment">📄 Trabalho</SelectItem>
                  <SelectItem value="activity">✅ Atividade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pendente</SelectItem>
                  <SelectItem value="in-progress">🔄 Em Andamento</SelectItem>
                  <SelectItem value="completed">✅ Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes adicionais sobre a tarefa..."
              rows={4}
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingNote ? 'Atualizar' : 'Criar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;