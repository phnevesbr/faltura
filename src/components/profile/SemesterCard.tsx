import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, Plus, Archive, AlertTriangle } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useGamification } from '../../contexts/GamificationContext';
import { toast } from 'sonner';

interface SemesterCardProps {
  isEditing: boolean;
  formData: any;
  onFormDataChange: (data: any) => void;
}

const SemesterCard: React.FC<SemesterCardProps> = ({
  isEditing,
  formData,
  onFormDataChange
}) => {
  const { profile, getDaysUntilSemesterEnd, archiveSemester, startNewSemester } = useProfile();
  const { awardNewSemesterXP } = useGamification();
  const [showNewSemester, setShowNewSemester] = useState(false);
  const [newSemesterData, setNewSemesterData] = useState({
    semesterStart: '',
    semesterEnd: ''
  });

  const daysUntilEnd = getDaysUntilSemesterEnd();
  const isSemesterEnded = daysUntilEnd === 0 && profile?.semesterEnd && new Date() >= new Date(profile.semesterEnd);

  const handleArchiveSemester = async () => {
    await archiveSemester();
    toast.success('Semestre arquivado com sucesso!');
  };

  const handleStartNewSemester = async () => {
    if (!newSemesterData.semesterStart || !newSemesterData.semesterEnd) {
      toast.error('Preencha todas as datas do novo semestre');
      return;
    }
    
    await startNewSemester(newSemesterData.semesterStart, newSemesterData.semesterEnd);
    await awardNewSemesterXP();
    setShowNewSemester(false);
    setNewSemesterData({ semesterStart: '', semesterEnd: '' });
    toast.success('Novo semestre iniciado!');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Gestão de Semestre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Início do Semestre</Label>
              <Input
                type="date"
                value={formData.semesterStart}
                onChange={(e) => onFormDataChange({ ...formData, semesterStart: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fim do Semestre</Label>
              <Input
                type="date"
                value={formData.semesterEnd}
                onChange={(e) => onFormDataChange({ ...formData, semesterEnd: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status do Semestre */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Semestre Atual</h4>
                {daysUntilEnd > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Ativo</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile?.semesterStart && profile?.semesterEnd
                  ? `${new Date(profile.semesterStart).toLocaleDateString('pt-BR')} - ${new Date(profile.semesterEnd).toLocaleDateString('pt-BR')}`
                  : 'Período não configurado'
                }
              </p>
            </div>

            {/* Alerta de dias restantes */}
            {daysUntilEnd > 0 ? (
              <Alert className="border-green-200 bg-green-50">
                <Calendar className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  <strong>{daysUntilEnd} dias restantes</strong> no semestre atual
                </AlertDescription>
              </Alert>
            ) : isSemesterEnded ? (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-700">
                  Semestre finalizado! Considere arquivar e iniciar um novo.
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Ações do Semestre */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isSemesterEnded && (
                <Button 
                  onClick={handleArchiveSemester} 
                  variant="outline" 
                  className="flex-1 gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Arquivar Semestre
                </Button>
              )}
              
              {!showNewSemester ? (
                <Button 
                  onClick={() => setShowNewSemester(true)} 
                  variant="outline" 
                  className="flex-1 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Semestre
                </Button>
              ) : (
                <div className="w-full space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Configurar Novo Semestre</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Data de Início</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterStart}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterStart: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Data de Fim</Label>
                      <Input
                        type="date"
                        value={newSemesterData.semesterEnd}
                        onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterEnd: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleStartNewSemester} size="sm" className="flex-1">
                      Iniciar Semestre
                    </Button>
                    <Button 
                      onClick={() => setShowNewSemester(false)} 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SemesterCard;