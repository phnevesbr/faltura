import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useGamification } from '../../contexts/GamificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Plus, AlertTriangle, CalendarX, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';
import { useSundayConfig } from '../../hooks/useSundayConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';

interface SubjectOption {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  classCount: number;
  selected: boolean;
}

const AbsenceForm: React.FC = () => {
  const { subjects, schedule, absences, addAbsence } = useData();
  const { awardAbsenceRegistrationXP } = useGamification();
  const { shouldShowNotification } = useNotifications();
  const { isSundayEnabled } = useSundayConfig();
  const [selectedDate, setSelectedDate] = useState('');
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [selectAllAbsent, setSelectAllAbsent] = useState(true);

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
    
    // Verificar se o sábado está habilitado
    const showSaturday = localStorage.getItem('faltula_show_saturday');
    const isSaturdayEnabled = showSaturday ? JSON.parse(showSaturday) : false;
    
    // Se for sábado (adjustedDay === 5) e não estiver habilitado, retornar array vazio
    if (adjustedDay === 5 && !isSaturdayEnabled) return [];
    
    // Se for domingo (adjustedDay === 6) e não estiver habilitado, retornar array vazio
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
    
    // Verificar domingo apenas se não estiver habilitado
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Registrar Falta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddAbsence} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data da Falta</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {subjectOptions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Selecione uma data para ver as aulas disponíveis daquele dia.
              </p>
            ) : (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Aulas do dia {selectedDate ? (() => {
                      try {
                        const dateObj = new Date(selectedDate + 'T00:00:00');
                        if (isNaN(dateObj.getTime())) {
                          return selectedDate;
                        }
                        return format(dateObj, 'EEEE, dd/MM/yyyy', { locale: ptBR });
                      } catch (error) {
                        return selectedDate;
                      }
                    })() : ''}:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectAllAbsent ? 'Desmarcar todas' : 'Marcar todas'}
                  </Button>
                </div>
                
                <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                  {subjectOptions.map((option) => (
                    <div key={option.subjectId} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <Checkbox
                        id={`subject-${option.subjectId}`}
                        checked={option.selected}
                        onCheckedChange={() => toggleSubjectSelection(option.subjectId)}
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: option.subjectColor }}
                        />
                        <span className="font-medium">{option.subjectName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {option.classCount} aula{option.classCount > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {option.classCount}x
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-blue-500 mr-2" />
                    <p className="text-sm text-blue-800">
                      <strong>Seleção inteligente:</strong> Marque apenas as aulas em que você realmente faltou. 
                      Cada aula selecionada contará como uma falta individual.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={subjectOptions.length === 0 || !selectedDate}>
            <CalendarX className="h-4 w-4 mr-2" />
            Registrar Falta{subjectOptions.filter(o => o.selected).length > 0 ? ` (${subjectOptions.filter(o => o.selected).length} matéria${subjectOptions.filter(o => o.selected).length > 1 ? 's' : ''})` : ''}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AbsenceForm;