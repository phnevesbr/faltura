import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit, Settings, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';
import ColorPicker from '../ColorPicker';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "../ui/sheet";

interface EditSubjectModalProps {
  subject: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({ 
  subject, 
  open, 
  onOpenChange 
}) => {
  const { updateSubject } = useData();
  const { shouldShowNotification } = useNotifications();

  const [formData, setFormData] = useState({
    name: '',
    weeklyHours: 1,
    maxAbsences: 5,
    useCustomLimit: false,
    color: '#8B5CF6'
  });

  const getDefaultMaxAbsences = (weeklyHours: number): number => {
    if (weeklyHours >= 4) return 20;
    if (weeklyHours === 3) return 15;
    if (weeklyHours === 2) return 10;
    return 5;
  };

  // Populate form when subject changes
  useEffect(() => {
    if (subject) {
      const defaultLimit = getDefaultMaxAbsences(subject.weeklyHours);
      setFormData({
        name: subject.name,
        weeklyHours: subject.weeklyHours,
        maxAbsences: subject.maxAbsences,
        useCustomLimit: subject.maxAbsences !== defaultLimit,
        color: subject.color
      });
    }
  }, [subject]);

  const handleWeeklyHoursChange = (hours: number) => {
    setFormData(prev => ({
      ...prev,
      weeklyHours: hours,
      maxAbsences: prev.useCustomLimit ? prev.maxAbsences : getDefaultMaxAbsences(hours)
    }));
  };

  const handleCustomLimitToggle = (useCustom: boolean) => {
    setFormData(prev => ({
      ...prev,
      useCustomLimit: useCustom,
      maxAbsences: useCustom ? prev.maxAbsences : getDefaultMaxAbsences(prev.weeklyHours)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Digite o nome da matéria.");
      return;
    }

    if (formData.maxAbsences < 1 || formData.maxAbsences > 50) {
      toast.error("O limite de faltas deve estar entre 1 e 50.");
      return;
    }

    updateSubject(subject.id, {
      name: formData.name,
      weeklyHours: formData.weeklyHours,
      maxAbsences: formData.maxAbsences,
      color: formData.color
    });

    if (shouldShowNotification('subjects')) {
      toast.success("📚 Matéria atualizada!", {
        description: "As informações da matéria foram atualizadas.",
      });
    }

    onOpenChange(false);
  };

  if (!subject) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Edit className="h-4 w-4 mr-2 text-primary" />
            Editar Matéria
          </SheetTitle>
          <SheetDescription>
            Atualize as informações da matéria
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome da Matéria</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Matemática"
                className="h-11"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weeklyHours" className="text-sm font-medium">Aulas por Semana</Label>
                <Select
                  value={formData.weeklyHours.toString()}
                  onValueChange={(value) => handleWeeklyHoursChange(parseInt(value))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 aula</SelectItem>
                    <SelectItem value="2">2 aulas</SelectItem>
                    <SelectItem value="3">3 aulas</SelectItem>
                    <SelectItem value="4">4+ aulas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Cor da Matéria</Label>
                <div className="flex items-center space-x-2">
                  <ColorPicker
                    selectedColor={formData.color}
                    onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
                  />
                  <div className="flex-1 text-sm text-muted-foreground">
                    Cor para identificação visual
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 border rounded-lg p-4 bg-background">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  Limite de Faltas
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant={formData.useCustomLimit ? "default" : "outline"}
                  onClick={() => handleCustomLimitToggle(!formData.useCustomLimit)}
                  className="h-8 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {formData.useCustomLimit ? 'Personalizado' : 'Padrão'}
                </Button>
              </div>
              
              {formData.useCustomLimit ? (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxAbsences}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAbsences: parseInt(e.target.value) || 1 }))}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Defina quantas faltas são necessárias para reprovar nesta matéria
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">
                    <strong>Padrão:</strong> {getDefaultMaxAbsences(formData.weeklyHours)} faltas máximas
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Baseado em 25% da carga horária semestral
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button type="submit" className="h-11">
              Atualizar Matéria
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="ghost" className="h-9">Fechar</Button>
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};