import React, { useState } from 'react';
import { GestureWrapper } from '../GestureWrapper';
import { useGesturesContext } from '../../contexts/GesturesContext';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BookOpen,
  Clock,
  Users,
  FileText
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import ColorPicker from '../ColorPicker';

interface MobileSubjectCardProps {
  subject: any;
  onEdit: (subject: any) => void;
  onDelete: (id: string, name: string) => void;
}

export const MobileSubjectCard: React.FC<MobileSubjectCardProps> = ({
  subject,
  onEdit,
  onDelete
}) => {
  const { updateSubject, addSubject } = useData();
  const { addUndoAction, settings } = useGesturesContext();
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const getAbsenceStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return { status: 'failed', color: 'text-red-500', icon: XCircle };
    if (percentage >= 90) return { status: 'danger', color: 'text-red-500', icon: AlertTriangle };
    if (percentage >= 75) return { status: 'warning', color: 'text-orange-500', icon: AlertTriangle };
    return { status: 'ok', color: 'text-green-500', icon: CheckCircle };
  };

  const { status, color, icon: Icon } = getAbsenceStatus(subject.currentAbsences, subject.maxAbsences);
  const percentage = Math.round((subject.currentAbsences / subject.maxAbsences) * 100);

  const handleSwipeLeft = () => {
    if (!settings.swipeEnabled) return;
    setShowNotes(true);
  };

  const handleSwipeRight = () => {
    if (!settings.swipeEnabled) return;
    
    // Add undo action
    addUndoAction({
      id: `subject-${subject.id}`,
      type: 'delete',
      data: subject,
      onUndo: async () => {
        try {
          // Recreate the subject
          await addSubject({
            name: subject.name,
            weeklyHours: subject.weeklyHours,
            color: subject.color,
            maxAbsences: subject.maxAbsences
          });
          toast({
            title: "Matéria restaurada",
            description: `${subject.name} foi restaurada com sucesso!`
          });
        } catch (error) {
          toast({
            title: "Erro ao restaurar",
            description: "Não foi possível restaurar a matéria",
            variant: "destructive"
          });
        }
      }
    });

    onDelete(subject.id, subject.name);
  };

  const handleDoubleTap = () => {
    if (!settings.doubleTapEnabled) return;
    // Double tap could mark attendance or toggle favorite
    toast({
      title: "Marcado como favorito",
      description: `${subject.name} foi adicionado aos favoritos`
    });
  };

  const handleLongPress = () => {
    if (!settings.longPressEnabled) return;
    setShowDetails(true);
  };

  const swipeLeftContent = (
    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
      <FileText className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">Anotações - Matéria</span>
    </div>
  );

  const swipeRightContent = (
    <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center">
      <Trash2 className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">Deletar</span>
    </div>
  );

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
        className="mb-3"
      >
        <div className="bg-white p-4 border rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: subject.color }}
                />
                <h3 className="font-semibold text-gray-900 truncate">{subject.name}</h3>
              </div>
              <p className="text-xs text-gray-500">
                {subject.weeklyHours} aula{subject.weeklyHours > 1 ? 's' : ''}/semana
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              <ColorPicker
                selectedColor={subject.color}
                onColorChange={(color) => {
                  updateSubject(subject.id, { color });
                  toast({ title: "Cor atualizada!" });
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(subject)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Faltas:</span>
              <div className={`flex items-center ${color}`}>
                <Icon className="h-3 w-3 mr-1" />
                <span className="text-sm font-semibold">
                  {subject.currentAbsences}/{subject.maxAbsences}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  percentage >= 100 ? 'bg-red-500' :
                  percentage >= 90 ? 'bg-red-500' :
                  percentage >= 75 ? 'bg-orange-500' :
                  'bg-green-500'
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              {percentage >= 100 ? 'REPROVADO' :
               percentage >= 90 ? 'PERIGO!' :
               percentage >= 75 ? 'ATENÇÃO' :
               'Normal'}
            </p>
          </div>
        </div>
      </GestureWrapper>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: subject.color }}
              />
              <span>{subject.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Aulas/Semana:</p>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">{subject.weeklyHours}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Status de Faltas:</p>
                <div className={`flex items-center space-x-1 ${color}`}>
                  <Icon className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    {percentage >= 100 ? 'Reprovado' :
                     percentage >= 90 ? 'Perigo' :
                     percentage >= 75 ? 'Atenção' :
                     'Normal'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Faltas:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {subject.currentAbsences} de {subject.maxAbsences} máximas
                </span>
                <span className="text-sm font-medium">
                  {percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    percentage >= 100 ? 'bg-red-500' :
                    percentage >= 90 ? 'bg-red-500' :
                    percentage >= 75 ? 'bg-orange-500' :
                    'bg-green-500'
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onEdit(subject)}
                className="flex-1"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNotes(true)}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Anotações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Anotações - {subject.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Anotações relacionadas à {subject.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Em breve você poderá ver e criar anotações específicas para esta matéria
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};