import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { 
  Plus, 
  X, 
  Clock, 
  Calendar, 
  Settings, 
  Share2, 
  Download,
  Grid3X3,
  List,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  BookOpen,
  Timer,
  Users,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';
import ModernScheduleConfig from './ModernScheduleConfig';
import ShareGradeModal from '../ShareGradeModal';
import ImportGradeModal from '../ImportGradeModal';

const ModernWeeklySchedule: React.FC = () => {
  const { subjects, schedule, addScheduleSlot, removeScheduleSlot } = useData();
  const { timeSlots } = useScheduleConfig();
  const { shouldShowNotification } = useNotifications();
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaturday, setShowSaturday] = useState(() => {
    const saved = localStorage.getItem('faltula_show_saturday');
    return saved ? JSON.parse(saved) : false;
  });

  // Salvar estado do sábado no localStorage
  useEffect(() => {
    localStorage.setItem('faltula_show_saturday', JSON.stringify(showSaturday));
  }, [showSaturday]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [selectedTab, setSelectedTab] = useState('schedule');
  const [filterBySubject, setFilterBySubject] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const days = showSaturday ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] : ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const getScheduleSlot = (day: number, timeSlot: number) => {
    return schedule.find(s => s.day === day && s.timeSlot === timeSlot);
  };

  const getSubjectWeeklyCount = (subjectId: string) => {
    return schedule.filter(s => s.subjectId === subjectId).length;
  };

  const handleAddSlot = async (day: number, timeSlot: number) => {
    if (!selectedSubject) {
      toast.error("🎯 Escolha uma matéria primeiro!", {
        description: "Selecione uma matéria na barra lateral para adicionar ao horário."
      });
      return;
    }

    const subject = getSubjectById(selectedSubject);
    if (!subject || !subject.name) return;

    const currentWeeklyCount = getSubjectWeeklyCount(selectedSubject);
    
    const success = await addScheduleSlot({ subjectId: selectedSubject, day, timeSlot });
    
    if (success) {
      if (shouldShowNotification('grade')) {
        toast.success("⚡ Aula adicionada com sucesso!", {
          description: `${subject.name} foi adicionada à ${days[day]} no horário ${timeSlots[timeSlot]?.startTime}`,
        });
      }
    } else {
      if (currentWeeklyCount >= subject.weeklyHours) {
        toast.error(`📚 ${subject.name} atingiu o limite semanal`, {
          description: `Esta matéria já tem ${subject.weeklyHours} aula${subject.weeklyHours > 1 ? 's' : ''} na semana.`
        });
      } else {
        toast.error("⚠️ Não foi possível adicionar", {
          description: "Horário ocupado."
        });
      }
    }
  };

  const handleRemoveSlot = (slotId: string) => {
    const slot = schedule.find(s => s.id === slotId);
    const subject = slot ? getSubjectById(slot.subjectId) : null;
    
    removeScheduleSlot(slotId);
    
    if (shouldShowNotification('grade')) {
      toast.success("🗑️ Aula removida", {
        description: subject ? `${subject.name} foi removida da grade` : "A aula foi removida da sua grade horária.",
      });
    }
  };

  const getSubjectUsageInfo = (subjectId: string) => {
    const subject = getSubjectById(subjectId);
    if (!subject || !subject.name) return null;
    
    const currentCount = getSubjectWeeklyCount(subjectId);
    const isAtLimit = currentCount >= subject.weeklyHours;
    
    return {
      current: currentCount,
      max: subject.weeklyHours,
      isAtLimit,
      remaining: subject.weeklyHours - currentCount,
      percentage: (currentCount / subject.weeklyHours) * 100
    };
  };

  if (showConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowConfig(false)}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Voltar à Grade</span>
          </Button>
        </div>
        <ModernScheduleConfig />
      </div>
    );
  }

  // Modern Grid View
  const ModernGridView = () => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Grid3X3 className="h-5 w-5" />
            <span>Grade Horária Semanal</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="saturday-switch" className="text-sm">Incluir Sábado</Label>
              <Switch
                id="saturday-switch"
                checked={showSaturday}
                onCheckedChange={setShowSaturday}
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded border-2 border-dashed border-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">Vazio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-xs text-muted-foreground">Ocupado</span>
              </div>
            </div>
            
            <Badge variant="secondary" className="text-xs">
              {schedule.length} aulas agendadas
            </Badge>
          </div>

          {/* Schedule Grid */}
          <div 
            className="grid gap-2 bg-background rounded-lg border p-4 overflow-x-auto"
            style={{ 
              gridTemplateColumns: `120px repeat(${days.length}, minmax(120px, 1fr))`,
              minWidth: `${120 + (days.length * 120)}px`
            }}
          >
            {/* Header */}
            <div className="font-semibold text-sm text-center p-3 bg-muted rounded-lg">
              Horários
            </div>
            {days.map((day, index) => (
              <div key={day} className="font-semibold text-sm text-center p-3 bg-muted rounded-lg">
                <div>{day}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {schedule.filter(s => s.day === index).length} aulas
                </div>
              </div>
            ))}

            {/* Time slots */}
            {timeSlots.map((timeSlot, timeIndex) => {
              const elements = [];
              
              // Time label
              elements.push(
                <div key={`time-${timeIndex}`} className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border">
                  <div className="text-sm font-medium">{timeSlot.startTime}</div>
                  <div className="text-xs text-muted-foreground">até</div>
                  <div className="text-sm font-medium">{timeSlot.endTime}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {timeSlot.duration}min
                  </Badge>
                </div>
              );
              
              // Day slots
              days.forEach((_, dayIndex) => {
                const slot = getScheduleSlot(dayIndex, timeIndex);
                const subject = slot ? getSubjectById(slot.subjectId) : null;
                const isSelected = selectedSubject && subject?.id === selectedSubject;

                elements.push(
                  <div
                    key={`${dayIndex}-${timeIndex}`}
                    className={cn(
                      "min-h-[100px] border-2 rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                      subject 
                        ? "border-solid hover:shadow-lg hover:scale-105" 
                        : "border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ 
                      backgroundColor: subject ? `${subject.color}20` : undefined,
                      borderColor: subject ? subject.color : undefined
                    }}
                    onClick={() => {
                      if (slot) {
                        handleRemoveSlot(slot.id);
                      } else {
                        handleAddSlot(dayIndex, timeIndex);
                      }
                    }}
                  >
                    {subject ? (
                      <>
                        <Badge
                          className="text-white border-none text-center mb-2 font-medium"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.name}
                        </Badge>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black/10 flex items-center justify-center">
                          <X className="h-5 w-5 text-white bg-red-500 rounded-full p-1" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <Plus className="h-6 w-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                        <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          Adicionar
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
              
              return elements;
            })}
          </div>
          
        </div>
      </CardContent>
    </Card>
  );

  // Subject Selector Sidebar
  const SubjectSidebar = () => (
    <Card className="sticky top-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Matérias</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {subjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma matéria cadastrada</p>
              </div>
            ) : (
              subjects.map(subject => {
                const usage = getSubjectUsageInfo(subject.id);
                const isSelected = selectedSubject === subject.id;
                
                return (
                  <div
                    key={subject.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedSubject(isSelected ? '' : subject.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: subject.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{subject.name}</div>
                        {usage && (
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min(usage.percentage, 100)}%`,
                                  backgroundColor: usage.isAtLimit ? '#ef4444' : subject.color 
                                }}
                              />
                            </div>
                            <span className={cn(
                              "text-xs font-medium",
                              usage.isAtLimit ? "text-destructive" : "text-muted-foreground"
                            )}>
                              {usage.current}/{usage.max}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {selectedSubject && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSubject('')}
                className="w-full"
              >
                Limpar Seleção
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grade Horária</h1>
            <p className="text-muted-foreground">
              Organize seus horários de aula de forma inteligente
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Importar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            
            <Button
              size="sm"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Subject Selector */}
          <div className="lg:col-span-1">
            <SubjectSidebar />
          </div>
          
          {/* Schedule Grid */}
          <div className="lg:col-span-3">
            <ModernGridView />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShareGradeModal 
        open={showShareModal} 
        onOpenChange={setShowShareModal} 
      />
      <ImportGradeModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal} 
      />
    </>
  );
};

export default ModernWeeklySchedule;