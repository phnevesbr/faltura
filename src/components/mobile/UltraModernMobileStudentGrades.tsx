import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  BookOpen, 
  BarChart3, 
  Target, 
  Award, 
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  Calendar,
  Trophy,
  Zap,
  GraduationCap,
  TrendingDown,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { useStudentGrades } from '../../hooks/useStudentGrades';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

const UltraModernMobileStudentGrades = () => {
  const { classes, loading, isStudent } = useStudentGrades();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter classes based on search and filter
  const filteredClasses = classes.filter(classData => {
    const matchesSearch = classData.class.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classData.class.subject_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'passing') return matchesSearch && classData.stats.currentPercentage >= 70;
    if (selectedFilter === 'failing') return matchesSearch && classData.stats.currentPercentage < 70;
    if (selectedFilter === 'excellent') return matchesSearch && classData.stats.currentPercentage >= 90;
    
    return matchesSearch;
  });

  // Calculate overall statistics
  const overallStats = classes.reduce((acc, classData) => {
    acc.totalScore += classData.stats.totalScore;
    acc.maxPossibleScore += classData.stats.maxPossibleScore;
    acc.totalAssessments += classData.grades.length;
    
    if (classData.stats.currentPercentage >= 90) acc.excellentClasses++;
    else if (classData.stats.currentPercentage >= 70) acc.passingClasses++;
    else if (classData.stats.currentPercentage >= 40) acc.recoveringClasses++;
    else acc.failingClasses++;
    
    return acc;
  }, {
    totalScore: 0,
    maxPossibleScore: 0,
    totalAssessments: 0,
    excellentClasses: 0,
    passingClasses: 0,
    recoveringClasses: 0,
    failingClasses: 0
  });

  const overallPercentage = overallStats.maxPossibleScore > 0 
    ? (overallStats.totalScore / overallStats.maxPossibleScore) * 100 
    : 0;

  const getStatusInfo = (percentage: number) => {
    if (percentage >= 90) return {
      status: 'Excelente',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      gradient: 'from-yellow-400 to-orange-500'
    };
    if (percentage >= 75) return {
      status: 'Muito Bom',
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      gradient: 'from-green-400 to-emerald-500'
    };
    if (percentage >= 60) return {
      status: 'Bom',
      icon: CheckCircle2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      gradient: 'from-blue-400 to-indigo-500'
    };
    if (percentage >= 40) return {
      status: 'Recuperação',
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      gradient: 'from-orange-400 to-red-500'
    };
    return {
      status: 'Crítico',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      gradient: 'from-red-400 to-red-600'
    };
  };

  const toggleExpandClass = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-2 w-full mb-1" />
                <Skeleton className="h-2 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isStudent || classes.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl mb-4"
        >
          <GraduationCap className="h-16 w-16 text-primary mx-auto" />
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold mb-2 text-center"
        >
          Nenhuma turma encontrada
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed"
        >
          Você ainda não está matriculado em nenhuma turma. Entre em contato com seu professor.
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Minhas Notas</h1>
          <p className="text-sm text-muted-foreground">{classes.length} matérias • {overallPercentage.toFixed(1)}% geral</p>
        </div>
      </div>

      {/* Estatísticas gerais */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Estatísticas gerais</h3>
          <div className="grid grid-cols-2 gap-4">
        {[
          {
            title: 'Desempenho',
            value: `${overallPercentage.toFixed(1)}%`,
            subtitle: 'Geral',
            icon: BarChart3,
            gradient: getStatusInfo(overallPercentage).gradient
          },
          {
            title: 'Excelentes',
            value: overallStats.excellentClasses,
            subtitle: 'Matérias',
            icon: Star,
            gradient: 'from-yellow-400 to-orange-500'
          },
          {
            title: 'Aprovação',
            value: `${(((overallStats.excellentClasses + overallStats.passingClasses) / classes.length) * 100).toFixed(0)}%`,
            subtitle: 'Taxa',
            icon: Target,
            gradient: 'from-green-400 to-emerald-500'
          },
          {
            title: 'Avaliações',
            value: overallStats.totalAssessments,
            subtitle: 'Total',
            icon: Trophy,
            gradient: 'from-blue-400 to-indigo-500'
          }
         ].map((stat, index) => (
             <div key={stat.title} className="text-center">
               <div className="text-lg font-bold text-primary">{stat.value}</div>
               <div className="text-xs text-muted-foreground">{stat.title}</div>
             </div>
         ))}
          </div>
        </CardContent>
      </Card>

      {/* Busca e filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar matérias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-12"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            {showFilters ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2"
            >
              {[
                { key: 'all', label: 'Todas' },
                { key: 'excellent', label: 'Excelentes' },
                { key: 'passing', label: 'Aprovadas' },
                { key: 'failing', label: 'Recuperação' }
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.key)}
                  className="text-xs"
                >
                  {filter.label}
                </Button>
              ))}
            </motion.div>
          )}
         </AnimatePresence>
       </div>

      {/* Lista de matérias */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Todas as matérias</h3>
          
          {filteredClasses.length === 0 && !searchTerm ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma matéria encontrada</p>
            </div>
          ) : (
            <div className="space-y-0">
        <AnimatePresence>
          {filteredClasses.map((classWithGrades, index) => {
            const statusInfo = getStatusInfo(classWithGrades.stats.currentPercentage);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedClasses.has(classWithGrades.class.id);
            
            return (
              <motion.div
                key={classWithGrades.class.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  statusInfo.borderColor,
                  "border-2",
                  isExpanded && "ring-2 ring-primary/20"
                )}>
                  {/* Gradient Background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-5",
                    statusInfo.gradient
                  )} />
                  
                  <CardHeader 
                    className={cn(
                      "relative cursor-pointer pb-3",
                      statusInfo.bgColor
                    )}
                    onClick={() => toggleExpandClass(classWithGrades.class.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          statusInfo.bgColor,
                          statusInfo.borderColor,
                          "border"
                        )}>
                          <BookOpen className={cn("h-4 w-4", statusInfo.color)} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{classWithGrades.class.class_name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{classWithGrades.class.subject_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className={cn(
                            "text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            statusInfo.gradient
                          )}>
                            {((classWithGrades.stats.currentPercentage / 100) * classWithGrades.class.maximum_grade).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            /{classWithGrades.class.maximum_grade}
                          </div>
                        </div>
                        
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <Badge 
                        className={cn(
                          "text-xs font-medium px-2 py-1",
                          statusInfo.color,
                          statusInfo.bgColor,
                          statusInfo.borderColor,
                          "border"
                        )}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.status}
                      </Badge>
                      
                      <div className="text-xs text-muted-foreground">
                        {classWithGrades.stats.currentPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative p-4">
                    {/* Mobile Progress Overview */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Aproveitamento</span>
                          <span className="font-medium">{classWithGrades.stats.currentPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={classWithGrades.stats.currentPercentage} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Nota Mínima</div>
                          <div className="text-lg font-bold text-orange-500">
                            {classWithGrades.class.minimum_grade.toFixed(1)}
                          </div>
                          {((classWithGrades.stats.currentPercentage / 100) * classWithGrades.class.maximum_grade) >= classWithGrades.class.minimum_grade ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs mt-1">
                              ✓ Atingida
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs mt-1">
                              ✗ Não atingida
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Avaliações</div>
                          <div className="text-lg font-bold text-blue-500">
                            {classWithGrades.grades.length}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-xs mt-1">
                            {classWithGrades.stats.currentPercentage > 70 ? (
                              <>
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-green-500">Positiva</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3 text-red-500" />
                                <span className="text-red-500">Melhorar</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded History for Mobile */}
                    <AnimatePresence>
                      {isExpanded && classWithGrades.grades.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-border/50"
                        >
                          <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-gradient-to-b from-primary to-purple-500 rounded-full" />
                            Últimas Avaliações
                          </h4>
                          
                          <div className="space-y-3">
                            {classWithGrades.grades
                              .sort((a, b) => new Date(b.assessment.assessment_date).getTime() - new Date(a.assessment.assessment_date).getTime())
                              .slice(0, 3)
                              .map((grade, index) => (
                                <motion.div 
                                  key={grade.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="p-3 rounded-lg border border-border/50 bg-muted/20"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="h-3 w-3 text-primary flex-shrink-0" />
                                        <h5 className="font-medium text-sm truncate">{grade.assessment.title}</h5>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(grade.assessment.assessment_date).toLocaleDateString('pt-BR')}
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {grade.assessment.assessment_type}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="ml-2 flex-shrink-0">
                                      {grade.score ? (
                                        <div className={cn(
                                          "px-2 py-1 rounded-lg border font-bold text-xs",
                                          grade.score / grade.assessment.max_score >= 0.9 ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
                                          grade.score / grade.assessment.max_score >= 0.75 ? "text-green-600 bg-green-50 border-green-200" :
                                          grade.score / grade.assessment.max_score >= 0.6 ? "text-blue-600 bg-blue-50 border-blue-200" :
                                          "text-red-600 bg-red-50 border-red-200"
                                        )}>
                                          {grade.score.toFixed(1)}/{grade.assessment.max_score}
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">
                                          Pendente
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                          
                          {classWithGrades.grades.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              +{classWithGrades.grades.length - 3} avaliações adicionais
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
         </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredClasses.length === 0 && searchTerm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Nenhuma matéria encontrada</h3>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros ou termo de busca
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default UltraModernMobileStudentGrades;