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
  List,
  Flame,
  Award,
  Brain,
  Rocket,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  PlayCircle
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
import { Separator } from '../ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const UltraModernNotesManager: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-8 space-y-10">
        {/* Ultra Modern Hero Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-10 text-white shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          
          {/* Floating Orbs */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-500/30 blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tight">
                      Estudo <span className="text-white/80">Inteligente</span>
                    </h1>
                    <p className="text-purple-100 text-xl font-medium">
                      Transforme sua organização acadêmica
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Target className="h-5 w-5 text-emerald-300" />
                    <span className="text-sm font-semibold">{completionRate.toFixed(0)}% concluído</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Flame className="h-5 w-5 text-orange-300" />
                    <span className="text-sm font-semibold">{highPriorityCount} urgentes</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Rocket className="h-5 w-5 text-blue-300" />
                    <span className="text-sm font-semibold">{thisWeekTasks.length} esta semana</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    placeholder="Buscar suas tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 w-full sm:w-80 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-2xl text-base"
                  />
                </div>
                
                <Button
                  onClick={() => {
                    setShowForm(true);
                    setEditingNote(null);
                  }}
                  size="lg"
                  className="h-12 bg-white text-purple-600 hover:bg-white/90 shadow-xl gap-3 font-bold rounded-2xl px-8"
                >
                  <Plus className="h-5 w-5" />
                  Nova Tarefa
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra Modern Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="h-14 p-1.5 bg-card/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/20">
              <TabsTrigger 
                value="overview" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <PieChart className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="today" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <Timer className="h-4 w-4 mr-2" />
                Hoje ({todayNotes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Próximas ({upcomingNotes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="h-11 px-6 rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <List className="h-4 w-4 mr-2" />
                Todas ({notes.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-xl"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-xl"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-8 mt-0">
            {/* Ultra Modern Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-sm font-medium">Total de Tarefas</p>
                      <p className="text-4xl font-black mt-1">{totalCount}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Progress value={completionRate} className="h-2 bg-blue-400/30" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-100">{completionRate.toFixed(0)}% concluído</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-blue-100">+{completedCount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-orange-100 text-sm font-medium">Pendentes</p>
                      <p className="text-4xl font-black mt-1">{pendingCount}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-orange-400/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/40 rounded-full transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (pendingCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-sm text-orange-100">
                      {pendingCount > 0 ? `${((pendingCount / totalCount) * 100).toFixed(0)}% do total` : 'Tudo em dia! 🎉'}
                    </p>
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-100 text-sm font-medium">Concluídas</p>
                      <p className="text-4xl font-black mt-1">{completedCount}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-emerald-400/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/40 rounded-full transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-100">
                        {completedCount > 0 ? `${((completedCount / totalCount) * 100).toFixed(0)}% do total` : 'Vamos começar!'}
                      </span>
                      <Award className="h-4 w-4 text-emerald-200" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-purple-100 text-sm font-medium">Esta Semana</p>
                      <p className="text-4xl font-black mt-1">{thisWeekTasks.length}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-200" />
                      <span className="text-sm text-purple-100">
                        {thisWeekTasks.length === 0 ? 'Semana tranquila' : 'Foque no que importa'}
                      </span>
                    </div>
                    {overdueTasks.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-purple-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{overdueTasks.length} em atraso</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
              </Card>
            </div>

            {/* Priority & Type Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Priority Distribution */}
              <Card className="border-0 shadow-xl bg-card/70 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    Distribuição por Prioridade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-100 dark:border-red-800/30">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500"></div>
                        <span className="font-semibold text-red-700 dark:text-red-300">Alta Prioridade</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-2xl text-red-600 dark:text-red-400">{highPriorityCount}</span>
                        {highPriorityCount > 0 && <Flame className="h-5 w-5 text-red-500" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-800/30">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                        <span className="font-semibold text-amber-700 dark:text-amber-300">Média Prioridade</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-2xl text-amber-600 dark:text-amber-400">{mediumPriorityCount}</span>
                        {mediumPriorityCount > 0 && <Star className="h-5 w-5 text-amber-500" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-100 dark:border-green-800/30">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                        <span className="font-semibold text-green-700 dark:text-green-300">Baixa Prioridade</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-2xl text-green-600 dark:text-green-400">{lowPriorityCount}</span>
                        {lowPriorityCount > 0 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Type Distribution */}
              <Card className="border-0 shadow-xl bg-card/70 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    Tipos de Tarefa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center gap-4">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Provas</span>
                      </div>
                      <span className="font-black text-2xl text-blue-600 dark:text-blue-400">{examCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-center gap-4">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <span className="font-semibold text-purple-700 dark:text-purple-300">Trabalhos</span>
                      </div>
                      <span className="font-black text-2xl text-purple-600 dark:text-purple-400">{assignmentCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">Atividades</span>
                      </div>
                      <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">{activityCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="today" className="space-y-8 mt-0">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-pink-950/20 border border-orange-200 dark:border-orange-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-orange-700 dark:text-orange-300">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Timer className="h-6 w-6 text-white" />
                  </div>
                  Tarefas para Hoje ({todayNotes.length})
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-400 text-base">
                  Foque no que é importante agora
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">Perfeito!</h3>
                    <p className="text-emerald-600 dark:text-emerald-400">Nenhuma tarefa para hoje. Aproveite seu tempo livre!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-8 mt-0">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border border-emerald-200 dark:border-emerald-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  Tarefas Próximas ({upcomingNotes.length})
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400 text-base">
                  Planeje-se para os próximos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">Agenda Livre</h3>
                    <p className="text-blue-600 dark:text-blue-400">Nenhuma tarefa programada para os próximos dias.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-8 mt-0">
            {/* Filters */}
            <Card className="border-0 shadow-xl bg-card/70 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48 h-11 rounded-xl border-border bg-card/80">
                      <SelectValue placeholder="Tipo de tarefa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="exam">Provas</SelectItem>
                      <SelectItem value="assignment">Trabalhos</SelectItem>
                      <SelectItem value="activity">Atividades</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-48 h-11 rounded-xl border-border bg-card/80">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas prioridades</SelectItem>
                      <SelectItem value="high">Alta prioridade</SelectItem>
                      <SelectItem value="medium">Média prioridade</SelectItem>
                      <SelectItem value="low">Baixa prioridade</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48 h-11 rounded-xl border-border bg-card/80">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Grid/List */}
            <Card className="border-0 shadow-xl bg-card/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl font-bold">Todas as Tarefas ({filteredNotes.length})</span>
                  <Badge variant="outline" className="text-sm">
                    {filteredNotes.filter(n => n.status !== 'completed').length} ativas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-6">
                      <Search className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Nenhuma tarefa encontrada</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Tente ajustar os filtros ou criar uma nova tarefa.</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Nova Tarefa
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    "gap-6",
                    viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"
                  )}>
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
              </CardContent>
            </Card>
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

export default UltraModernNotesManager;