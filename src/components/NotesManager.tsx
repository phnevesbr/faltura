import React, { useState, useEffect } from 'react';
import { useNotes } from '../contexts/NotesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Clock, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Filter,
  CalendarRange,
  Calendar,
  ListFilter,
  CirclePlus,
  X,
  BookCheck,
  Star,
  Sparkles
} from 'lucide-react';
import { format, isToday, isFuture, isPast, isThisWeek, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import TaskFormModal from './notes/TaskFormModal';
import TaskCard from './notes/TaskCard';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import { ScrollArea } from './ui/scroll-area';

const NotesManager: React.FC = () => {
  const { notes, deleteNote, getUpcomingNotes, getTodayNotes, updateNote } = useNotes();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');

  const upcomingNotes = getUpcomingNotes();
  const todayNotes = getTodayNotes();

  // Calculate stats
  const pendingCount = notes.filter(n => n.status === 'pending').length;
  const inProgressCount = notes.filter(n => n.status === 'in_progress').length;
  const completedCount = notes.filter(n => n.status === 'completed').length;
  const totalCount = notes.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate weekly upcoming tasks
  const thisWeekTasks = notes.filter(note => {
    const noteDate = new Date(note.date);
    return isFuture(noteDate) && isThisWeek(noteDate);
  });

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

  const statusLabels = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluída'
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    toast.success("Tarefa removida", {
      description: "A tarefa foi removida com sucesso.",
    });
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  // Filter and sort notes based on active tab and filters
  const getFilteredNotes = () => {
    let filteredList = [...notes];
    
    // Apply tab filter
    if (activeTab === 'today') {
      filteredList = filteredList.filter(note => isToday(new Date(note.date)));
    } else if (activeTab === 'upcoming') {
      filteredList = filteredList.filter(note => {
        const noteDate = new Date(note.date);
        return isFuture(noteDate) && !isToday(noteDate);
      });
    } else if (activeTab === 'completed') {
      filteredList = filteredList.filter(note => note.status === 'completed');
    } else if (activeTab === 'pending') {
      filteredList = filteredList.filter(note => note.status === 'pending');
    } else if (activeTab === 'in_progress') {
      filteredList = filteredList.filter(note => note.status === 'in_progress');
    }
    
    // Apply additional filters
    if (filterStatus !== 'all') {
      filteredList = filteredList.filter(note => note.status === filterStatus);
    }
    
    if (filterPriority !== 'all') {
      filteredList = filteredList.filter(note => note.priority === filterPriority);
    }
    
    if (filterType !== 'all') {
      filteredList = filteredList.filter(note => note.type === filterType);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredList = filteredList.filter(note => 
        note.title.toLowerCase().includes(query) || 
        (note.description && note.description.toLowerCase().includes(query))
      );
    }
    
    // Sort notes
    return filteredList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // First sort by status (completed last)
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Then sort by date
      if (isToday(dateA) && !isToday(dateB)) return -1;
      if (!isToday(dateA) && isToday(dateB)) return 1;
      
      if (isFuture(dateA) && isPast(dateB)) return -1;
      if (isPast(dateA) && isFuture(dateB)) return 1;
      
      // Sort by priority if dates are equal
      if (dateA.getTime() === dateB.getTime()) {
        const priorityWeight = { high: 0, medium: 1, low: 2 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }
      
      // Otherwise sort by date (closest first for future, most recent first for past)
      if (isFuture(dateA) && isFuture(dateB)) {
        return dateA.getTime() - dateB.getTime(); 
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
  };

  const filteredNotes = getFilteredNotes();
  
  // Task urgency calculation for upcoming tasks
  const getUrgencyClass = (date: string) => {
    const taskDate = new Date(date);
    const daysLeft = differenceInDays(taskDate, new Date());
    
    if (isToday(taskDate)) return "text-orange-600 dark:text-orange-400 font-medium";
    if (daysLeft <= 2) return "text-red-600 dark:text-red-400 font-medium";
    if (daysLeft <= 5) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  // Progress based on completion status
  const getProgressPercentage = () => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  };

  // Group tasks by due date (for calendar view)
  const groupTasksByDate = () => {
    const groupedTasks: {[key: string]: any[]} = {};
    
    notes.forEach(note => {
      const dateKey = format(new Date(note.date), 'yyyy-MM-dd');
      if (!groupedTasks[dateKey]) {
        groupedTasks[dateKey] = [];
      }
      groupedTasks[dateKey].push(note);
    });
    
    return groupedTasks;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Anotações & Tarefas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas provas, trabalhos e atividades com facilidade
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Input
              placeholder="Buscar tarefa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 w-full lg:w-64"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full aspect-square"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingNote(null);
            }}
            variant="default"
            className="flex-shrink-0 gap-2 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Nova Tarefa</span>
            <span className="md:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-t-4 border-t-primary/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Tarefas</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            <Progress 
              value={getProgressPercentage()} 
              className="h-1.5 mt-3" 
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {getProgressPercentage()}% concluído
            </p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-t-4 border-t-muted">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
              {pendingCount > 0 ? 
                `${Math.round((pendingCount / totalCount) * 100)}% das tarefas` : 
                'Nenhuma tarefa pendente 🎉'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-t-4 border-t-blue-400 dark:border-t-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
              {inProgressCount > 0 ? 
                `${Math.round((inProgressCount / totalCount) * 100)}% das tarefas` : 
                'Nenhuma tarefa em progresso'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-t-4 border-t-green-400 dark:border-t-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
              {completedCount > 0 ? 
                `${Math.round((completedCount / totalCount) * 100)}% das tarefas` : 
                'Nenhuma tarefa concluída'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas para hoje */}
      {todayNotes.length > 0 && (
        <Card className="border-l-4 border-l-orange-400 dark:border-l-orange-600 bg-orange-50/30 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center text-lg gap-2">
              <AlertTriangle className="h-5 w-5" />
              Para Hoje ({todayNotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className={todayNotes.length > 3 ? "h-[180px]" : "h-auto"}>
              <div className="space-y-2 pr-4">
                {todayNotes.map(note => {
                  const Icon = typeIcons[note.type];
                  return (
                    <div key={note.id} className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm border border-orange-100 dark:border-orange-800 hover:border-orange-200 dark:hover:border-orange-700 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-orange-100 dark:bg-orange-900/50">
                          <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-foreground truncate">{note.title}</p>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <span>{typeLabels[note.type]}</span>
                            <span>•</span>
                            <span>
                              {note.priority === 'high' ? '🔴 Alta' : note.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                          onClick={() => updateNote(note.id, { status: 'completed', completed: true })}
                        >
                          <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                          onClick={() => handleEdit(note)}
                        >
                          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs and List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 h-9">
                <TabsTrigger value="all" className="text-xs md:text-sm">Tudo</TabsTrigger>
                <TabsTrigger value="today" className="text-xs md:text-sm">Hoje</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs md:text-sm">Próximas</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs md:text-sm">Pendentes</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs md:text-sm">Concluídas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Filtrar por tipo</SelectLabel>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="exam">Provas</SelectItem>
                  <SelectItem value="assignment">Trabalhos</SelectItem>
                  <SelectItem value="activity">Atividades</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Filtrar por prioridade</SelectLabel>
                  <SelectItem value="all">Todas Prioridades</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {activeTab === 'all' && (
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Filtrar por status</SelectLabel>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            
            {(filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all' || searchQuery) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-3 text-sm flex gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFilterType('all');
                  setFilterPriority('all');
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            )}
          </div>
          
          {/* Task List */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted/30 mx-auto rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                {searchQuery ? (
                  <ListFilter className="h-8 w-8 text-muted-foreground" />
                ) : activeTab === 'completed' ? (
                  <BookCheck className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <CirclePlus className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma tarefa disponível'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery 
                  ? 'Tente ajustar os termos de busca ou remover os filtros aplicados.' 
                  : notes.length === 0 
                    ? 'Clique no botão "Nova Tarefa" para começar a criar suas tarefas.' 
                    : 'Não há tarefas correspondentes aos filtros selecionados.'
                }
              </p>
              {notes.length === 0 && (
                <Button
                  onClick={() => {
                    setShowForm(true);
                    setEditingNote(null);
                  }}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira tarefa
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className={filteredNotes.length > 5 ? "h-[480px]" : "h-auto"}>
              <div className="space-y-4 pr-4">
                {filteredNotes.map(note => (
                  <TaskCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        
        {filteredNotes.length > 0 && (
          <CardFooter className="pt-2 pb-4 px-6 flex justify-between text-sm text-muted-foreground border-t">
            <div>
              Mostrando {filteredNotes.length} de {notes.length} tarefas
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Atualizado em tempo real</span>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Task Form Modal */}
      <TaskFormModal
        open={showForm}
        onOpenChange={setShowForm}
        editingNote={editingNote}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default NotesManager;
