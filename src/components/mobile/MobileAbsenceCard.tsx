import React, { useState } from 'react';
import { GestureWrapper } from '../GestureWrapper';
import { useGesturesContext } from '../../contexts/GesturesContext';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  CalendarX, 
  Trash2, 
  Edit3,
  Eye,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../../hooks/use-toast';

interface MobileAbsenceCardProps {
  absence: any;
  onEdit?: (absence: any) => void;
  onDelete: (id: string, date: string) => void;
}

export const MobileAbsenceCard: React.FC<MobileAbsenceCardProps> = ({
  absence,
  onEdit,
  onDelete
}) => {
  const { subjects, addAbsence } = useData();
  const { addUndoAction, settings } = useGesturesContext();
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);

  const date = new Date(absence.date + 'T00:00:00');

  const handleSwipeLeft = () => {
    if (!settings.swipeEnabled) return;
    
    // Add undo action
    addUndoAction({
      id: `absence-${absence.id}`,
      type: 'delete',
      data: absence,
      onUndo: async () => {
        try {
          // Recreate the absence
          const subjectIds = absence.subjects.map((s: any) => s.subjectId);
          await addAbsence(absence.date, 10, subjectIds);
          toast({
            title: "Falta restaurada",
            description: `Falta do dia ${format(date, 'dd/MM')} foi restaurada!`
          });
        } catch (error) {
          toast({
            title: "Erro ao restaurar",
            description: "Não foi possível restaurar a falta",
            variant: "destructive"
          });
        }
      }
    });

    onDelete(absence.id, absence.date);
  };

  const handleSwipeRight = () => {
    if (!settings.swipeEnabled) return;
    if (onEdit) {
      onEdit(absence);
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

  return (
    <>
      <div className="mb-3">
        <div className="bg-red-50 border-red-200 border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <CalendarX className="h-4 w-4 text-red-500 mr-2" />
                <h3 className="font-semibold text-gray-900">
                  {format(date, 'dd/MM/yyyy')}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {format(date, 'EEEE', { locale: ptBR })}
              </p>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(true)}
              className="h-8 w-8 p-0 text-gray-600"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-gray-600">Matérias afetadas:</p>
            <div className="flex flex-wrap gap-1">
              {absence.subjects.map(({ subjectId, classCount }: any) => {
                const subject = subjects.find(s => s.id === subjectId);
                if (!subject) return null;
                
                return (
                  <Badge
                    key={subjectId}
                    className="text-white border-none text-xs"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.name} ({classCount})
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CalendarX className="h-5 w-5 text-red-500" />
              <span>Falta - {format(date, 'dd/MM/yyyy')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Data:</p>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600">
                  {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Matérias Afetadas:</p>
              <div className="space-y-2">
                {absence.subjects.map(({ subjectId, classCount }: any) => {
                  const subject = subjects.find(s => s.id === subjectId);
                  if (!subject) return null;
                  
                  return (
                    <div key={subjectId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="text-sm font-medium">{subject.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">{classCount} aula{classCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => onEdit(absence)}
                  className="flex-1"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(absence.id, absence.date);
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