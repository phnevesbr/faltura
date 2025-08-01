import React from 'react';
import { Badge } from '../ui/badge';
import { Calendar, Trophy, Clock } from 'lucide-react';
import { Grade } from '../../hooks/useStudentGrades';
import { cn } from '../../lib/utils';

interface GradeHistoryProps {
  grades: Grade[];
  maxItems?: number;
}

const GradeHistory: React.FC<GradeHistoryProps> = ({ grades, maxItems = 5 }) => {
  const sortedGrades = grades
    .sort((a, b) => new Date(b.assessment.assessment_date).getTime() - new Date(a.assessment.assessment_date).getTime())
    .slice(0, maxItems);

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (sortedGrades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p>Nenhuma avaliação registrada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-base flex items-center gap-2">
        <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
        Histórico de Avaliações
      </h4>
      
      <div className="space-y-3">
        {sortedGrades.map((grade, index) => (
          <div 
            key={grade.id}
            className={cn(
              "p-4 rounded-xl border border-border/50 bg-gradient-to-r from-background to-muted/20",
              "hover:shadow-md transition-all duration-200 hover:border-border"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h5 className="font-medium truncate">{grade.assessment.title}</h5>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">Mais recente</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(grade.assessment.assessment_date).toLocaleDateString('pt-BR')}
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {grade.assessment.assessment_type}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right ml-4">
                {grade.score ? (
                  <div className={cn(
                    "px-3 py-1 rounded-lg border font-bold text-sm",
                    getScoreColor(grade.score, grade.assessment.max_score)
                  )}>
                    {grade.score.toFixed(1)} / {grade.assessment.max_score}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Pendente
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {grades.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center">
          +{grades.length - maxItems} avaliações adicionais
        </p>
      )}
    </div>
  );
};

export default GradeHistory;