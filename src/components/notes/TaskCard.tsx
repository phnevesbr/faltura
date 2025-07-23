import React, { useState } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Trash2,
  Edit3,
  Plus,
  ChevronDown,
  ChevronRight,
  Flag,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';

interface TaskCardProps {
  note: any;
  onEdit: (note: any) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ note, onEdit, onDelete }) => {
  const { updateNote, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useNotes();
  const { shouldShowNotification } = useNotifications();
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  const typeIcons = {
    exam: BookOpen,
    assignment: FileText,
    activity: CheckCircle2
  };

  const typeColors = {
    exam: 'bg-red-100 text-red-800 border-red-200',
    assignment: 'bg-blue-100 text-blue-800 border-blue-200',
    activity: 'bg-green-100 text-green-800 border-green-200'
  };

  const typeLabels = {
    exam: 'Prova',
    assignment: 'Trabalho',
    activity: 'Atividade'
  };

  const priorityColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600'
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const statusLabels = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluída'
  };

  const Icon = typeIcons[note.type];

  const toggleComplete = () => {
    const newStatus = note.status === 'completed' ? 'pending' : 'completed';
    updateNote(note.id, { 
      completed: newStatus === 'completed',
      status: newStatus
    });
    
    if (shouldShowNotification('notes')) {
      toast.success(newStatus === 'completed' ? "📝 Tarefa concluída!" : "📝 Tarefa reaberta", {
        description: newStatus === 'completed' ? "Parabéns! Tarefa marcada como concluída." : "Tarefa marcada como pendente novamente.",
      });
    }
  };

  const toggleInProgress = () => {
    const newStatus = note.status === 'in_progress' ? 'pending' : 'in_progress';
    updateNote(note.id, { 
      status: newStatus,
      completed: false
    });
    toast.success(newStatus === 'in_progress' ? "Tarefa em andamento!" : "Tarefa marcada como pendente", {
      description: "Status atualizado com sucesso.",
    });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    
    addChecklistItem(note.id, newChecklistItem);
    setNewChecklistItem('');
    toast.success("Item adicionado!", {
      description: "Novo item adicionado à lista.",
    });
  };

  const toggleChecklistItem = (itemId: string, completed: boolean) => {
    updateChecklistItem(note.id, itemId, { completed: !completed });
  };

  const completedChecklist = note.checklist?.filter((item: any) => item.completed).length || 0;
  const totalChecklist = note.checklist?.length || 0;

  return (
    <Card className={`${note.status === 'completed' ? 'bg-muted/50 opacity-75' : 'bg-card'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <Icon className={`h-5 w-5 mt-0.5 ${note.status === 'completed' ? 'text-muted-foreground/60' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`font-medium ${note.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {note.title}
                </h3>
                <div className="flex items-center space-x-1">
                  <Badge className={typeColors[note.type]}>
                    {typeLabels[note.type]}
                  </Badge>
                  <Badge className={statusColors[note.status]}>
                    {statusLabels[note.status]}
                  </Badge>
                  <span className={`text-sm ${priorityColors[note.priority]}`}>
                    {priorityIcons[note.priority]}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(note.date), "dd/MM/yyyy")}
                </div>
                {totalChecklist > 0 && (
                  <div className="flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {completedChecklist}/{totalChecklist}
                  </div>
                )}
              </div>
              
              {note.description && (
                <p className={`text-sm mb-3 ${note.status === 'completed' ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                  {note.description}
                </p>
              )}

              {/* Checklist */}
              {totalChecklist > 0 && (
                <Collapsible open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-normal">
                      {isChecklistOpen ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                      Checklist ({completedChecklist}/{totalChecklist})
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="space-y-2 border rounded-lg p-2 bg-muted/30">
                      {note.checklist?.map((item: any) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(item.id, item.completed)}
                          />
                          <span className={`text-sm flex-1 ${item.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                            {item.text}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteChecklistItem(note.id, item.id)}
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      <form onSubmit={handleAddChecklistItem} className="flex space-x-2 mt-2">
                        <Input
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          placeholder="Adicionar item..."
                          className="text-sm h-8"
                        />
                        <Button type="submit" size="sm" className="h-8 px-2">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </form>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              
              {/* Add checklist button if no checklist exists */}
              {totalChecklist === 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-normal text-blue-600"
                  onClick={() => {
                    setIsChecklistOpen(true);
                    const tempInput = document.createElement('input');
                    addChecklistItem(note.id, 'Novo item');
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar checklist
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleInProgress}
              className="h-8 w-8 p-0"
              title={note.status === 'in_progress' ? 'Marcar como pendente' : 'Marcar como em andamento'}
            >
              <Clock className={`h-4 w-4 ${note.status === 'in_progress' ? 'text-blue-600' : 'text-muted-foreground/60'}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleComplete}
              className="h-8 w-8 p-0"
              title={note.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluída'}
            >
              <CheckCircle2 className={`h-4 w-4 ${note.status === 'completed' ? 'text-green-600' : 'text-muted-foreground/60'}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(note)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(note.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;