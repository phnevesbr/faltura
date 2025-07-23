
import React from 'react';
import { useScheduleConfig } from '../contexts/ScheduleConfigContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, X, Clock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';

const ScheduleConfig: React.FC = () => {
  const { timeSlots, updateTimeSlot, addTimeSlot, removeTimeSlot, resetToDefault } = useScheduleConfig();
  const { shouldShowNotification } = useNotifications();

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    const slot = timeSlots.find(s => s.id === id);
    if (!slot) return;

    const startTime = field === 'startTime' ? value : slot.startTime;
    const endTime = field === 'endTime' ? value : slot.endTime;

    if (startTime && endTime) {
      updateTimeSlot(id, startTime, endTime);
      
      if (shouldShowNotification('grade')) {
        toast.success("📊 Horário atualizado!", {
          description: `Horário alterado para ${startTime} - ${endTime}`,
        });
      }
    }
  };

  const handleReset = () => {
    resetToDefault();
    toast.success("Horários restaurados", {
      description: "Os horários foram restaurados para o padrão.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Configuração de Horários
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 dark:bg-secondary dark:border-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restaurar Padrão
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-700">
                      Aula {index + 1}
                    </span>
                    {timeSlots.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTimeSlot(slot.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`start-${slot.id}`} className="text-xs">
                        Início
                      </Label>
                      <Input
                        id={`start-${slot.id}`}
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleTimeChange(slot.id, 'startTime', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`end-${slot.id}`} className="text-xs">
                        Fim
                      </Label>
                      <Input
                        id={`end-${slot.id}`}
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleTimeChange(slot.id, 'endTime', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      {slot.duration} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center pt-4">
              <Button
              onClick={() => {
                addTimeSlot();
                if (shouldShowNotification('grade')) {
                  toast.success("📊 Novo horário adicionado!", {
                    description: "Um novo horário foi criado na sua grade.",
                  });
                }
              }}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Horário</span>
              </Button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Configure os horários das suas aulas de acordo com o cronograma da sua instituição. 
              Você pode ter aulas de qualquer duração (30min, 45min, 1h, etc.).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleConfig;
