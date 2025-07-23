import React, { useState } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';
import { useSystemLimits } from '../../hooks/useSystemLimits';
import { cn } from '../../lib/utils';

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNote?: any;
  onSuccess: () => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ open, onOpenChange, editingNote, onSuccess }) => {
  const { addNote, updateNote } = useNotes();
  const { shouldShowNotification } = useNotifications();
  const { user } = useAuth();
  const { checkTaskLimit } = useSystemLimits();
  
  const [formData, setFormData] = useState({
    title: editingNote?.title || '',
    description: editingNote?.description || '',
    date: editingNote?.date ? new Date(editingNote.date) : new Date(),
    type: editingNote?.type || 'assignment' as 'exam' | 'assignment' | 'activity',
    status: editingNote?.status || 'pending' as 'pending' | 'in-progress' | 'completed'
  });

  // Calculate automatic priority based on date
  const calculatePriority = (date: Date) => {
    const today = new Date();
    const daysUntilDue = differenceInDays(date, today);
    
    if (daysUntilDue < -7) return 'high'; // Past due by more than 7 days
    if (daysUntilDue <= 7) return 'high'; // Due in 7 days or less (or overdue)
    if (daysUntilDue <= 30) return 'medium'; // Due in 8-30 days
    return 'low'; // Due in more than 30 days
  };

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

    const priority = calculatePriority(formData.date);

    if (editingNote) {
      updateNote(editingNote.id, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        type: formData.type,
        priority: priority,
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
        priority: priority,
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
    onOpenChange(false);
  };

  const typeLabels = {
    exam: 'Prova',
    assignment: 'Trabalho',
    activity: 'Atividade'
  };

  const statusLabels = {
    pending: 'Pendente',
    'in-progress': 'Em Andamento',
    completed: 'Concluída'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[425px] max-h-[85vh] mx-auto flex flex-col p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingNote ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="space-y-3 h-full flex flex-col">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Projeto de História"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais sobre a tarefa..."
                  rows={3}
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>🎯 Prioridade automática:</strong> A prioridade será calculada automaticamente baseada na data de entrega.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t">
              <Button type="submit" className="w-full h-12">
                {editingNote ? 'Atualizar' : 'Criar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-12"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormModal;