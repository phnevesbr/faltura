import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Star, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { ClassWithGrades } from '../../hooks/useStudentGrades';
import { cn } from '../../lib/utils';

interface ModernGradeCardProps {
  classWithGrades: ClassWithGrades;
  onExpand?: (classId: string) => void;
  isExpanded?: boolean;
}

const ModernGradeCard: React.FC<ModernGradeCardProps> = ({ 
  classWithGrades, 
  onExpand,
  isExpanded = false 
}) => {
  const { class: classData, stats } = classWithGrades;
  
  const getStatusInfo = () => {
    const currentGrade = (stats.currentPercentage / 100) * classData.maximum_grade;
    const isPassing = currentGrade >= classData.minimum_grade;
    const isExcellent = stats.currentPercentage >= 90;
    const isGood = stats.currentPercentage >= 75;
    
    if (isExcellent) {
      return {
        status: 'Excelente',
        icon: Star,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20'
      };
    } else if (isPassing && isGood) {
      return {
        status: 'Aprovado',
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      };
    } else if (isPassing) {
      return {
        status: 'Aprovado',
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      };
    } else if (stats.currentPercentage >= 40) {
      return {
        status: 'Em Recuperação',
        icon: Clock,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20'
      };
    } else {
      return {
        status: 'Reprovado',
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      };
    }
  };

  const getGradeColorScheme = (percentage: number) => {
    if (percentage >= 90) return 'from-yellow-400 to-orange-500';
    if (percentage >= 75) return 'from-green-400 to-emerald-500';
    if (percentage >= 60) return 'from-blue-400 to-indigo-500';
    if (percentage >= 40) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-red-600';
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const currentGrade = (stats.currentPercentage / 100) * classData.maximum_grade;
  const isImproving = stats.currentPercentage > 50; // Simplified logic

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      statusInfo.borderColor,
      "border-2",
      isExpanded && "ring-2 ring-primary/20"
    )}>
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5",
        getGradeColorScheme(stats.currentPercentage)
      )} />
      
      <CardHeader 
        className={cn(
          "relative pb-4 cursor-pointer transition-colors duration-200",
          statusInfo.bgColor,
          "hover:bg-opacity-80"
        )}
        onClick={() => onExpand?.(classData.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "p-2 rounded-lg",
                statusInfo.bgColor,
                statusInfo.borderColor,
                "border"
              )}>
                <BookOpen className={cn("h-5 w-5", statusInfo.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{classData.class_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{classData.subject_name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-medium",
                statusInfo.color,
                statusInfo.bgColor,
                statusInfo.borderColor,
                "border"
              )}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.status}
            </Badge>
            
            <ChevronRight className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90"
            )} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative p-6">
        {/* Grade Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Current Grade */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isImproving ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <p className="text-sm text-muted-foreground font-medium">Nota Atual</p>
            </div>
            <div className={cn(
              "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-1",
              getGradeColorScheme(stats.currentPercentage)
            )}>
              {currentGrade.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              de {classData.maximum_grade} pontos
            </p>
          </div>

          {/* Percentage with Progress */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium mb-2">Aproveitamento</p>
            <div className={cn(
              "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-3",
              getGradeColorScheme(stats.currentPercentage)
            )}>
              {stats.currentPercentage.toFixed(1)}%
            </div>
            <div className="space-y-2">
              <Progress 
                value={stats.currentPercentage} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="font-medium">Meta: 70%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Required Grade */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium mb-2">Nota Mínima</p>
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {classData.minimum_grade.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">para aprovação</p>
            {currentGrade >= classData.minimum_grade && (
              <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                ✓ Atingida
              </Badge>
            )}
          </div>
        </div>

        {/* Assessment Types Progress */}
        {Object.keys(stats.gradesByType).length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
              Desempenho por Tipo de Avaliação
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.gradesByType).map(([type, data]) => (
                <div key={type} className="relative p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <span className={cn(
                      "text-sm font-bold",
                      data.percentage >= 70 ? "text-green-600" : 
                      data.percentage >= 50 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {data.percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={data.percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{data.total.toFixed(1)} pts</span>
                      <span>de {data.max} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernGradeCard;