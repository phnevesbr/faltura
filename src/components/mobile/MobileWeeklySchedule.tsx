
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Calendar, Plus, Trash2, Settings, Clock, Share2, Download } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useNotifications } from '../../hooks/useNotifications';
import MobileShareGradeModal from './MobileShareGradeModal';
import MobileImportGradeModal from './MobileImportGradeModal';
import MobileScheduleConfig from './MobileScheduleConfig';
import { MobileScheduleCard } from './MobileScheduleCard';
import DayFilterTabs from './DayFilterTabs';
import { getSubjectName, getSubjectColor, isValidSubject } from '../../utils/subjectHelpers';
import { useSundayConfig } from '../../hooks/useSundayConfig';

const MobileWeeklySchedule: React.FC = () => {
  const { subjects, schedule, addScheduleSlot, removeScheduleSlot } = useData();
  const { timeSlots } = useScheduleConfig();
  const { toast } = useToast();
  const { shouldShowNotification } = useNotifications();
  const { isSundayEnabled } = useSundayConfig();
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);
  const [currentSelectedDay, setCurrentSelectedDay] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [dayFilter, setDayFilter] = useState<number | null>(null); // null = "Todos"

  const [showSaturday, setShowSaturday] = useState(() => {
    const saved = localStorage.getItem('faltula_show_saturday');
    return saved ? JSON.parse(saved) : false;
  });

  const days = showSaturday ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] : ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const getSubjectWeeklyCount = (subjectId: string) => {
    return schedule.filter(s => s.subjectId === subjectId).length;
  };

  const getSubjectUsageInfo = (subjectId: string) => {
    const subject = getSubjectById(subjectId);
    if (!isValidSubject(subject)) return null;
    
    const currentCount = getSubjectWeeklyCount(subjectId);
    const isAtLimit = currentCount >= subject.weeklyHours;
    
    return {
      current: currentCount,
      max: subject.weeklyHours,
      isAtLimit,
      remaining: subject.weeklyHours - currentCount
    };
  };

  const getFirstAvailableTimeSlot = (dayIndex: number) => {
    const daySchedule = getScheduleForDay(dayIndex);
    const occupiedSlots = daySchedule.map(item => item.timeSlot);
    
    for (let i = 0; i < timeSlots.length; i++) {
      if (!occupiedSlots.includes(i)) {
        return i;
      }
    }
    return 0; // Default to first slot if all are occupied
  };

  const handleAddScheduleItem = async () => {
    if (!selectedSubject) {
      toast({
        title: "Selecione uma matéria",
        variant: "destructive",
      });
      return;
    }

    const subject = getSubjectById(selectedSubject);
    if (!isValidSubject(subject)) return;

    const currentWeeklyCount = getSubjectWeeklyCount(selectedSubject);

    // Check weekly limit first
    if (currentWeeklyCount >= subject.weeklyHours) {
      toast({
        title: "Limite atingido",
        description: `${getSubjectName(subject)} já tem ${subject.weeklyHours} aula${subject.weeklyHours > 1 ? 's' : ''} na semana (limite máximo).`,
        variant: "destructive",
      });
      return;
    }

    const exists = schedule.some(
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

    const success = await addScheduleSlot({
      day: selectedDay,
      timeSlot: selectedTimeSlot,
      subjectId: selectedSubject
    });

    if (success) {
      if (shouldShowNotification('grade')) {
        toast({
          title: "📊 Aula adicionada!",
          description: "A aula foi adicionada à sua grade.",
        });
      }
      setShowForm(false);
      setSelectedSubject('');
      setSelectedTimeSlot(0);
    } else {
      toast({
        title: "Não foi possível adicionar",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      });
    }

  };

  const handleRemoveScheduleItem = (id: string) => {
    removeScheduleSlot(id);
    if (shouldShowNotification('grade')) {
      toast({
        title: "📊 Aula removida",
        description: "A aula foi removida da sua grade.",
      });
    }
  };

  const getScheduleForDay = (dayIndex: number) => {
    return schedule.filter(item => item.day === dayIndex);
  };

  const handleOpenForm = (dayIndex?: number) => {
    const targetDay = dayIndex !== undefined ? dayIndex : currentSelectedDay;
    setSelectedDay(targetDay);
    setCurrentSelectedDay(targetDay);
    
    // Auto-select first available time slot for the selected day
    const firstAvailableSlot = getFirstAvailableTimeSlot(targetDay);
    setSelectedTimeSlot(firstAvailableSlot);
    
    setSelectedSubject('');
    setShowForm(true);
  };

  if (showConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Configuração de Horários</h2>
          <Button
            variant="outline"
            onClick={() => setShowConfig(false)}
          >
            Voltar à Grade
          </Button>
        </div>
        <MobileScheduleConfig />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grade Horária</h1>
            <p className="text-sm text-gray-500">{schedule.length} aulas cadastradas</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={showSaturday ? "default" : "outline"}
              onClick={() => {
                const newValue = !showSaturday;
                setShowSaturday(newValue);
                localStorage.setItem('faltula_show_saturday', JSON.stringify(newValue));
              }}
              className="h-9 px-3"
              title="Incluir Sábado"
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sábado</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfig(true)}
              className="h-9 px-3"
              title="Configurações de Horários"
            >
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Config</span>
            </Button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="h-9 px-3"
            title="Importar Grade"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowShareModal(true)}
            className="h-9 px-3"
            title="Compartilhar Grade"
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
          {subjects.length > 0 && (
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9" onClick={() => handleOpenForm()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aula
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Aula</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value={selectedTimeSlot.toString()} onValueChange={(value) => setSelectedTimeSlot(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot, index) => {
                          const isOccupied = schedule.some(
                            item => item.day === selectedDay && item.timeSlot === index
                          );
                          return (
                            <SelectItem 
                              key={index} 
                              value={index.toString()}
                              disabled={isOccupied}
                            >
                              {slot.startTime} - {slot.endTime}
                              {isOccupied && " (Ocupado)"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger data-action="select-subject">
                        <SelectValue placeholder="Selecione a matéria" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {getSubjectName(subject)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddScheduleItem} data-action="add-class" className="flex-1">
                      Adicionar aula
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                  </div>

                  {/* Show usage info for selected subject */}
                  {selectedSubject && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      {(() => {
                        const usage = getSubjectUsageInfo(selectedSubject);
                        const subject = getSubjectById(selectedSubject);
                        if (!usage || !subject) return null;
                        
                        if (usage.isAtLimit) {
                          return (
                            <p className="text-sm text-blue-800">
                              <strong>⚠️ Limite atingido:</strong> {getSubjectName(subject)} já tem {usage.max} aula{usage.max > 1 ? 's' : ''} na semana (máximo permitido).
                            </p>
                          );
                        }
                        
                        return (
                          <p className="text-sm text-blue-800">
                            <strong>📊 Status:</strong> {getSubjectName(subject)} tem {usage.current} de {usage.max} aula{usage.max > 1 ? 's' : ''} na semana.
                            {usage.remaining > 0 && (
                              <span className="text-green-700"> Restam {usage.remaining} aula{usage.remaining > 1 ? 's' : ''}.</span>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filtros de dias */}
        {schedule.length > 0 && (
          <div>
            <DayFilterTabs
              selectedDay={dayFilter}
              onDaySelect={setDayFilter}
              showSaturday={showSaturday}
              isSundayEnabled={isSundayEnabled()}
            />
          </div>
        )}

        {/* Aviso se não há matérias */}
        {subjects.length === 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <Settings className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700">
                  <p className="font-medium mb-1">Cadastre suas matérias primeiro</p>
                  <p>Vá para a aba "Matérias" e adicione suas disciplinas antes de montar a grade horária, ou importe uma grade existente.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grade por dia */}
        <div className="space-y-3">
          {days.map((day, dayIndex) => {
            // Se há filtro ativo e não é o dia selecionado, pular
            if (dayFilter !== null && dayFilter !== dayIndex) {
              return null;
            }
            
            const daySchedule = getScheduleForDay(dayIndex);
            const isSelected = currentSelectedDay === dayIndex;
            
            return (
              <Card key={dayIndex} className={isSelected ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {day}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-gray-500">
                        {daySchedule.length} aula{daySchedule.length !== 1 ? 's' : ''}
                      </span>
                      {subjects.length > 0 && (
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenForm(dayIndex)}
                          data-action="add-schedule"
                          className="h-8 px-3"
                          variant={isSelected ? "default" : "outline"}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {daySchedule.length === 0 ? (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Nenhuma aula</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {daySchedule
                        .sort((a, b) => a.timeSlot - b.timeSlot)
                        .map((item) => (
                          <MobileScheduleCard
                            key={item.id}
                            scheduleItem={item}
                            onDelete={handleRemoveScheduleItem}
                          />
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resumo semanal */}
        {schedule.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">Resumo Semanal</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-blue-700">Total de aulas:</span>
                  <span className="font-semibold text-blue-900 ml-1">{schedule.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Matérias ativas:</span>
                  <span className="font-semibold text-blue-900 ml-1">
                    {new Set(schedule.map(s => s.subjectId)).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <MobileShareGradeModal 
        open={showShareModal} 
        onOpenChange={setShowShareModal} 
      />
      <MobileImportGradeModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal} 
      />
    </>
  );
};

export default MobileWeeklySchedule;
