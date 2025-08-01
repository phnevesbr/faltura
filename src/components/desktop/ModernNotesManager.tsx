// Use the ultra modern version by default
import React, { useState, useEffect } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Plus, 
  Search,
  Filter,
  Calendar,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  Sparkles,
  TrendingUp,
  PieChart,
  BarChart3,
  Target,
  Zap,
  Timer,
  ArrowRight,
  SortDesc,
  Grid3X3,
  List
} from 'lucide-react';
import { format, isToday, isFuture, isPast, isThisWeek, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import TaskFormModal from '../notes/TaskFormModal';
import TaskCard from '../notes/TaskCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const LegacyModernNotesManager: React.FC = () => {
  const { notes, deleteNote, getUpcomingNotes, getTodayNotes, updateNote } = useNotes();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const upcomingNotes = getUpcomingNotes();
  const todayNotes = getTodayNotes();

  // Calculate comprehensive stats
  const pendingCount = notes.filter(n => n.status === 'pending').length;
  const inProgressCount = notes.filter(n => n.status === 'in_progress').length;
  const completedCount = notes.filter(n => n.status === 'completed').length;
  const totalCount = notes.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate priority distribution
  const highPriorityCount = notes.filter(n => n.priority === 'high' && n.status !== 'completed').length;
  const mediumPriorityCount = notes.filter(n => n.priority === 'medium' && n.status !== 'completed').length;
  const lowPriorityCount = notes.filter(n => n.priority === 'low' && n.status !== 'completed').length;

  // Calculate type distribution
  const examCount = notes.filter(n => n.type === 'exam').length;
  const assignmentCount = notes.filter(n => n.type === 'assignment').length;
  const activityCount = notes.filter(n => n.type === 'activity').length;

  // Weekly progress
  const thisWeekTasks = notes.filter(note => {
    const noteDate = new Date(note.date);
    return isFuture(noteDate) && isThisWeek(noteDate);
  });

  const overdueTasks = notes.filter(note => {
    const noteDate = new Date(note.date);
    return isPast(noteDate) && !isToday(noteDate) && note.status !== 'completed';
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

  // Filter and sort notes
  const getFilteredNotes = () => {
    let filteredList = [...notes];
    
    // Apply filters
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
    
    return filteredList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      if (isToday(dateA) && !isToday(dateB)) return -1;
      if (!isToday(dateA) && isToday(dateB)) return 1;
      
      if (isFuture(dateA) && isPast(dateB)) return -1;
      if (isPast(dateA) && isFuture(dateB)) return 1;
      
      if (dateA.getTime() === dateB.getTime()) {
        const priorityWeight = { high: 0, medium: 1, low: 2 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }
      
      if (isFuture(dateA) && isFuture(dateB)) {
        return dateA.getTime() - dateB.getTime(); 
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
  };

  const filteredNotes = getFilteredNotes();

  const getUrgencyBadge = (date: string) => {
    const taskDate = new Date(date);
    const daysLeft = differenceInDays(taskDate, new Date());
    
    if (isToday(taskDate)) return { label: 'Hoje', color: 'bg-orange-500', text: 'text-white' };
    if (daysLeft <= 2) return { label: `${daysLeft}d`, color: 'bg-red-500', text: 'text-white' };
    if (daysLeft <= 5) return { label: `${daysLeft}d`, color: 'bg-amber-500', text: 'text-white' };
    return { label: `${daysLeft}d`, color: 'bg-emerald-500', text: 'text-white' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  Notas & Tarefas
                </h1>
                <p className="text-blue-100 text-lg">
                  Organize seus estudos com inteligência e estilo
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    <span className="text-sm">{completionRate.toFixed(0)}% concluído</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm">{highPriorityCount} alta prioridade</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-white/20 border-white/30 text-white placeholder:text-blue-100 focus:bg-white/30"
                  />
                </div>
                
                <Button
                  onClick={() => {
                    setShowForm(true);
                    setEditingNote(null);
                  }}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg gap-2 font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Nova Tarefa
                </Button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl"></div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 p-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
            <TabsTrigger value="overview" className="rounded-xl text-sm font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <PieChart className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="today" className="rounded-xl text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <Timer className="h-4 w-4 mr-2" />
              Hoje ({todayNotes.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-xl text-sm font-medium data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <Calendar className="h-4 w-4 mr-2" />
              Próximas ({upcomingNotes.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl text-sm font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <List className="h-4 w-4 mr-2" />
              Todas ({notes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total de Tarefas</p>
                      <p className="text-3xl font-bold mt-1">{totalCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={completionRate} className="h-2 bg-blue-400/30" />
                    <p className="text-xs text-blue-100 mt-2">{completionRate.toFixed(0)}% concluído</p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Pendentes</p>
                      <p className="text-3xl font-bold mt-1">{pendingCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-orange-100">
                      {pendingCount > 0 ? `${((pendingCount / totalCount) * 100).toFixed(0)}% do total` : 'Tudo em dia! 🎉'}
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Concluídas</p>
                      <p className="text-3xl font-bold mt-1">{completedCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-emerald-100">
                      {completedCount > 0 ? `${((completedCount / totalCount) * 100).toFixed(0)}% do total` : 'Vamos começar!'}
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Esta Semana</p>
                      <p className="text-3xl font-bold mt-1">{thisWeekTasks.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-purple-100">
                      {thisWeekTasks.length === 0 ? 'Semana tranquila' : 'Foque no que importa'}
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>
            </div>

            {/* Quick Actions & Priority Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Distribution */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Distribuição por Prioridade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="font-medium text-red-700 dark:text-red-300">Alta Prioridade</span>
                      </div>
                      <span className="font-bold text-red-600 dark:text-red-400">{highPriorityCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                        <span className="font-medium text-amber-700 dark:text-amber-300">Média Prioridade</span>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{mediumPriorityCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium text-green-700 dark:text-green-300">Baixa Prioridade</span>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400">{lowPriorityCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Type Distribution */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Tipos de Tarefa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-700 dark:text-blue-300">Provas</span>
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{examCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-700 dark:text-purple-300">Trabalhos</span>
                      </div>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{assignmentCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">Atividades</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{activityCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Tasks Alert */}
            {todayNotes.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="h-5 w-5" />
                    Tarefas para Hoje ({todayNotes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {todayNotes.slice(0, 3).map(note => {
                      const Icon = typeIcons[note.type];
                      return (
                        <div key={note.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-orange-100 dark:border-orange-800">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{note.title}</p>
                              <p className="text-sm text-muted-foreground">{typeLabels[note.type]}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateNote(note.id, { status: 'completed', completed: true })}
                              className="border-orange-300 hover:bg-orange-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEdit(note)}
                              className="border-orange-300 hover:bg-orange-50"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {todayNotes.length > 3 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setActiveTab('today')}
                        className="w-full mt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        Ver todas as {todayNotes.length} tarefas de hoje
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="today" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tarefas para Hoje</h2>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {todayNotes.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20">
                <CardContent className="p-12 text-center">
                  <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Dia livre! 🎉</h3>
                  <p className="text-emerald-600 dark:text-emerald-400">Você não tem tarefas para hoje. Que tal planejar o amanhã?</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {todayNotes.map(note => (
                  <TaskCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Próximas Tarefas</h2>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {upcomingNotes.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardContent className="p-12 text-center">
                  <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Agenda em dia!</h3>
                  <p className="text-blue-600 dark:text-blue-400">Não há tarefas futuras agendadas no momento.</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {upcomingNotes.map(note => (
                <TaskCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6 mt-6">
            {/* Filters */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtros:</span>
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluídas</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Tipos</SelectItem>
                      <SelectItem value="exam">Provas</SelectItem>
                      <SelectItem value="assignment">Trabalhos</SelectItem>
                      <SelectItem value="activity">Atividades</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Grid/List */}
            {filteredNotes.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                    {searchQuery ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa ainda'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Tente ajustar os filtros ou busca' : 'Comece criando sua primeira tarefa'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredNotes.map(note => (
                <TaskCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Task Form Modal */}
        <TaskFormModal
          open={showForm}
          onOpenChange={setShowForm}
          editingNote={editingNote}
          onSuccess={handleFormSuccess}
        />
      </div>
    </div>
  );
};

// Export the ultra modern version instead
import UltraModernNotesManager from './UltraModernNotesManager';
export default UltraModernNotesManager;