import React from 'react';
import { Button } from './ui/button';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNotifications } from '../hooks/useNotifications';

const TestNotificationButton: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showNotification, permission, isSupported } = useNotifications();

  const testDirectNotification = () => {
    console.log('🧪 Testing direct notification...');
    console.log('📱 Permission:', permission, 'Supported:', isSupported);
    
    if (!isSupported) {
      toast({
        title: "❌ Não suportado",
        description: "Seu navegador não suporta notificações.",
        variant: "destructive"
      });
      return;
    }

    if (permission !== 'granted') {
      toast({
        title: "❌ Sem permissão",
        description: "Permita notificações primeiro.",
        variant: "destructive"
      });
      return;
    }

    const notification = showNotification('🧪 Teste de Notificação', {
      body: 'Esta é uma notificação de teste para verificar se está funcionando!',
      tag: 'test-notification',
      requireInteraction: false
    });

    if (notification) {
      toast({
        title: "✅ Teste enviado!",
        description: "Uma notificação de teste foi enviada.",
      });
    } else {
      toast({
        title: "❌ Falha no teste",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive"
      });
    }
  };

  const createTestNotification = async () => {
    if (!user) return;

    try {
      // Buscar uma turma do usuário primeiro
      const { data: userClasses } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!userClasses || userClasses.length === 0) {
        toast({
          title: "Sem turmas",
          description: "Você precisa estar em pelo menos uma turma para testar notificações.",
          variant: "destructive"
        });
        return;
      }

      // Criar uma notificação de teste
      const { error } = await supabase
        .from('absence_notifications')
        .insert({
          user_id: user.id,
          class_id: userClasses[0].class_id,
          absence_date: new Date().toISOString().split('T')[0],
          subjects: ['Matemática', 'Física'],
          content_sent: false
        });

      if (error) {
        console.error('Erro ao criar notificação:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar a notificação de teste.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ Notificação criada!",
        description: "Uma notificação de teste foi criada. Veja o ícone de turmas no header!",
      });
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={testDirectNotification}
        variant="outline"
        size="sm"
        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        🧪 Teste Direto
      </Button>
    </div>
  );
};

export default TestNotificationButton;