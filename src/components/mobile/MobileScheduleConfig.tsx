import React from 'react';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, X, Clock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';

const MobileScheduleConfig: React.FC = () => {
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
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Configuração de Horários
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restaurar
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Time Slots Grid */}
      <div className="space-y-3">
        {timeSlots.map((slot, index) => (
          <Card
            key={slot.id}
            className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-white"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">
                  Aula {index + 1}
                </span>
                {timeSlots.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTimeSlot(slot.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label htmlFor={`start-${slot.id}`} className="text-xs font-medium text-gray-600">
                    Início
                  </Label>
                  <Input
                    id={`start-${slot.id}`}
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeChange(slot.id, 'startTime', e.target.value)}
                    className="h-10 text-sm mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`end-${slot.id}`} className="text-xs font-medium text-gray-600">
                    Fim
                  </Label>
                  <Input
                    id={`end-${slot.id}`}
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeChange(slot.id, 'endTime', e.target.value)}
                    className="h-10 text-sm mt-1"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  ⏱️ {slot.duration} minutos
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Add New Time Slot Button */}
      <div className="flex justify-center pt-2">
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
          className="flex items-center space-x-2 h-11 px-6"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Horário</span>
        </Button>
      </div>
      
      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> Configure os horários das suas aulas de acordo com o cronograma da sua instituição. 
            Você pode ter aulas de qualquer duração (30min, 45min, 1h, etc.).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileScheduleConfig;