import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemLimits } from '@/hooks/useSystemLimits';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertTriangle, Settings } from 'lucide-react';

const LimitsTestPage = () => {
  const { limits } = useSystemLimits();
  const { user } = useAuth();

  const limitItems = [
    {
      key: 'maxSubjects',
      label: 'Limite de Matérias',
      value: limits.maxSubjects,
      icon: '📚',
      description: 'Máximo de matérias que cada usuário pode criar'
    },
    {
      key: 'maxTasks',
      label: 'Limite de Tarefas',
      value: limits.maxTasks,
      icon: '📝',
      description: 'Máximo de tarefas que cada usuário pode criar'
    },
    {
      key: 'maxClassMemberships',
      label: 'Limite de Participação em Turmas',
      value: limits.maxClassMemberships,
      icon: '👥',
      description: 'Máximo de turmas que um usuário pode participar'
    },
    {
      key: 'maxClassLeadership',
      label: 'Limite de Liderança de Turmas',
      value: limits.maxClassLeadership,
      icon: '👑',
      description: 'Máximo de turmas que um usuário pode liderar'
    },
    {
      key: 'maxTimeSlots',
      label: 'Limite de Horários',
      value: limits.maxTimeSlots,
      icon: '⏰',
      description: 'Máximo de horários na configuração de horários'
    },
    {
      key: 'maxSemesterDuration',
      label: 'Duração Máxima do Semestre',
      value: limits.maxSemesterDuration,
      icon: '📅',
      description: 'Duração máxima do semestre em meses'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Limites do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {limitItems.map((item) => (
              <Card key={item.key} className="border border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <div className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-semibold">
                      {item.value}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Validações Implementadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Validações no Banco de Dados (Triggers)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• ✅ Limite de matérias (subjects)</li>
                  <li>• ✅ Limite de tarefas (notes)</li>
                  <li>• ✅ Limite de participação em turmas (class_members)</li>
                  <li>• ✅ Limite de liderança de turmas (classes)</li>
                  <li>• ✅ Limite de horários (user_time_slots)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Validações no Front-end</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• ✅ SubjectManager - validação antes de criar matéria</li>
                  <li>• ✅ TaskForm - validação antes de criar tarefa</li>
                  <li>• ✅ ClassManager - validação antes de criar turma</li>
                  <li>• ✅ ClassContext - validação antes de aceitar convite</li>
                  <li>• ✅ ScheduleConfig - validação antes de adicionar horário</li>
                  <li>• ✅ ProfileContext - validação de duração do semestre</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-sm text-green-800 dark:text-green-200">
                  Sistema de Dupla Validação
                </h4>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                As validações são feitas tanto no front-end (para melhor UX) quanto no banco de dados (para segurança), 
                garantindo que os limites sejam sempre respeitados mesmo em caso de bypass do front-end.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LimitsTestPage;