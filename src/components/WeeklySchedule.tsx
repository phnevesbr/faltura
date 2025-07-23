
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useScheduleConfig } from '../contexts/ScheduleConfigContext';
import { useSundayConfig } from '../hooks/useSundayConfig';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, X, Clock, Calendar, Smartphone, Settings, Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';
import ScheduleConfig from './ScheduleConfig';
import ShareGradeModal from './ShareGradeModal';
import ImportGradeModal from './ImportGradeModal';
import { getSubjectName, getSubjectColor, isValidSubject } from '../utils/subjectHelpers';

const WeeklySchedule: React.FC = () => {
  const { subjects, schedule, addScheduleSlot, removeScheduleSlot } = useData();
  const { timeSlots } = useScheduleConfig();
  const { shouldShowNotification } = useNotifications();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [showSaturday, setShowSaturday] = useState(() => {
    const saved = localStorage.getItem('faltula_show_saturday');
    return saved ? JSON.parse(saved) : false;
  });
  
  const { isSundayEnabled } = useSundayConfig();
  
  const getDays = () => {
    let days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    if (showSaturday) days.push('Sábado');
    if (isSundayEnabled()) days.push('Domingo');
    return days;
  };
  
  const days = getDays();

  // Sync showSaturday with localStorage
  const toggleSaturday = () => {
    const newValue = !showSaturday;
    setShowSaturday(newValue);
    localStorage.setItem('faltula_show_saturday', JSON.stringify(newValue));
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const getScheduleSlot = (day: number, timeSlot: number) => {
    return schedule.find(s => s.day === day && s.timeSlot === timeSlot);
  };

  const getSubjectWeeklyCount = (subjectId: string) => {
    return schedule.filter(s => s.subjectId === subjectId).length;
  };

  const handleAddSlot = async (day: number, timeSlot: number) => {
    if (!selectedSubject) {
      toast.error("Escolha uma matéria para adicionar ao horário.");
      return;
    }

    const subject = getSubjectById(selectedSubject);
    if (!isValidSubject(subject)) return;

    const currentWeeklyCount = getSubjectWeeklyCount(selectedSubject);
    
    const success = await addScheduleSlot({ subjectId: selectedSubject, day, timeSlot });
    
    if (success) {
      if (shouldShowNotification('grade')) {
        toast.success("📊 Aula adicionada!", {
          description: `Aula de ${getSubjectName(subject)} adicionada à sua grade horária.`,
        });
      }
    } else {
      if (currentWeeklyCount >= subject.weeklyHours) {
        toast.error(`${getSubjectName(subject)} já tem ${subject.weeklyHours} aula${subject.weeklyHours > 1 ? 's' : ''} na semana (limite máximo).`);
      } else {
        toast.error("Horário ocupado.");
      }
    }
  };

  const handleRemoveSlot = (slotId: string) => {
    removeScheduleSlot(slotId);
    if (shouldShowNotification('grade')) {
      toast.success("📊 Aula removida", {
        description: "A aula foi removida da sua grade horária.",
      });
    }
  };

  const clearSelectedSubject = () => {
    setSelectedSubject('');
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

  if (showConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Configuração de Horários</h2>
          <Button
            variant="outline"
            onClick={() => setShowConfig(false)}
            className="dark:bg-secondary dark:border-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
          >
            Voltar à Grade
          </Button>
        </div>
        <ScheduleConfig />
      </div>
    );
  }

  // Mobile Layout
  const MobileSchedule = () => (
    <div className="space-y-3">
      {days.map((day, dayIndex) => (
        <Card key={dayIndex} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-primary flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {day}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {timeSlots.map((timeSlot, timeIndex) => {
              const slot = getScheduleSlot(dayIndex, timeIndex);
              const subject = slot ? getSubjectById(slot.subjectId) : null;

              return (
                <div
                  key={timeIndex}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px] shrink-0">
                      {timeSlot.startTime}-{timeSlot.endTime}
                    </span>
                    {subject ? (
                      <Badge
                        className="text-white border-none text-xs px-2 py-1 truncate"
                        style={{ backgroundColor: subject.color }}
                      >
                        {getSubjectName(subject)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">Vazio</span>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant={subject ? "destructive" : "outline"}
                    className="h-8 w-8 p-0 ml-2 shrink-0"
                    onClick={() => {
                      if (slot) {
                        handleRemoveSlot(slot.id);
                      } else {
                        handleAddSlot(dayIndex, timeIndex);
                      }
                    }}
                  >
                    {subject ? (
                      <X className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Desktop Layout 
  const DesktopSchedule = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Grade Horária Semanal
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(true)}
            className="h-8"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configurar Horários
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4" style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
          {/* Header */}
          <div></div>
          {days.map(day => (
            <div key={day} className="font-semibold text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((timeSlot, timeIndex) => {
            const timeSlotElements = [];
            
            // Add time label
            timeSlotElements.push(
              <div key={`time-${timeIndex}`} className="font-medium text-sm text-gray-600 dark:text-gray-400 flex items-center justify-start p-2">
                <div className="text-center">
                  <div>{timeSlot.startTime}</div>
                  <div className="text-xs text-gray-400">até</div>
                  <div>{timeSlot.endTime}</div>
                </div>
              </div>
            );
            
            // Add day slots
            days.forEach((_, dayIndex) => {
              const slot = getScheduleSlot(dayIndex, timeIndex);
              const subject = slot ? getSubjectById(slot.subjectId) : null;

              timeSlotElements.push(
                <div
                  key={`${dayIndex}-${timeIndex}`}
                  className="min-h-[80px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center p-2 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer touch-manipulation select-none"
                  style={{ minHeight: '80px', userSelect: 'none', touchAction: 'manipulation' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (slot) {
                      handleRemoveSlot(slot.id);
                    } else {
                      handleAddSlot(dayIndex, timeIndex);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (slot) {
                      handleRemoveSlot(slot.id);
                    } else {
                      handleAddSlot(dayIndex, timeIndex);
                    }
                  }}
                >
                  {subject ? (
                    <Badge
                      className="text-white border-none relative group text-center"
                      style={{ backgroundColor: subject.color }}
                    >
                      <div className="text-xs font-medium">{getSubjectName(subject)}</div>
                      <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Badge>
                  ) : (
                    <Plus className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              );
            });
            
            return timeSlotElements;
          }).flat()}
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Clique em uma aula para removê-la ou em um espaço vazio para adicionar.</p>
        </div>
      </CardContent>
    </Card>
  );

  // Always show controls and import button, regardless of subjects
  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Top Controls - Always visible */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base md:text-lg">
              <div className="flex items-center">
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                <span className="dark:text-white">Grade Horária</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  className="h-8 dark:bg-secondary dark:border-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                >
                  <Download className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Importar</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowShareModal(true)}
                  className="h-8 dark:bg-secondary dark:border-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfig(true)}
                  className="h-8 dark:bg-secondary dark:border-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Horários</span>
                </Button>
                <Button
                  size="sm"
                  variant={showSaturday ? "default" : "outline"}
                  onClick={toggleSaturday}
                  className="h-8"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Sábado</span>
                </Button>
                
                {isSundayEnabled() && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-1 text-blue-700 dark:text-blue-300">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs font-medium">Domingo ativo</span>
                    </div>
                  </div>
                )}
                {/* View Toggle - only show on medium screens and up */}
                <div className="hidden md:flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setIsMobileView(false)}
                    className="h-8"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Grade
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          {subjects.length > 0 && (
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="flex-1 h-11">
                      <SelectValue placeholder="Selecione uma matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => {
                        const usage = getSubjectUsageInfo(subject.id);
                        return (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex items-center justify-between w-full space-x-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: subject.color }}
                                />
                                <span>{getSubjectName(subject)}</span>
                              </div>
                              {usage && (
                                <span className={`text-xs ${usage.isAtLimit ? 'text-red-500' : 'text-gray-500'}`}>
                                  {usage.current}/{usage.max}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedSubject && (
                    <Button 
                      variant="outline" 
                      onClick={clearSelectedSubject}
                      className="h-11 px-4"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                {/* Show usage info for selected subject */}
                {selectedSubject && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    {(() => {
                      const usage = getSubjectUsageInfo(selectedSubject);
                      const subject = getSubjectById(selectedSubject);
                      if (!usage || !subject) return null;
                      
                      if (usage.isAtLimit) {
                        return (
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>⚠️ Limite atingido:</strong> {getSubjectName(subject)} já tem {usage.max} aula{usage.max > 1 ? 's' : ''} na semana (máximo permitido).
                          </p>
                        );
                      }
                      
                      return (
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>📊 {getSubjectName(subject)}:</strong> {usage.current}/{usage.max} aulas na semana 
                          ({usage.remaining} restante{usage.remaining !== 1 ? 's' : ''})
                        </p>
                      );
                    })()}
                  </div>
                )}
                
              </div>
            </CardContent>
          )}
        </Card>

        {/* Show message if no subjects exist */}
        {subjects.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Você precisa cadastrar suas matérias antes de montar sua grade horária.
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Vá para a aba "Matérias" para começar ou importe uma grade existente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Display - Responsive - Only show if there are subjects */}
        {subjects.length > 0 && (
          <>
            <div className="md:hidden">
              <MobileSchedule />
            </div>
            
            <div className="hidden md:block">
              {isMobileView ? <MobileSchedule /> : <DesktopSchedule />}
            </div>
          </>
        )}
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

export default WeeklySchedule;
