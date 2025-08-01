import React, { useState } from 'react';
import { GestureWrapper } from '../GestureWrapper';
import { useGesturesContext } from '../../contexts/GesturesContext';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Clock, 
  Trash2, 
  Edit3,
  Eye,
  BookOpen
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getSubjectName } from '../../utils/subjectHelpers';

interface MobileScheduleCardProps {
  scheduleItem: any;
  onEdit?: (item: any) => void;
  onDelete: (id: string) => void;
}

export const MobileScheduleCard: React.FC<MobileScheduleCardProps> = ({
  scheduleItem,
  onEdit,
  onDelete
}) => {
  const { subjects, addScheduleSlot } = useData();
  const { timeSlots } = useScheduleConfig();
  const { addUndoAction, settings } = useGesturesContext();
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);

  const subject = subjects.find(s => s.id === scheduleItem.subjectId);
  const timeSlot = timeSlots[scheduleItem.timeSlot];

  const handleSwipeLeft = () => {
    if (!settings.swipeEnabled) return;
    
    // Add undo action
    addUndoAction({
      id: `schedule-${scheduleItem.id}`,
      type: 'delete',
      data: scheduleItem,
      onUndo: async () => {
        try {
          // Recreate the schedule item
          await addScheduleSlot({
            day: scheduleItem.day,
            timeSlot: scheduleItem.timeSlot,
            subjectId: scheduleItem.subjectId
          });
          toast({
            title: "Aula restaurada",
            description: `Aula de ${getSubjectName(subject)} foi restaurada!`
          });
        } catch (error) {
          toast({
            title: "Erro ao restaurar",
            description: "Não foi possível restaurar a aula",
            variant: "destructive"
          });
        }
      }
    });

    onDelete(scheduleItem.id);
  };

  const handleSwipeRight = () => {
    if (!settings.swipeEnabled) return;
    if (onEdit) {
      onEdit(scheduleItem);
    } else {
      setShowDetails(true);
    }
  };

  const handleDoubleTap = () => {
    if (!settings.doubleTapEnabled) return;
    setShowDetails(true);
  };

  const handleLongPress = () => {
    if (!settings.longPressEnabled) return;
    setShowDetails(true);
  };

  const swipeLeftContent = (
    <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center">
      <Trash2 className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">Deletar</span>
    </div>
  );

  const swipeRightContent = (
    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
      {onEdit ? <Edit3 className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
      <span className="text-sm font-medium">{onEdit ? 'Editar' : 'Detalhes'}</span>
    </div>
  );

  if (!subject || !timeSlot) return null;

  return (
    <>
      <GestureWrapper
        gestureConfig={{
          onSwipeLeft: handleSwipeLeft,
          onSwipeRight: handleSwipeRight,
          onDoubleTap: handleDoubleTap,
          onLongPress: handleLongPress,
          disabled: false
        }}
        swipeLeftContent={swipeLeftContent}
        swipeRightContent={swipeRightContent}
        className="mb-2"
      >
        <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: subject.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{getSubjectName(subject)}</p>
              <p className="text-xs text-gray-500">
                {timeSlot.startTime} - {timeSlot.endTime}
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(true)}
            className="h-8 w-8 p-0 text-gray-600 flex-shrink-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </GestureWrapper>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{getSubjectName(subject)}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Horário:</p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600">
                  {timeSlot.startTime} - {timeSlot.endTime}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Duração:</p>
              <p className="text-sm text-gray-600">{timeSlot.duration} minutos</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Cor da Matéria:</p>
              <div className="flex items-center space-x-2 mt-1">
                <div 
                  className="w-4 h-4 rounded-full border" 
                  style={{ backgroundColor: subject.color }}
                />
                <p className="text-sm text-gray-600">{subject.color}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => onEdit(scheduleItem)}
                  className="flex-1"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(scheduleItem.id);
                  setShowDetails(false);
                }}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};