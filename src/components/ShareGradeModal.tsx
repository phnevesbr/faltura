
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useScheduleConfig } from '../contexts/ScheduleConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { shareService, ShareOptions } from '../services/ShareService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { Share2, Download, CheckCircle } from 'lucide-react';

interface ShareGradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareGradeModal: React.FC<ShareGradeModalProps> = ({ open, onOpenChange }) => {
  const { subjects, schedule } = useData();
  const { timeSlots } = useScheduleConfig();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    includeSubjects: true,
    includeSchedule: true,
    includeTimeSlots: true,
    authorName: user?.user_metadata?.name || ''
  });

  const handleDownloadFile = () => {
    try {
      shareService.exportAsFile(
        subjects,
        schedule,
        timeSlots,
        shareOptions
      );
      
      // Dispatch event for achievements tracking
      window.dispatchEvent(new CustomEvent('fileDownloaded'));
      
      toast({
        title: "Arquivo baixado!",
        description: "Sua grade foi salva como arquivo. Envie este arquivo para compartilhar.",
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
      authorName: user?.user_metadata?.name || ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Compartilhar Grade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opções de compartilhamento */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">O que compartilhar?</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="subjects"
                  checked={shareOptions.includeSubjects}
                  onCheckedChange={(checked) => 
                    setShareOptions(prev => ({ ...prev, includeSubjects: !!checked }))
                  }
                />
                <Label htmlFor="subjects" className="text-sm">
                  Matérias ({subjects.length})
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={shareOptions.includeSchedule}
                  onCheckedChange={(checked) => 
                    setShareOptions(prev => ({ ...prev, includeSchedule: !!checked }))
                  }
                />
                <Label htmlFor="schedule" className="text-sm">
                  Grade horária ({schedule.length} aulas)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timeSlots"
                  checked={shareOptions.includeTimeSlots}
                  onCheckedChange={(checked) => 
                    setShareOptions(prev => ({ ...prev, includeTimeSlots: !!checked }))
                  }
                />
                <Label htmlFor="timeSlots" className="text-sm">
                  Configuração de horários ({timeSlots.length} períodos)
                </Label>
              </div>
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
            />
          </div>


          {/* Botões de ação */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleDownloadFile}
              disabled={!shareOptions.includeSubjects && !shareOptions.includeSchedule && !shareOptions.includeTimeSlots}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo
            </Button>
            <Button variant="outline" onClick={handleReset} className="px-6">
              Limpar
            </Button>
          </div>

          {/* Instruções */}
          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-xs text-green-700 dark:text-green-400">
              <strong>Como usar:</strong> Clique em "Baixar Arquivo" para salvar sua grade. 
              Envie o arquivo .faltula para outras pessoas e elas podem importar usando "Importar Grade".
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareGradeModal;
