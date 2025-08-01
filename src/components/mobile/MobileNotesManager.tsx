import React, { useState } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { MobileNoteCard } from './MobileNoteCard';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  Edit3,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../../hooks/use-toast';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

const MobileNotesManager: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote, getUpcomingNotes, getTodayNotes } = useNotes();
  const { toast } = useToast();
  const { shouldShowNotification } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    type: 'exam' as 'exam' | 'assignment' | 'activity'
  });

  const upcomingNotes = getUpcomingNotes();
  const todayNotes = getTodayNotes();

  const typeLabels = {
    exam: 'Prova',
    assignment: 'Trabalho',
    activity: 'Atividade'
  };

  const typeIcons = {
    exam: BookOpen,
    assignment: FileText,
    activity: CheckCircle2
  };

  const typeColors = {
    exam: 'bg-red-500',
    assignment: 'bg-blue-500',
    activity: 'bg-green-500'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título.",
        variant: "destructive",
      });
      return;
    }

    if (editingNote) {
      updateNote(editingNote, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        type: formData.type
      });
      toast({ title: "Anotação atualizada!" });
      setEditingNote(null);
    } else {
      addNote({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        type: formData.type,
        completed: false
      });
      toast({ title: "Anotação criada!" });
    }

    setFormData({
      title: '',
      description: '',
      date: new Date(),
      type: 'exam'
    });
    setShowForm(false);
  };

  const handleEdit = (note: any) => {
    setFormData({
      title: note.title,
      description: note.description,
      date: new Date(note.date),
      type: note.type
    });
    setEditingNote(note.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    toast({ title: "Anotação removida" });
  };

  const toggleComplete = (id: string, completed: boolean) => {
    const newCompleted = !completed;
    const newStatus = newCompleted ? 'completed' : 'pending';
    
    updateNote(id, { 
      completed: newCompleted,
      status: newStatus
    });
    
    if (shouldShowNotification('notes')) {
      toast({
        title: newCompleted ? "📝 Tarefa concluída!" : "📝 Tarefa reaberta",
        description: newCompleted ? "Parabéns! Tarefa marcada como concluída." : "Tarefa marcada como pendente novamente."
      });
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Anotações</h1>
          <p className="text-sm text-muted-foreground">{notes.length} total</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Editar Anotação' : 'Nova Anotação'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da anotação"
                  className="text-base"
                />
              </div>

              <div>
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

              <div>
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
                  <PopoverContent className="w-auto p-0" align="start">
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

              <div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição (opcional)"
                  rows={3}
                  className="text-base resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingNote ? 'Salvar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas para hoje */}
      {todayNotes.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">Hoje</h3>
            </div>
            <div className="space-y-2">
              {todayNotes.map(note => {
                const Icon = typeIcons[note.type];
                return (
                  <div key={note.id} className="flex items-center justify-between p-2 bg-card border border-border rounded">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{note.title}</p>
                        <p className="text-xs text-muted-foreground">{typeLabels[note.type]}</p>
                      </div>
                    </div>
                    <Badge className={`${typeColors[note.type]} text-white border-none text-xs`}>
                      {typeLabels[note.type]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos */}
      {upcomingNotes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="font-semibold text-foreground">Próximos 7 dias</h3>
            </div>
            <div className="space-y-2">
              {upcomingNotes.map(note => {
                const Icon = typeIcons[note.type];
                return (
                  <div key={note.id} className="flex items-center justify-between p-2 bg-card border border-border rounded">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{note.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.date), "dd/MM")}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${typeColors[note.type]} text-white border-none text-xs`}>
                      {typeLabels[note.type]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista completa */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Todas as anotações</h3>
          
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma anotação criada</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowForm(true)}
                className="mt-2 text-primary"
              >
                Criar primeira anotação
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {notes.sort((a, b) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                
                // Tarefas futuras primeiro (mais próximas primeiro)
                const aIsFuture = dateA >= today;
                const bIsFuture = dateB >= today;
                
                if (aIsFuture && !bIsFuture) return -1;
                if (!aIsFuture && bIsFuture) return 1;
                
                if (aIsFuture && bIsFuture) {
                  return dateA.getTime() - dateB.getTime(); // Futuras: mais próximas primeiro
                } else {
                  return dateB.getTime() - dateA.getTime(); // Passadas: mais recentes primeiro
                }
              }).map(note => (
                <MobileNoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleComplete={toggleComplete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileNotesManager;