import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { shareService, SharedGradeData } from '../../services/ShareService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Upload, AlertTriangle, CheckCircle, Calendar, BookOpen, Clock, FileText } from 'lucide-react';
import { useAchievements } from '../../contexts/AchievementsContext';
import { useNotifications } from '../../hooks/useNotifications';

interface MobileImportGradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileImportGradeModal: React.FC<MobileImportGradeModalProps> = ({ open, onOpenChange }) => {
  const { subjects, schedule, addSubject, addScheduleSlot } = useData();
  const { updateTimeSlots, timeSlots } = useScheduleConfig();
  const { trackDataImport } = useAchievements();
  const { toast } = useToast();
  const { shouldShowNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewData, setPreviewData] = useState<SharedGradeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [subjectMapping, setSubjectMapping] = useState<{ [oldId: string]: string }>({});
  const [importStep, setImportStep] = useState<'idle' | 'subjects' | 'schedule' | 'complete'>('idle');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      const data = await shareService.importFromFile(file);
      setPreviewData(data);
      
      toast({
        title: "Arquivo válido!",
        description: "Grade carregada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Arquivo inválido",
        variant: "destructive"
      });
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle schedule import after subjects are added
  React.useEffect(() => {
    if (importStep === 'schedule' && previewData && Object.keys(subjectMapping).length > 0) {
      const processScheduleImport = async () => {
        let newSlotsCount = 0;
        let failedSlots = 0;
        
        if (previewData.data.schedule.length > 0) {
          for (const slot of previewData.data.schedule) {
            // Check for conflicts
            const conflict = schedule.some(s => s.day === slot.day && s.timeSlot === slot.timeSlot);
            if (conflict) {
              failedSlots++;
              continue;
            }

            const mappedSubjectId = subjectMapping[slot.subjectId];
            if (!mappedSubjectId) {
              failedSlots++;
              continue;
            }
            
            const success = addScheduleSlot({
              subjectId: mappedSubjectId,
              day: slot.day,
              timeSlot: slot.timeSlot
            }, true); // Skip XP reward during import
            
            if (success) {
              newSlotsCount++;
            } else {
              failedSlots++;
            }
          }
        }

        // Única notificação de sucesso
        setTimeout(() => {
          if (shouldShowNotification('grade')) {
            toast({
              title: "📊 Grade importada com sucesso!",
              description: `${Object.keys(subjectMapping).length} matérias e ${newSlotsCount} aulas foram adicionadas.`,
            });
          }
        }, 100);

        // Track data import achievement
        setTimeout(() => {
          trackDataImport();
        }, 500);

        setImportStep('complete');
        setIsImporting(false);
        onOpenChange(false);
        handleReset();
      };

      processScheduleImport();
    }
  }, [importStep, subjectMapping, previewData, schedule, addScheduleSlot, toast, onOpenChange, trackDataImport]);

  const handleImport = async () => {
    if (!previewData || isImporting) return;

    try {
      setIsImporting(true);
      setImportStep('subjects');

      // Import time slots configuration FIRST
      if (previewData.data.timeSlots.length > 0) {
        updateTimeSlots(previewData.data.timeSlots);
      }

      // Create subject mapping for proper schedule import
      const newSubjectMapping: { [oldId: string]: string } = {};

      // Import subjects and create mapping
      if (previewData.data.subjects.length > 0) {
        for (const importedSubject of previewData.data.subjects) {
          const existingSubject = subjects.find(s => s.name === importedSubject.name);
          
          if (existingSubject) {
            // Subject already exists, map old ID to existing ID
            newSubjectMapping[importedSubject.id] = existingSubject.id;
          } else {
            // Create new subject and get the returned subject with its ID
            const newSubject = await addSubject({
              name: importedSubject.name,
              weeklyHours: importedSubject.weeklyHours,
              color: importedSubject.color,
              maxAbsences: importedSubject.maxAbsences
            });
            
            if (newSubject) {
              newSubjectMapping[importedSubject.id] = newSubject.id;
            }
          }
        }
      }

      // Set mapping and trigger schedule import
      setSubjectMapping(newSubjectMapping);
      setImportStep('schedule');
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: "Tente novamente.",
        variant: "destructive"
      });
      setIsImporting(false);
      setImportStep('idle');
    }
  };

  const handleReset = () => {
    setPreviewData(null);
    setIsImporting(false);
    setSubjectMapping({});
    setImportStep('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Upload className="h-5 w-5 mr-2" />
            Importar Grade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload de arquivo */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Selecionar arquivo
            </Label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".faltula"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button 
              onClick={handleSelectFile}
              disabled={isLoading}
              variant="outline"
              className="w-full h-24 border-dashed border-2 hover:bg-gray-50"
            >
              <div className="flex flex-col items-center space-y-2">
                <FileText className="h-8 w-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isLoading ? 'Carregando...' : 'Clique para selecionar'}
                  </p>
                  <p className="text-xs text-gray-500">Arquivos .faltula</p>
                </div>
              </div>
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Selecione o arquivo .faltula que você recebeu para importar a grade.
            </p>
          </div>

          {/* Preview dos dados */}
          {previewData && (
            <>
              {/* Informações gerais */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Grade Encontrada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {previewData.authorName && (
                    <p className="text-sm">
                      <strong>Por:</strong> {previewData.authorName}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Data:</strong> {new Date(previewData.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded p-2">
                      <BookOpen className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-medium">{previewData.data.subjects.length}</p>
                      <p className="text-xs text-gray-500">matérias</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <Calendar className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-medium">{previewData.data.schedule.length}</p>
                      <p className="text-xs text-gray-500">aulas</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-medium">{previewData.data.timeSlots.length}</p>
                      <p className="text-xs text-gray-500">horários</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Matérias */}
              {previewData.data.subjects.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Matérias ({previewData.data.subjects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {previewData.data.subjects.slice(0, 8).map((subject, index) => (
                        <Badge 
                          key={index}
                          className="text-white text-xs"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.name}
                        </Badge>
                      ))}
                      {previewData.data.subjects.length > 8 && (
                        <Badge variant="secondary" className="text-xs">
                          +{previewData.data.subjects.length - 8}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aviso de conflitos */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-700">
                      <p className="font-medium mb-1">Atenção:</p>
                      <p>Apenas dados que não conflitam com os atuais serão importados.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de ação */}
              <div className="space-y-2">
                <Button 
                  onClick={handleImport} 
                  className="w-full h-12 text-base"
                  disabled={isImporting}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importando...' : 'Importar Grade'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleReset} 
                    className="h-11"
                    disabled={isImporting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)} 
                    className="h-11"
                    disabled={isImporting}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileImportGradeModal;