import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useGamification } from '../../contexts/GamificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Calendar, Plus, Trash2, CalendarX, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useSundayConfig } from '../../hooks/useSundayConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MobileAbsenceCard } from './MobileAbsenceCard';

interface SubjectOption {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  classCount: number;
  selected: boolean;
}

const MobileAbsenceManager: React.FC = () => {
  const { subjects, schedule, absences, addAbsence, removeAbsence } = useData();
  const { awardAbsenceRegistrationXP } = useGamification();
  const { toast } = useToast();
  const { isSundayEnabled } = useSundayConfig();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [selectAllAbsent, setSelectAllAbsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSubjectsForDay = (date: string) => {
    const dateObj = new Date(date + 'T00:00:00');
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

    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    
    // Verificar se é fim de semana e se o sábado está habilitado
    const showSaturday = localStorage.getItem('faltula_show_saturday');
    const isSaturdayEnabled = showSaturday ? JSON.parse(showSaturday) : false;
    
    if ((dayOfWeek === 0 && !isSundayEnabled()) || (dayOfWeek === 6 && !isSaturdayEnabled)) {
      let description = "";
      if (dayOfWeek === 6 && !isSaturdayEnabled) {
        description = "Sábado não está habilitado na configuração da grade.";
      } else if (dayOfWeek === 0 && !isSundayEnabled()) {
        description = "Domingo não está habilitado na configuração da grade.";
      }
      
      toast({
        title: "Fim de semana",
        description,
        variant: "destructive",
      });
      setSelectedDate('');
      return;
    }

    const exists = absences.some(absence => absence.date === date);
    if (exists) {
      toast({
        title: "Falta já registrada",
        description: "Você já registrou falta para este dia.",
        variant: "destructive",
      });
      setSelectedDate('');
      return;
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
    
    if (isSubmitting) return;
    
    if (!selectedDate) {
      toast({
        title: "Selecione uma data",
        description: "Escolha o dia em que você faltou.",
        variant: "destructive",
      });
      return;
    }

    const selectedSubjects = subjectOptions.filter(option => option.selected);
    
    if (selectedSubjects.length === 0) {
      toast({
        title: "Selecione pelo menos uma aula",
        description: "Marque as aulas em que você faltou.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Registrar a falta com todas as matérias selecionadas (como no desktop)
      const subjectIds = selectedSubjects.map(option => option.subjectId);
      await addAbsence(selectedDate, 10, subjectIds);
      
      await awardAbsenceRegistrationXP();
      
      setSelectedDate('');
      setSubjectOptions([]);
      setShowForm(false);
      
      const totalClasses = selectedSubjects.reduce((sum, option) => sum + option.classCount, 0);
      
      toast({
        title: "Falta registrada!",
        description: `Registradas ${totalClasses} falta(s) em ${selectedSubjects.length} matéria(s).`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAbsence = (id: string, date: string) => {
    removeAbsence(id);
    toast({
      title: "Falta removida",
      description: `Falta do dia ${format(new Date(date), 'dd/MM')} foi removida.`,
    });
  };

  const sortedAbsences = [...absences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Faltas</h1>
          <p className="text-sm text-gray-500">{absences.length} registradas</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Registrar
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Falta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAbsence} className="space-y-4">
              <div>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="text-base"
                />
              </div>
              
              {subjectOptions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      Aulas do dia {format(new Date(selectedDate + 'T00:00:00'), 'dd/MM', { locale: ptBR })}:
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="h-7 text-xs"
                    >
                      {selectAllAbsent ? 'Desmarcar' : 'Marcar todas'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 border rounded-lg p-2 bg-gray-50 max-h-40 overflow-y-auto">
                    {subjectOptions.map((option) => (
                      <div key={option.subjectId} className="flex items-center space-x-2 p-2 bg-white rounded border">
                        <Checkbox
                          id={`mobile-subject-${option.subjectId}`}
                          checked={option.selected}
                          onCheckedChange={() => toggleSubjectSelection(option.subjectId)}
                        />
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.subjectColor }}
                          />
                          <span className="font-medium text-sm truncate">{option.subjectName}</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {option.classCount}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    {subjectOptions.length > 0 
                      ? "Marque apenas as aulas em que você realmente faltou. Cada aula selecionada contará individualmente."
                      : "Selecione uma data para ver as aulas disponíveis daquele dia."
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={subjectOptions.length === 0 || !selectedDate || isSubmitting}
                >
                  <CalendarX className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Registrando...' : `Registrar${subjectOptions.filter(o => o.selected).length > 0 ? ` (${subjectOptions.filter(o => o.selected).length})` : ''}`}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de faltas */}
      <div className="space-y-3">
        {absences.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center text-sm">
                Nenhuma falta registrada
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowForm(true)}
                className="mt-2 text-primary"
              >
                Registrar primeira falta
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedAbsences.map(absence => (
            <MobileAbsenceCard
              key={absence.id}
              absence={absence}
              onDelete={handleRemoveAbsence}
            />
          ))
        )}
      </div>

      {/* Dica */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Como funciona:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Selecione o dia que você faltou</li>
                <li>O sistema registra em todas as aulas do dia</li>
                <li>Acompanhe os limites na aba Matérias</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileAbsenceManager;