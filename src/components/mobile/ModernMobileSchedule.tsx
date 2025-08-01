import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import { useNextClass } from '../../hooks/useNextClass';
import MobileScheduleConfig from './MobileScheduleConfig';
import DayFilterTabs from './DayFilterTabs';
import { getSubjectName, getSubjectColor, isValidSubject, filterValidSubjects } from '../../utils/subjectHelpers';
import { useSundayConfig } from '../../hooks/useSundayConfig';
import MobileImportGradeModal from './MobileImportGradeModal';
import MobileShareGradeModal from './MobileShareGradeModal';
import {
  Plus,
  Clock,
  MapPin,
  Trash2,
  Settings,
  MoreVertical,
  Calendar,
  AlertCircle,
  CheckCircle,
  Share2,
  Download,
  ChevronDown,
  X,
  BookOpen
} from 'lucide-react';

const ModernMobileSchedule: React.FC = () => {
  const { subjects, schedule, addScheduleSlot, removeScheduleSlot } = useData();
  const { timeSlots } = useScheduleConfig();
  const { toast } = useToast();
  const { nextClass, timeUntilNext } = useNextClass();
  const { isSundayEnabled } = useSundayConfig();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);
  const [currentSelectedDay, setCurrentSelectedDay] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [showSaturday, setShowSaturday] = useState(() => {
    const saved = localStorage.getItem('faltula_show_saturday');
    return saved ? JSON.parse(saved) : false;
  });

  const days = showSaturday ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] : ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  const validSubjects = filterValidSubjects(subjects);
  const validSchedule = schedule?.filter(item => {
    const subject = subjects?.find(s => s.id === item.subjectId);
    return isValidSubject(subject);
  }) || [];

  const getSubjectById = (id: string) => subjects?.find(s => s.id === id);

  const getScheduleSlot = (day: number, timeSlot: number) => {
    return validSchedule.find(s => s.day === day && s.timeSlot === timeSlot);
  };

  const getSubjectWeeklyCount = (subjectId: string) => {
    return validSchedule.filter(s => s.subjectId === subjectId).length;
  };

  const getSubjectUsageInfo = (subjectId: string) => {
    const subject = getSubjectById(subjectId);
    if (!isValidSubject(subject)) return null;
    
    const currentCount = getSubjectWeeklyCount(subjectId);
    const maxRecommended = Math.ceil(subject.weeklyHours / 1.5); // Estimativa baseada na carga horária
    
    return {
      current: currentCount,
      max: maxRecommended,
      isOverused: currentCount > maxRecommended
    };
  };

  const handleAddClass = async () => {
    
    if (!selectedSubject) {
      toast({
        title: "Selecione uma matéria",
        variant: "destructive",
      });
      return;
    }

    const exists = validSchedule.some(
      item => item.day === selectedDay && item.timeSlot === selectedTimeSlot
    );

    if (exists) {
      toast({
        title: "Horário ocupado",
        description: "Já existe uma aula neste horário.",
        variant: "destructive",
      });
      return;
    }

    const subject = getSubjectById(selectedSubject);
    if (!isValidSubject(subject)) {
      toast({
        title: "Matéria inválida",
        description: "A matéria selecionada não é válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addScheduleSlot({
        day: selectedDay,
        timeSlot: selectedTimeSlot,
        subjectId: selectedSubject,
      });

      setShowForm(false);
      setSelectedSubject('');
      
      toast({
        title: "Aula adicionada!",
        description: `${getSubjectName(subject)} foi adicionada à ${days[selectedDay]}.`,
      });
    } catch (error) {
      console.error('Error adding schedule slot:', error);
      toast({
        title: "Erro ao adicionar aula",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSlot = async (day: number, timeSlot: number) => {
    const slot = getScheduleSlot(day, timeSlot);
    if (!slot) return;

    const subject = getSubjectById(slot.subjectId);
    
    try {
      await removeScheduleSlot(slot.id);
      
      toast({
        title: "Aula removida",
        description: `${getSubjectName(subject)} foi removida.`,
      });
    } catch (error) {
      console.error('Error removing schedule slot:', error);
      toast({
        title: "Erro ao remover aula",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDaySelect = (day: number) => {
    setCurrentSelectedDay(day);
    setSelectedDay(day);
    setShowForm(true);
  };

  const toggleSaturday = () => {
    const newValue = !showSaturday;
    setShowSaturday(newValue);
    localStorage.setItem('faltula_show_saturday', JSON.stringify(newValue));
  };

  // Verificar se temos dados válidos
  if (!timeSlots || timeSlots.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Configure seus horários</h3>
            <p className="text-gray-600 text-sm mb-4">
              Você precisa configurar os horários das aulas primeiro.
            </p>
            <Button onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Horários
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Next Class Info */}
      {nextClass && (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Próxima Aula</h3>
                <p className="text-blue-100">{getSubjectName(nextClass.subject)}</p>
                <p className="text-sm text-blue-200">
                  {days[nextClass.day]} • {nextClass.timeSlot?.startTime} - {nextClass.timeSlot?.endTime}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <Clock className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs">{timeUntilNext}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros de dias */}
      {validSchedule.length > 0 && (
        <div>
          <DayFilterTabs
            selectedDay={dayFilter}
            onDaySelect={setDayFilter}
            showSaturday={showSaturday}
            isSundayEnabled={isSundayEnabled()}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Main Action Button */}
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl h-12 px-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Aula
        </Button>
        
        {/* Secondary Action Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShareModal(true)}
          className="h-12 w-12 p-0 rounded-xl border-2 hover:bg-gray-50"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportModal(true)}
          className="h-12 w-12 p-0 rounded-xl border-2 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <Button
          variant={showSaturday ? "default" : "outline"}
          onClick={toggleSaturday}
          size="sm"
          title="Incluir Sábado"
          className="h-12 w-12 p-0 rounded-xl border-2 hover:bg-gray-50"
        >
          <Calendar className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowConfig(true)}
          size="sm"
          className="h-12 w-12 p-0 rounded-xl border-2 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="space-y-3">
        {days.map((day, dayIndex) => {
          // Se há filtro ativo e não é o dia selecionado, pular
          if (dayFilter !== null && dayFilter !== dayIndex) {
            return null;
          }
          
          return (
            <Card key={dayIndex} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{day}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDaySelect(dayIndex)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {timeSlots.map((timeSlot, slotIndex) => {
                    const scheduleSlot = getScheduleSlot(dayIndex, slotIndex);
                    const subject = scheduleSlot ? getSubjectById(scheduleSlot.subjectId) : null;
                    
                    return (
                      <div
                        key={slotIndex}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          scheduleSlot 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="text-xs text-gray-500 font-medium min-w-[60px]">
                              {timeSlot.startTime}
                            </div>
                            {scheduleSlot && subject ? (
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getSubjectColor(subject) }}
                                  />
                                  <span className="font-medium text-gray-900">
                                    {getSubjectName(subject)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {timeSlot.startTime} - {timeSlot.endTime}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedDay(dayIndex);
                                  setSelectedTimeSlot(slotIndex);
                                  setShowForm(true);
                                }}
                                className="flex-1 text-left text-gray-400 text-sm hover:text-purple-600 hover:bg-purple-50 rounded p-1 transition-colors"
                              >
                                Horário livre
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {scheduleSlot && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adicionar Aula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Dia da Semana</label>
              <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {days.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Horário</label>
              <Select value={selectedTimeSlot.toString()} onValueChange={(value) => setSelectedTimeSlot(parseInt(value))}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {timeSlots.map((slot, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {slot.startTime} - {slot.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Matéria</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {validSubjects.map((subject) => {
                    const usage = getSubjectUsageInfo(subject.id);
                    return (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getSubjectColor(subject) }}
                          />
                          <span>{getSubjectName(subject)}</span>
                          {usage && usage.isOverused && (
                            <span className="text-xs text-amber-600">⚠️</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleAddClass} className="flex-1">
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Config Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Horários</DialogTitle>
          </DialogHeader>
          <MobileScheduleConfig />
        </DialogContent>
      </Dialog>

      {/* Import/Share Modals */}
      <MobileImportGradeModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal} 
      />
      <MobileShareGradeModal 
        open={showShareModal} 
        onOpenChange={setShowShareModal} 
      />
    </div>
  );
};

export default ModernMobileSchedule;