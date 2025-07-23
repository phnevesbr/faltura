import React, { useState } from 'react';
import { GestureWrapper } from '../GestureWrapper';
import { useGesturesContext } from '../../contexts/GesturesContext';
import { useNotes } from '../../contexts/NotesContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Edit3,
  Eye,
  MoreHorizontal,
  Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface MobileNoteCardProps {
  note: any;
  onEdit: (note: any) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

export const MobileNoteCard: React.FC<MobileNoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onToggleComplete
}) => {
  const { addUndoAction, settings } = useGesturesContext();
  const { addNote, updateNote } = useNotes();
  const [showDetails, setShowDetails] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const typeLabels = {
    exam: 'Prova',
    assignment: 'Trabalho',
    activity: 'Atividade'
  };

  const typeIcons = {
    exam: BookOpen,
    assignment: FileText,
    activity: CheckCircle2
  };

  const typeColors = {
    exam: 'bg-red-500',
    assignment: 'bg-blue-500',
    activity: 'bg-green-500'
  };

  const Icon = typeIcons[note.type];

  const handleSwipeLeft = () => {
    if (!settings.swipeEnabled) return;
    
    // Add undo action
    addUndoAction({
      id: `note-${note.id}`,
      type: 'delete',
      data: note,
      onUndo: async () => {
        try {
          // Recreate the note
          await addNote({
            title: note.title,
            description: note.description,
            type: note.type,
            date: note.date,
            priority: note.priority,
            status: note.status,
            completed: note.completed
          });
          console.log('Note restored successfully');
        } catch (error) {
          console.error('Error restoring note:', error);
        }
      }
    });

    onDelete(note.id);
  };

  const handleSwipeRight = () => {
    if (!settings.swipeEnabled) return;
    setShowDetails(true);
  };

  const handleDoubleTap = () => {
    if (!settings.doubleTapEnabled) return;
    
    setIsCompleting(true);
    onToggleComplete(note.id, note.completed);
    
    // Reset animation after delay
    setTimeout(() => setIsCompleting(false), 400);
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
      <Eye className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">Detalhes</span>
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
        className="mb-2"
      >
        <div
          className={cn(
            "p-3 border border-border rounded-lg transition-all duration-200 bg-card",
            note.completed ? 'opacity-75' : '',
            isCompleting && 'animate-bounce-check'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start space-x-2 flex-1 min-w-0">
              <Icon className={cn(
                "h-4 w-4 mt-0.5 flex-shrink-0 transition-colors duration-200",
                note.completed ? 'text-muted-foreground' : 'text-foreground',
                isCompleting && 'text-green-500'
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start flex-col space-y-1 mb-1">
                  <h4 className={cn(
                    "font-medium text-sm w-full break-words transition-all duration-200",
                    note.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  )}>
                    {note.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge className={`${typeColors[note.type]} text-white border-none text-xs`}>
                      {typeLabels[note.type]}
                    </Badge>
                    <Badge className={`text-xs px-1 py-0.5 ${
                      note.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                      note.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {note.status === 'pending' ? 'Pendente' : 
                       note.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {format(new Date(note.date), "dd/MM/yyyy")}
                </p>
                {note.description && (
                  <p className={cn(
                    "text-xs line-clamp-2 break-words",
                    note.completed ? 'text-muted-foreground' : 'text-muted-foreground'
                  )}>
                    {note.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDoubleTap()}
                className="h-6 w-6 p-0"
              >
                <CheckCircle2 className={cn(
                  "h-3 w-3 transition-colors duration-200",
                  note.completed ? 'text-green-600' : 'text-gray-400'
                )} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(note)}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="h-3 w-3 text-muted-foreground" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(true)}
                className="h-6 w-6 p-0"
              >
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </GestureWrapper>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span>{note.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Tipo:</p>
              <Badge className={`${typeColors[note.type]} text-white border-none`}>
                {typeLabels[note.type]}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground">Data:</p>
              <p className="text-sm text-muted-foreground">{format(new Date(note.date), "dd/MM/yyyy")}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Status:</p>
              <Badge className={`text-xs ${
                note.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                note.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {note.status === 'pending' ? 'Pendente' : 
                 note.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
              </Badge>
            </div>

            {note.description && (
              <div>
                <p className="text-sm font-medium text-foreground">Descrição:</p>
                <p className="text-sm text-muted-foreground">{note.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onEdit(note)}
                className="w-full h-10 flex items-center justify-center"
              >
                <Edit3 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Editar</span>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={note.status === 'in_progress' ? "secondary" : "outline"}
                  onClick={() => {
                    const newStatus = note.status === 'in_progress' ? 'pending' : 'in_progress';
                    updateNote(note.id, { 
                      status: newStatus,
                      completed: false
                    });
                  }}
                  className="w-full h-10 flex items-center justify-center text-xs"
                >
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {note.status === 'in_progress' ? 'Pendente' : 'Em Andamento'}
                  </span>
                </Button>
                <Button
                  variant={note.completed ? "secondary" : "default"}
                  onClick={() => handleDoubleTap()}
                  className="w-full h-10 flex items-center justify-center text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{note.completed ? 'Reabrir' : 'Concluir'}</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};