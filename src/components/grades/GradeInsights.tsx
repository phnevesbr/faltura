import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import { ClassWithGrades } from '../../hooks/useStudentGrades';
import { cn } from '../../lib/utils';

interface GradeInsightsProps {
  classes: ClassWithGrades[];
}

const GradeInsights: React.FC<GradeInsightsProps> = ({ classes }) => {
  if (!classes || classes.length === 0) return null;

  // Calculate overall statistics
  const overallStats = classes.reduce((acc, classData) => {
    acc.totalScore += classData.stats.totalScore;
    acc.maxPossibleScore += classData.stats.maxPossibleScore;
    acc.totalAssessments += classData.grades.length;
    
    if (classData.stats.currentPercentage >= 70) {
      acc.passingClasses++;
    }
    
    return acc;
  }, {
    totalScore: 0,
    maxPossibleScore: 0,
    totalAssessments: 0,
    passingClasses: 0
  });

  const overallPercentage = overallStats.maxPossibleScore > 0 
    ? (overallStats.totalScore / overallStats.maxPossibleScore) * 100 
    : 0;

  const passingRate = classes.length > 0 
    ? (overallStats.passingClasses / classes.length) * 100 
    : 0;

  // Find best and worst performing subjects
  const sortedClasses = [...classes].sort((a, b) => b.stats.currentPercentage - a.stats.currentPercentage);
  const bestSubject = sortedClasses[0];
  const worstSubject = sortedClasses[sortedClasses.length - 1];

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-yellow-600';
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceGradient = (percentage: number) => {
    if (percentage >= 90) return 'from-yellow-400 to-orange-500';
    if (percentage >= 75) return 'from-green-400 to-emerald-500';
    if (percentage >= 60) return 'from-blue-400 to-indigo-500';
    if (percentage >= 40) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Overall Performance */}
      <Card className="relative overflow-hidden">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5",
          getPerformanceGradient(overallPercentage)
        )} />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Desempenho Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={cn(
              "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              getPerformanceGradient(overallPercentage)
            )}>
              {overallPercentage.toFixed(1)}%
            </div>
            <Progress value={overallPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {overallStats.totalScore.toFixed(1)} de {overallStats.maxPossibleScore} pontos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Passing Rate */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-emerald-500/5" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            Taxa de Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">
              {passingRate.toFixed(0)}%
            </div>
            <Progress value={passingRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {overallStats.passingClasses} de {classes.length} matérias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Best Subject */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-orange-500/5" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Melhor Matéria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-lg font-bold text-yellow-600 truncate">
              {bestSubject?.class.subject_name}
            </div>
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {bestSubject?.stats.currentPercentage.toFixed(1)}%
            </Badge>
            <p className="text-xs text-muted-foreground truncate">
              {bestSubject?.class.class_name}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Assessments */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-500/5" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Total de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600">
              {overallStats.totalAssessments}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {overallPercentage > 70 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className="text-muted-foreground">
                {overallPercentage > 70 ? 'Tendência positiva' : 'Precisa melhorar'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeInsights;