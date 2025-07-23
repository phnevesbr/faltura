import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  BookOpen, 
  MoreVertical, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface ModernSubjectCardProps {
  subject: {
    id: string;
    name: string;
    color: string;
    currentAbsences: number;
    maxAbsences: number;
    weeklyHours: number;
  };
  onEdit: (subject: any) => void;
  onDelete: (id: string, name: string) => void;
}

const ModernSubjectCard: React.FC<ModernSubjectCardProps> = ({ subject, onEdit, onDelete }) => {
  const absencePercentage = (subject.currentAbsences / subject.maxAbsences) * 100;
  
  const getStatusInfo = () => {
    if (absencePercentage >= 100) {
      return {
        status: 'failed',
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: XCircle,
        message: 'Reprovado por faltas',
        textColor: 'text-red-700'
      };
    }
    if (absencePercentage >= 90) {
      return {
        status: 'critical',
        color: 'text-red-500',
        bg: 'bg-red-50',
        icon: AlertTriangle,
        message: 'Atenção crítica',
        textColor: 'text-red-600'
      };
    }
    if (absencePercentage >= 75) {
      return {
        status: 'warning',
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        icon: AlertTriangle,
        message: 'Próximo do limite',
        textColor: 'text-orange-600'
      };
    }
    return {
      status: 'ok',
      color: 'text-green-500',
      bg: 'bg-green-50',
      icon: CheckCircle,
      message: 'Situação normal',
      textColor: 'text-green-600'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const remainingAbsences = Math.max(0, subject.maxAbsences - subject.currentAbsences);

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg border-l-4 overflow-hidden",
      statusInfo.status === 'failed' && "ring-2 ring-red-200",
      statusInfo.status === 'critical' && "ring-2 ring-red-100",
      statusInfo.status === 'warning' && "ring-2 ring-orange-100"
    )} style={{ borderLeftColor: subject.color }}>
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: subject.color }}
              >
                {subject.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
                  {subject.name}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{subject.weeklyHours}h/sem</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{subject.maxAbsences} faltas max</span>
                  </div>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(subject)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Editar matéria
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onDelete(subject.id, subject.name)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Remover matéria
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-4 pb-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Faltas utilizadas</span>
              <span className="font-semibold text-gray-900">
                {subject.currentAbsences}/{subject.maxAbsences}
              </span>
            </div>
            
            <Progress 
              value={absencePercentage} 
              className="h-2"
              style={{
                '--progress-background': statusInfo.status === 'failed' ? '#ef4444' :
                                       statusInfo.status === 'critical' ? '#f59e0b' :
                                       statusInfo.status === 'warning' ? '#f59e0b' : '#10b981'
              } as React.CSSProperties}
            />
            
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center space-x-1 text-xs", statusInfo.textColor)}>
                <StatusIcon className="h-3 w-3" />
                <span className="font-medium">{statusInfo.message}</span>
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(absencePercentage)}% utilizado
              </span>
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className={cn("px-4 py-3 border-t", statusInfo.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {remainingAbsences > 0 ? (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {remainingAbsences} restantes
                  </Badge>
                  {statusInfo.status === 'ok' && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs font-medium">Em dia</span>
                    </div>
                  )}
                </>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Limite atingido
                </Badge>
              )}
            </div>
            
            {statusInfo.status === 'ok' && (
              <div className="flex items-center space-x-1 text-green-600">
                <Award className="h-3 w-3" />
                <span className="text-xs font-medium">Boa frequência</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernSubjectCard;