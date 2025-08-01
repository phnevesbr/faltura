import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { shareService, ShareOptions } from '../../services/ShareService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { Share2, Download, CheckCircle } from 'lucide-react';

interface MobileShareGradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileShareGradeModal: React.FC<MobileShareGradeModalProps> = ({ open, onOpenChange }) => {
  const { subjects, schedule } = useData();
  const { timeSlots } = useScheduleConfig();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    includeSubjects: true,
    includeSchedule: true,
    includeTimeSlots: true,
    authorName: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante'
  });

  const handleDownloadFile = () => {
    try {
      shareService.exportAsFile(
        subjects,
        schedule,
        timeSlots,
        shareOptions
      );
      
      window.dispatchEvent(new CustomEvent('fileDownloaded'));
      
      toast({
        title: "Arquivo baixado!",
        description: "Sua grade foi salva como arquivo.",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao gerar arquivo",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setShareOptions({
      includeSubjects: true,
      includeSchedule: true,
      includeTimeSlots: true,
      authorName: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante'
    });
    
    toast({
      title: "Configurações limpas",
      description: "As opções foram restauradas para o padrão.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Share2 className="h-5 w-5 mr-2" />
            Compartilhar Grade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opções de compartilhamento */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">O que compartilhar?</Label>
            
            <div className="space-y-3">
              <Card className="p-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="subjects"
                    checked={shareOptions.includeSubjects}
                    onCheckedChange={(checked) => 
                      setShareOptions(prev => ({ ...prev, includeSubjects: !!checked }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="subjects" className="text-sm font-medium">
                      Matérias
                    </Label>
                    <p className="text-xs text-gray-500">{subjects.length} matérias</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="schedule"
                    checked={shareOptions.includeSchedule}
                    onCheckedChange={(checked) => 
                      setShareOptions(prev => ({ ...prev, includeSchedule: !!checked }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="schedule" className="text-sm font-medium">
                      Grade horária
                    </Label>
                    <p className="text-xs text-gray-500">{schedule.length} aulas</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="timeSlots"
                    checked={shareOptions.includeTimeSlots}
                    onCheckedChange={(checked) => 
                      setShareOptions(prev => ({ ...prev, includeTimeSlots: !!checked }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="timeSlots" className="text-sm font-medium">
                      Configuração de horários
                    </Label>
                    <p className="text-xs text-gray-500">{timeSlots.length} períodos</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Nome do autor */}
          <div className="space-y-2">
            <Label htmlFor="authorName" className="text-sm font-semibold">
              Seu nome (opcional)
            </Label>
            <Input
              id="authorName"
              placeholder="Digite seu nome..."
              value={shareOptions.authorName}
              onChange={(e) => 
                setShareOptions(prev => ({ ...prev, authorName: e.target.value }))
              }
              className="h-11"
            />
          </div>

          {/* Informações sobre o método */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    Compartilhamento por arquivo
                  </p>
                  <p className="text-xs text-blue-700">
                    Sua grade será salva como um arquivo .faltula que pode ser enviado e importado em qualquer dispositivo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="space-y-2">
            <Button 
              onClick={handleDownloadFile}
              disabled={!shareOptions.includeSubjects && !shareOptions.includeSchedule && !shareOptions.includeTimeSlots}
              className="w-full h-12 text-base"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleReset} className="h-11">
                Limpar
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
                Cancelar
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <p className="text-xs text-green-700">
                <strong>Como usar:</strong> Clique em "Baixar Arquivo" para salvar sua grade. 
                Envie o arquivo .faltula para outras pessoas e elas podem importar usando "Importar Grade".
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileShareGradeModal;