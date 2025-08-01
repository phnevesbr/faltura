import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Zap,
  Clock,
  Calendar,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  EyeOff,
  Settings,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import ColorPicker from '../ColorPicker';
import { cn } from '../../lib/utils';

const UltraModernSubjectManager: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [formData, setFormData] = useState({
    name: '',
    weeklyHours: 1,
    maxAbsences: 5,
    color: '#8B5CF6'
  });

  const generateRandomColor = () => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getDefaultMaxAbsences = (weeklyHours: number): number => {
    if (weeklyHours >= 4) return 20;
    if (weeklyHours === 3) return 15;
    if (weeklyHours === 2) return 10;
    return 5;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da matéria.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateSubject(editingId, formData);
      toast({ title: "Matéria atualizada com sucesso!" });
      setEditingId(null);
    } else {
      addSubject(formData);
      toast({ title: "Matéria adicionada com sucesso!" });
    }
    
    setFormData({ name: '', weeklyHours: 1, maxAbsences: 5, color: generateRandomColor() });
    setShowForm(false);
  };

  const handleEdit = (subject: any) => {
    setFormData({
      name: subject.name,
      weeklyHours: subject.weeklyHours,
      maxAbsences: subject.maxAbsences,
      color: subject.color
    });
    setEditingId(subject.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    deleteSubject(id);
    toast({ title: `${name} removida com sucesso` });
  };

  const getAbsenceStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return { 
      status: 'failed', 
      color: 'text-red-500', 
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: XCircle 
    };
    if (percentage >= 90) return { 
      status: 'danger', 
      color: 'text-red-500', 
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertTriangle 
    };
    if (percentage >= 75) return { 
      status: 'warning', 
      color: 'text-orange-500', 
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      borderColor: 'border-orange-200 dark:border-orange-800',
      icon: AlertTriangle 
    };
    return { 
      status: 'ok', 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle 
    };
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    
    const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
    
    switch (selectedFilter) {
      case 'safe':
        return matchesSearch && percentage < 75;
      case 'warning':
        return matchesSearch && percentage >= 75 && percentage < 90;
      case 'danger':
        return matchesSearch && percentage >= 90;
      default:
        return matchesSearch;
    }
  });

  const getSubjectStats = () => {
    const total = subjects.length;
    const safe = subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 < 75).length;
    const warning = subjects.filter(s => {
      const p = (s.currentAbsences / s.maxAbsences) * 100;
      return p >= 75 && p < 90;
    }).length;
    const danger = subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 >= 90).length;
    
    const totalAbsences = subjects.reduce((sum, s) => sum + s.currentAbsences, 0);
    const totalMaxAbsences = subjects.reduce((sum, s) => sum + s.maxAbsences, 0);
    const averagePercentage = totalMaxAbsences > 0 ? (totalAbsences / totalMaxAbsences) * 100 : 0;

    return { total, safe, warning, danger, totalAbsences, averagePercentage };
  };

  const { total, safe, warning, danger, totalAbsences, averagePercentage } = getSubjectStats();

  const SubjectCard = ({ subject }: { subject: any }) => {
    const status = getAbsenceStatus(subject.currentAbsences, subject.maxAbsences);
    const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
    const StatusIcon = status.icon;

    return (
      <Card className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105",
        status.bgColor,
        status.borderColor
      )}>
        <CardHeader className="pb-4 relative">
          {/* Ícone de status sempre visível */}
          <div className="absolute top-3 right-3 z-10 group-hover:opacity-0 transition-opacity duration-200">
            <StatusIcon className={cn("h-5 w-5", status.color)} />
          </div>
          
          {/* Ícones de ação aparecem no hover */}
          <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(subject)}
              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"
            >
              <Edit2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(subject.id, subject.name)}
              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
            >
              <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: subject.color }}
              >
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{subject.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {subject.weeklyHours} aula{subject.weeklyHours > 1 ? 's' : ''}/semana
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Frequência</span>
                <span className="text-sm text-muted-foreground">
                  {subject.currentAbsences}/{subject.maxAbsences}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {percentage.toFixed(1)}% do limite usado
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {subject.maxAbsences - subject.currentAbsences}
                </div>
                <div className="text-xs text-muted-foreground">
                  Faltas restantes
                </div>
              </div>
              <div>
                <div className={cn("text-2xl font-bold", status.color)}>
                  {Math.round(100 - percentage)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Margem segura
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SubjectListItem = ({ subject }: { subject: any }) => {
    const status = getAbsenceStatus(subject.currentAbsences, subject.maxAbsences);
    const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
    const StatusIcon = status.icon;

    return (
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: subject.color }}
              >
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-lg">{subject.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {subject.weeklyHours} aulas/sem
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex-1 max-w-xs">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subject.currentAbsences}/{subject.maxAbsences}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className={cn("text-lg font-bold", status.color)}>
                  {percentage.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">usado</div>
              </div>
              
              <StatusIcon className={cn("h-5 w-5", status.color)} />
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(subject)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(subject.id, subject.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      <div className="container mx-auto p-8 space-y-10">
        {/* Ultra Modern Hero Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-10 text-white shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          
          {/* Floating Orbs */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-500/30 blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-400/20 to-green-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tight">
                      Gestão de <span className="text-white/80">Matérias</span>
                    </h1>
                    <p className="text-emerald-100 text-xl font-medium">
                      Organize seu currículo acadêmico
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <BookOpen className="h-5 w-5 text-blue-300" />
                    <span className="text-sm font-semibold">{total} matérias</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span className="text-sm font-semibold">{safe} seguras</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-300" />
                    <span className="text-sm font-semibold">{danger} críticas</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    placeholder="Buscar matérias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 w-full sm:w-80 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-2xl text-base"
                  />
                </div>
                
                <Button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                  }}
                  size="lg"
                  className="h-12 bg-white text-emerald-600 hover:bg-white/90 shadow-xl gap-3 font-bold rounded-2xl px-8"
                >
                  <Plus className="h-5 w-5" />
                  Nova Matéria
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <TabsList className="w-full h-16 bg-transparent p-0 space-x-0">
                <TabsTrigger 
                  value="overview" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-600 dark:text-gray-400 font-semibold text-base transition-all duration-300"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Resumo das Matérias
                </TabsTrigger>
                <TabsTrigger 
                  value="manage" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-600 dark:text-gray-400 font-semibold text-base transition-all duration-300"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Gerenciar Matérias
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-8 space-y-8">
              {/* Stats Header Card */}
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Resumo das Matérias</h2>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">Acompanhe o status geral do seu currículo</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Frequência média: <span className="font-bold text-emerald-600">{averagePercentage.toFixed(1)}%</span></div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{totalAbsences} faltas totais</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Status das Matérias */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">Status das Matérias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">Seguras</span>
                      </div>
                      <Badge className="bg-emerald-500 text-white font-bold text-lg px-3 py-1">{safe}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-700 dark:text-orange-300">Atenção</span>
                      </div>
                      <Badge className="bg-orange-500 text-white font-bold text-lg px-3 py-1">{warning}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-700 dark:text-red-300">Críticas</span>
                      </div>
                      <Badge className="bg-red-500 text-white font-bold text-lg px-3 py-1">{danger}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Matérias de Maior Risco */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Matérias de Maior Risco
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {subjects.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Nenhuma matéria cadastrada</p>
                      </div>
                    ) : (
                      subjects
                        .sort((a, b) => ((b.currentAbsences / b.maxAbsences) * 100) - ((a.currentAbsences / a.maxAbsences) * 100))
                        .slice(0, 3)
                        .map(subject => {
                          const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
                          const isHigh = percentage >= 75;
                          return (
                            <div key={subject.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              isHigh 
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="h-4 w-4 rounded-full shadow-sm"
                                  style={{ backgroundColor: subject.color }}
                                />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {subject.currentAbsences}/{subject.maxAbsences} faltas
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  isHigh ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {percentage.toFixed(0)}%
                                </div>
                                {isHigh && (
                                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    Alto risco
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </CardContent>
                </Card>

                {/* Ações Rápidas */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" />
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => {
                        setShowForm(true);
                        setEditingId(null);
                      }}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] h-auto"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Nova Matéria</div>
                        <div className="text-xs opacity-90">Adicionar nova disciplina</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-2 border-emerald-300 dark:border-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] h-auto"
                      onClick={() => setActiveTab('manage')}
                    >
                      <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" />
                      <div className="text-left">
                        <div className="font-semibold text-emerald-700 dark:text-emerald-300">Ver Análise Completa</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Relatórios detalhados</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-2 border-orange-300 dark:border-orange-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/50 font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] h-auto"
                    >
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                      <div className="text-left">
                        <div className="font-semibold text-orange-700 dark:text-orange-300">Revisar Críticas</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">{danger} matérias em risco</div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="p-8 space-y-8">
              {/* Controls Bar */}
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Matérias</h2>
                  <Badge variant="outline" className="text-sm font-semibold">
                    {filteredSubjects.length} {filteredSubjects.length === 1 ? 'cadastrada' : 'cadastradas'}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-lg"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-lg"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-48 rounded-xl">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="safe">Seguras</SelectItem>
                      <SelectItem value="warning">Atenção</SelectItem>
                      <SelectItem value="danger">Críticas</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => {
                      setShowForm(true);
                      setEditingId(null);
                    }}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Matéria
                  </Button>
                </div>
              </div>

              {/* Subject Grid/List */}
              {filteredSubjects.length === 0 ? (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {subjects.length === 0 ? 'Nenhuma matéria cadastrada' : 'Nenhuma matéria encontrada'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      {subjects.length === 0 
                        ? 'Comece adicionando suas matérias para acompanhar suas faltas e frequência.' 
                        : 'Tente ajustar os filtros de busca para encontrar o que procura.'
                      }
                    </p>
                    {subjects.length === 0 && (
                      <Button
                        onClick={() => {
                          setShowForm(true);
                          setEditingId(null);
                        }}
                        className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar primeira matéria
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {filteredSubjects.map(subject => 
                    viewMode === 'grid' 
                      ? <SubjectCard key={subject.id} subject={subject} />
                      : <SubjectListItem key={subject.id} subject={subject} />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Add/Edit Subject Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>{editingId ? 'Editar Matéria' : 'Nova Matéria'}</span>
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Nome da Matéria</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Matemática, Português..."
                    className="mt-1 h-12 rounded-xl border-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weeklyHours" className="text-sm font-medium">Aulas por Semana</Label>
                    <Select 
                      value={formData.weeklyHours.toString()} 
                      onValueChange={(value) => {
                        const hours = parseInt(value);
                        setFormData(prev => ({ 
                          ...prev, 
                          weeklyHours: hours,
                          maxAbsences: getDefaultMaxAbsences(hours)
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-1 h-12 rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 aula</SelectItem>
                        <SelectItem value="2">2 aulas</SelectItem>
                        <SelectItem value="3">3 aulas</SelectItem>
                        <SelectItem value="4">4 aulas</SelectItem>
                        <SelectItem value="5">5 aulas</SelectItem>
                        <SelectItem value="6">6 aulas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxAbsences" className="text-sm font-medium">Limite de Faltas</Label>
                    <Input
                      id="maxAbsences"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.maxAbsences}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxAbsences: parseInt(e.target.value) || 1 }))}
                      className="mt-1 h-12 rounded-xl border-2"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Cor da Matéria</Label>
                  <div className="mt-2">
                    <ColorPicker
                      selectedColor={formData.color}
                      onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  {editingId ? 'Atualizar' : 'Adicionar'} Matéria
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UltraModernSubjectManager;