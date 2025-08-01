import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useClass } from '@/contexts/ClassContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Bell, Plus } from 'lucide-react';

interface NotificationTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationTypeModal: React.FC<NotificationTypeModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertPriority, setAlertPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentClass, fetchClassAlerts } = useClass();

  const resetState = () => {
    setAlertTitle('');
    setAlertMessage('');
    setAlertPriority('medium');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleCreateAlert = async () => {
    if (!currentClass || !alertTitle.trim() || !alertMessage.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('class_alerts')
        .insert([{
          class_id: currentClass.id,
          user_id: user.id,
          title: alertTitle,
          message: alertMessage,
          priority: alertPriority,
        }]);

      if (error) throw error;

      toast({
        title: "Alerta enviado com sucesso!",
        description: "Seu alerta foi enviado para todos os membros da turma.",
      });

      // Recarregar alertas
      if (currentClass) {
        await fetchClassAlerts(currentClass.id);
      }

      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar alerta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Novo Alerta/Mensagem
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="alert-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Título
            </Label>
            <Input
              id="alert-title"
              value={alertTitle}
              onChange={(e) => setAlertTitle(e.target.value)}
              placeholder="Ex: Prova importante amanhã"
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="alert-message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mensagem
            </Label>
            <Textarea
              id="alert-message"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="Digite sua mensagem para a turma..."
              className="mt-1 min-h-[100px]"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="alert-priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Prioridade
            </Label>
            <Select 
              value={alertPriority} 
              onValueChange={(value: 'low' | 'medium' | 'high') => setAlertPriority(value)}
              disabled={isLoading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Baixa</SelectItem>
                <SelectItem value="medium">🟡 Média</SelectItem>
                <SelectItem value="high">🔴 Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateAlert} 
            className="flex-1"
            disabled={!alertTitle.trim() || !alertMessage.trim() || isLoading}
          >
            <Bell className="h-4 w-4 mr-2" />
            {isLoading ? "Enviando..." : "Enviar Alerta"}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

};