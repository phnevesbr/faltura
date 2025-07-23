import React from 'react';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';

interface SafeScheduleWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ScheduleErrorBoundary extends React.Component<SafeScheduleWrapperProps, ErrorBoundaryState> {
  constructor(props: SafeScheduleWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Schedule Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="mx-4 my-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Ops! Erro na Grade</h3>
            <p className="text-gray-600 text-sm mb-4">
              Ocorreu um erro ao carregar a grade horária. 
            </p>
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Tentar Novamente</span>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return <>{this.props.children}</>;
  }
}

export const SafeScheduleWrapper: React.FC<SafeScheduleWrapperProps> = ({ children, fallback }) => {
  const { subjects, schedule } = useData();
  const { timeSlots } = useScheduleConfig();

  // Verificar se os dados essenciais estão disponíveis e válidos
  const hasValidData = React.useMemo(() => {
    try {
      // Verificar se timeSlots existe e é um array válido
      if (!Array.isArray(timeSlots)) {
        console.log('TimeSlots is not array or undefined:', timeSlots);
        return false;
      }

      // Se timeSlots está vazio, ainda retorna true para permitir que o usuário configure
      if (timeSlots.length === 0) {
        return true;
      }

      // Verificar se todos os timeSlots têm as propriedades necessárias
      const hasValidTimeSlots = timeSlots.every(slot => 
        slot && 
        typeof slot.startTime === 'string' && 
        typeof slot.endTime === 'string' &&
        slot.startTime.includes(':') &&
        slot.endTime.includes(':')
      );

      if (!hasValidTimeSlots) {
        console.log('Invalid time slots found:', timeSlots);
        return false;
      }

      // Verificar se subjects é um array (pode estar vazio)
      if (!Array.isArray(subjects)) {
        console.log('Subjects is not array:', subjects);
        return false;
      }

      // Verificar se schedule é um array (pode estar vazio)
      if (!Array.isArray(schedule)) {
        console.log('Schedule is not array:', schedule);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking schedule data validity:', error);
      return false;
    }
  }, [subjects, schedule, timeSlots]);

  // Se os dados não são válidos, mostrar fallback
  if (!hasValidData) {
    return fallback || (
      <Card className="mx-4 my-4">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Carregando dados da grade</h3>
          <p className="text-gray-600 text-sm mb-4">
            Os dados da grade estão sendo carregados. Aguarde um momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScheduleErrorBoundary fallback={fallback}>
      {children}
    </ScheduleErrorBoundary>
  );
};