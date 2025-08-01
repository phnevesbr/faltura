import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useSundayConfig } from '../../hooks/useSundayConfig';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { 
  Plus, 
  AlertTriangle, 
  CalendarX, 
  Clock, 
  Calendar, 
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  EyeOff,
  Filter,
  Search,
  BookOpen,
  Target,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface SubjectOption {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  classCount: number;
  selected: boolean;
}

const UltraModernAbsenceManager: React.FC = () => {
  const { subjects, schedule, absences, addAbsence, removeAbsence } = useData();
  const { awardAbsenceRegistrationXP } = useGamification();
  const { shouldShowNotification } = useNotifications();
  const { isSundayEnabled } = useSundayConfig();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [selectAllAbsent, setSelectAllAbsent] = useState(true);
  const [activeTab, setActiveTab] = useState('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  const getSubjectsForDay = (date: string) => {
    if (!date) return [];
    
    try {
      const dateObj = new Date(date + 'T00:00:00');
      if (isNaN(dateObj.getTime())) return [];
      
      const dayOfWeek = dateObj.getDay();
      let adjustedDay: number;
      
      if (dayOfWeek === 0) {
        adjustedDay = 6;
      } else if (dayOfWeek === 6) {
        adjustedDay = 5;
      } else {
        adjustedDay = dayOfWeek - 1;
      }
      
      const showSaturday = localStorage.getItem('faltula_show_saturday');
      const isSaturdayEnabled = showSaturday ? JSON.parse(showSaturday) : false;
      
      if (adjustedDay === 5 && !isSaturdayEnabled) return [];
      if (adjustedDay === 6 && !isSundayEnabled()) return [];
      
      const daySlots = schedule.filter(slot => slot.day === adjustedDay);
      const subjectClassCount = new Map<string, number>();
      
      daySlots.forEach(slot => {
        const currentCount = subjectClassCount.get(slot.subjectId) || 0;
        subjectClassCount.set(slot.subjectId, currentCount + 1);
      });
      
      return Array.from(subjectClassCount.entries()).map(([subjectId, classCount]) => {
        const subject = subjects.find(s => s.id === subjectId);
        return {
          subjectId,
          subjectName: subject?.name && typeof subject.name === 'string' ? subject.name : 'Matéria não encontrada',
          subjectColor: subject?.color || '#6B7280',
          classCount,
          selected: selectAllAbsent
        };
      });
    } catch (error) {
      console.error('Error in getSubjectsForDay:', error);
      return [];
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const daySubjects = getSubjectsForDay(selectedDate);
      setSubjectOptions(daySubjects);
    } else {
      setSubjectOptions([]);
    }
  }, [selectedDate, schedule, subjects, selectAllAbsent]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    
    if (!date) return;

    try {
      const dateObj = new Date(date + 'T00:00:00');
      if (isNaN(dateObj.getTime())) {
        toast.error("Por favor, selecione uma data válida.");
        setSelectedDate('');
        return;
      }
      
      const dayOfWeek = dateObj.getDay();
    
      if (dayOfWeek === 0 && !isSundayEnabled()) {
        toast.error("Não há aulas aos domingos.");
        setSelectedDate('');
        return;
      }

      const exists = absences.some(absence => absence.date === date);
      if (exists) {
        toast.error("Você já registrou falta para este dia.");
        setSelectedDate('');
        return;
      }
    } catch (error) {
      console.error('Error in handleDateChange:', error);
      toast.error("Ocorreu um erro ao processar a data selecionada.");
      setSelectedDate('');
    }
  };

  const toggleSubjectSelection = (subjectId: string) => {
    setSubjectOptions(prev => prev.map(option =>
      option.subjectId === subjectId 
        ? { ...option, selected: !option.selected }
        : option
    ));
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAllAbsent;
    setSelectAllAbsent(newSelectAll);
    setSubjectOptions(prev => prev.map(option => ({
      ...option,
      selected: newSelectAll
    })));
  };

  const handleAddAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error("Escolha o dia em que você faltou.");
      return;
    }

    const selectedSubjects = subjectOptions.filter(option => option.selected);
    
    if (selectedSubjects.length === 0) {
      toast.error("Marque as aulas em que você faltou.");
      return;
    }

    const subjectIds = selectedSubjects.map(option => option.subjectId);
    await addAbsence(selectedDate, 10, subjectIds);
    await awardAbsenceRegistrationXP();
    
    setSelectedDate('');
    setSubjectOptions([]);
    
    const totalClasses = selectedSubjects.reduce((sum, option) => sum + option.classCount, 0);
    
    if (shouldShowNotification('absences')) {
      toast.success("📅 Falta registrada!", {
        description: `Registradas ${totalClasses} falta(s) em ${selectedSubjects.length} matéria(s).`,
      });
    }
  };

  const handleRemoveAbsence = (id: string, date: string) => {
    removeAbsence(id);
    toast.success("Falta removida", {
      description: `Falta do dia ${format(new Date(date), 'dd/MM/yyyy')} foi removida.`,
    });
  };

  const sortedAbsences = [...absences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredAbsences = sortedAbsences.filter(absence => {
    if (selectedSubjectFilter !== 'all') {
      return absence.subjects?.some(s => s.subjectId === selectedSubjectFilter);
    }
    return true;
  }).filter(absence => {
    if (searchQuery) {
      const formattedDate = format(new Date(absence.date), 'dd/MM/yyyy', { locale: ptBR });
      return formattedDate.includes(searchQuery) || 
             absence.subjects?.some(s => {
               const subject = subjects.find(subj => subj.id === s.subjectId);
               return subject?.name.toLowerCase().includes(searchQuery.toLowerCase());
             });
    }
    return true;
  });

  const getAbsenceStats = () => {
    const totalAbsences = absences.reduce((sum, absence) => 
      sum + (absence.subjects?.reduce((subSum, s) => subSum + s.classCount, 0) || 0), 0
    );
    
    const subjectsNearLimit = subjects.filter(subject => {
      const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
      return percentage >= 75;
    }).length;

    const criticalSubjects = subjects.filter(subject => {
      const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
      return percentage >= 90;
    }).length;

    return { totalAbsences, subjectsNearLimit, criticalSubjects };
  };

  const { totalAbsences, subjectsNearLimit, criticalSubjects } = getAbsenceStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      <div className="container mx-auto p-8 space-y-10">
        {/* Ultra Modern Hero Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 p-10 text-white shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          
          {/* Floating Orbs */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-500/30 blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-red-400/20 to-pink-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CalendarX className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tight">
                      Controle de <span className="text-white/80">Faltas</span>
                    </h1>
                    <p className="text-orange-100 text-xl font-medium">
                      Gerencie sua frequência acadêmica
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <CalendarX className="h-5 w-5 text-blue-300" />
                    <span className="text-sm font-semibold">{totalAbsences} faltas totais</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-300" />
                    <span className="text-sm font-semibold">{criticalSubjects} críticas</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Activity className="h-5 w-5 text-green-300" />
                    <span className="text-sm font-semibold">{absences.filter(a => {
                      const absenceDate = new Date(a.date);
                      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
                      return absenceDate >= weekStart && absenceDate <= weekEnd;
                    }).length} esta semana</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    placeholder="Buscar faltas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 w-full sm:w-80 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-2xl text-base"
                  />
                </div>
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
                  value="register" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 dark:text-gray-400 font-semibold text-base transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Registrar Nova Falta
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 dark:text-gray-400 font-semibold text-base transition-all duration-300"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Histórico de Faltas
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="register" className="p-8 space-y-8">
              {/* Registration Header */}
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Registrar Nova Falta</h2>
                      <p className="text-orange-600 dark:text-orange-400 font-medium">Selecione o dia e as aulas em que você faltou</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Form */}
              <form onSubmit={handleAddAbsence} className="space-y-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Data da Falta</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full h-12 text-lg rounded-xl border-2"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </CardContent>
                </Card>

                {selectedDate && subjectOptions.length > 0 && (
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5" />
                          <span>Aulas do dia {format(new Date(selectedDate), 'EEEE, dd/MM/yyyy', { locale: ptBR })}</span>
                        </CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={toggleSelectAll}
                          className="rounded-xl"
                        >
                          {selectAllAbsent ? 'Desmarcar todas' : 'Marcar todas'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {subjectOptions.map((option) => (
                          <div
                            key={option.subjectId}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                              option.selected 
                                ? "bg-purple-50 dark:bg-purple-950/50 border-purple-500" 
                                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300"
                            )}
                            onClick={() => toggleSubjectSelection(option.subjectId)}
                          >
                            <div className="flex items-center space-x-4">
                              <Checkbox
                                checked={option.selected}
                                onChange={() => toggleSubjectSelection(option.subjectId)}
                                className="h-5 w-5"
                              />
                              <div 
                                className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: option.subjectColor }}
                              />
                              <div>
                                <span className="font-semibold text-lg">{option.subjectName}</span>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {option.classCount} aula{option.classCount > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>{option.classCount}x</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Selection Info */}
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-semibold">Seleção inteligente:</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          Marque apenas as aulas em que você realmente faltou. Cada aula selecionada contará como uma falta individual.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedDate && subjectOptions.length > 0 && (
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-bold text-lg rounded-xl shadow-lg"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Registrar Falta ({subjectOptions.filter(o => o.selected).reduce((sum, o) => sum + o.classCount, 0)} {subjectOptions.filter(o => o.selected).reduce((sum, o) => sum + o.classCount, 0) === 1 ? 'matéria' : 'matérias'})
                  </Button>
                )}
              </form>
            </TabsContent>

            <TabsContent value="history" className="p-8 space-y-8">
              {/* History Header */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg">
                        <Calendar className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Histórico de Faltas</h2>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">{absences.length} registros encontrados</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <select
                        value={selectedSubjectFilter}
                        onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 font-medium"
                      >
                        <option value="all">Todas as matérias</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* History List */}
              {filteredAbsences.length === 0 ? (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarX className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {absences.length === 0 ? 'Nenhuma falta registrada' : 'Nenhuma falta encontrada'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      {absences.length === 0 
                        ? 'Você ainda não registrou nenhuma falta. Quando registrar suas faltas, elas aparecerão aqui para acompanhar sua frequência.'
                        : 'Tente ajustar os filtros de busca para encontrar o que procura.'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredAbsences.map(absence => {
                    const date = new Date(absence.date + 'T00:00:00');
                    
                    return (
                      <Card key={absence.id} className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20 hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-4">
                                <CalendarX className="h-6 w-6 text-red-500 mr-3" />
                                <div>
                                  <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                                    {format(date, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {absence.subjects?.reduce((sum, s) => sum + s.classCount, 0) || 0} falta(s) registrada(s)
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  <span>Matérias afetadas:</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  {absence.subjects && absence.subjects.length > 0 ? (
                                    absence.subjects.map(({ subjectId, classCount }) => {
                                      const subject = subjects.find(s => s.id === subjectId);
                                      if (!subject) {
                                        return (
                                          <Badge key={subjectId} variant="secondary" className="text-xs">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Matéria removida ({classCount} aula{classCount > 1 ? 's' : ''})
                                          </Badge>
                                        );
                                      }
                                      
                                      return (
                                        <Badge
                                          key={subjectId}
                                          className="text-white border-none text-xs font-medium px-3 py-1"
                                          style={{ backgroundColor: subject.color }}
                                        >
                                          <Clock className="h-3 w-3 mr-1" />
                                          {subject.name} ({classCount} aula{classCount > 1 ? 's' : ''})
                                        </Badge>
                                      );
                                    })
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Nenhuma matéria registrada
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                  Total de faltas registradas neste dia: {' '}
                                  <span className="font-semibold">
                                    {absence.subjects ? absence.subjects.reduce((total, s) => total + s.classCount, 0) : 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveAbsence(absence.id, absence.date)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/50 border-red-300 dark:border-red-700 ml-4 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UltraModernAbsenceManager;