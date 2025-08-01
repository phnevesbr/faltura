import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useScheduleConfig } from '../contexts/ScheduleConfigContext';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { shareService, SharedGradeData } from '../services/ShareService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Upload, AlertTriangle, CheckCircle, Calendar, BookOpen, Clock, FileText } from 'lucide-react';
import { useAchievements } from '../contexts/AchievementsContext';
import { useNotifications } from '../hooks/useNotifications';

interface ImportGradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportGradeModal: React.FC<ImportGradeModalProps> = ({ open, onOpenChange }) => {
  const { subjects, schedule, addSubject, addScheduleSlot } = useData();
  const { updateTimeSlots, timeSlots } = useScheduleConfig();
  const { awardGradeImportXP } = useGamification();
  const { trackDataImport } = useAchievements();
  const { shouldShowNotification } = useNotifications();
  const { user } = useAuth();
  const { checkRateLimit } = useRateLimit();
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
      
      toast.success("Arquivo válido!", {
        description: "Grade carregada com sucesso.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Arquivo inválido");
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
            toast.success("📊 Grade importada com sucesso!", {
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
        await awardGradeImportXP();
        onOpenChange(false);
        handleReset();
      };

      processScheduleImport();
    }
  }, [importStep, subjectMapping, previewData, schedule, addScheduleSlot, toast, onOpenChange, trackDataImport]);

  const handleImport = async () => {
    if (!previewData || isImporting) return;

    // Check rate limit for grade imports
    const canProceed = await checkRateLimit('import_grade', { userId: user?.id });
    if (!canProceed) {
      return; // Rate limit error already shown
    }

    try {
      setIsImporting(true);
      setImportStep('subjects');
      
      // Desabilitar notificações temporariamente
      const originalToast = toast;
      const silentToast = () => {};

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
      toast.error("Erro na importação. Tente novamente.");
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
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importar Grade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload de arquivo */}
          <div className="space-y-2">
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
              className="w-full h-20 border-dashed border-2 hover:bg-muted"
            >
              <div className="flex flex-col items-center space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isLoading ? 'Carregando...' : 'Clique para selecionar arquivo'}
                  </p>
                  <p className="text-xs text-muted-foreground">Arquivos .faltula</p>
                </div>
              </div>
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Selecione o arquivo .faltula que você recebeu para importar a grade.
            </p>
          </div>

          {/* Preview dos dados */}
          {previewData && (
            <>
              {/* Informações gerais */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                    Grade Encontrada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {previewData.authorName && (
                    <p className="text-sm">
                      <strong>Criada por:</strong> {previewData.authorName}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Data:</strong> {new Date(previewData.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {previewData.data.subjects.length} matérias
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {previewData.data.schedule.length} aulas
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {previewData.data.timeSlots.length} horários
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Matérias */}
              {previewData.data.subjects.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Matérias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {previewData.data.subjects.map((subject, index) => (
                        <Badge 
                          key={index}
                          className="text-white text-xs"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aviso de conflitos */}
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    <p className="font-medium mb-1">Atenção:</p>
                    <p>Apenas matérias e horários que não conflitam com os atuais serão importados.</p>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex space-x-2">
                <Button 
                  onClick={handleImport} 
                  className="flex-1"
                  disabled={isImporting}
                >
                  {isImporting ? 'Importando...' : 'Importar Grade'}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isImporting}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportGradeModal;
