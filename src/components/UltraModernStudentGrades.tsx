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
  Eye,
  ChevronDown
} from 'lucide-react';
import { useStudentGrades } from '../hooks/useStudentGrades';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';

const UltraModernStudentGrades = () => {
  const { classes, loading, isStudent } = useStudentGrades();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

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
      <div className="space-y-8 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
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
        className="flex flex-col items-center justify-center py-20"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-8 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl mb-6"
        >
          <GraduationCap className="h-20 w-20 text-primary mx-auto" />
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-3"
        >
          Nenhuma turma encontrada
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-center max-w-md leading-relaxed"
        >
          Você ainda não está matriculado em nenhuma turma. Entre em contato com seu professor para ser adicionado a uma turma.
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Ultra Modern Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 rounded-3xl blur-xl" />
        <div className="relative p-8 bg-gradient-to-r from-background via-background/95 to-background rounded-3xl border border-border/50">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="p-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl shadow-lg"
            >
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent"
              >
                Minhas Notas
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground mt-1"
              >
                Dashboard completo do seu desempenho acadêmico
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-right"
            >
              <div className="text-3xl font-bold text-primary">
                {overallPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Desempenho Geral
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Ultra Modern Statistics Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            title: 'Desempenho Geral',
            value: `${overallPercentage.toFixed(1)}%`,
            subtitle: `${overallStats.totalScore.toFixed(1)} de ${overallStats.maxPossibleScore} pts`,
            icon: BarChart3,
            color: 'primary',
            gradient: getStatusInfo(overallPercentage).gradient
          },
          {
            title: 'Matérias Excelentes',
            value: overallStats.excellentClasses,
            subtitle: `${((overallStats.excellentClasses / classes.length) * 100).toFixed(0)}% do total`,
            icon: Star,
            color: 'yellow-500',
            gradient: 'from-yellow-400 to-orange-500'
          },
          {
            title: 'Taxa de Aprovação',
            value: `${(((overallStats.excellentClasses + overallStats.passingClasses) / classes.length) * 100).toFixed(0)}%`,
            subtitle: `${overallStats.excellentClasses + overallStats.passingClasses} de ${classes.length} matérias`,
            icon: Target,
            color: 'green-500',
            gradient: 'from-green-400 to-emerald-500'
          },
          {
            title: 'Total de Avaliações',
            value: overallStats.totalAssessments,
            subtitle: 'Realizadas até agora',
            icon: Trophy,
            color: 'blue-500',
            gradient: 'from-blue-400 to-indigo-500'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-5",
                stat.gradient
              )} />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <stat.icon className={cn("h-4 w-4", `text-${stat.color}`)} />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-2">
                  <div className={cn(
                    "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                    stat.gradient
                  )}>
                    {stat.value}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar matérias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'excellent', 'passing', 'failing'].map(filter => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className="capitalize"
            >
              <Filter className="h-3 w-3 mr-1" />
              {filter === 'all' ? 'Todas' : 
               filter === 'excellent' ? 'Excelentes' :
               filter === 'passing' ? 'Aprovadas' : 'Em Recuperação'}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Ultra Modern Grade Cards */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-6"
      >
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
                transition={{ delay: index * 0.1 }}
                layout
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                  statusInfo.borderColor,
                  "border-2 group",
                  isExpanded && "ring-2 ring-primary/20"
                )}>
                  {/* Gradient Background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-5",
                    statusInfo.gradient
                  )} />
                  
                  <CardHeader 
                    className={cn(
                      "relative cursor-pointer transition-all duration-200",
                      statusInfo.bgColor,
                      "hover:bg-opacity-80"
                    )}
                    onClick={() => toggleExpandClass(classWithGrades.class.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className={cn(
                            "p-3 rounded-xl",
                            statusInfo.bgColor,
                            statusInfo.borderColor,
                            "border-2"
                          )}
                        >
                          <BookOpen className={cn("h-6 w-6", statusInfo.color)} />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-bold">{classWithGrades.class.class_name}</h3>
                          <p className="text-muted-foreground">{classWithGrades.class.subject_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={cn(
                            "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            statusInfo.gradient
                          )}>
                            {((classWithGrades.stats.currentPercentage / 100) * classWithGrades.class.maximum_grade).toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            de {classWithGrades.class.maximum_grade}
                          </div>
                        </div>
                        
                        <Badge 
                          className={cn(
                            "text-sm font-medium px-3 py-1",
                            statusInfo.color,
                            statusInfo.bgColor,
                            statusInfo.borderColor,
                            "border"
                          )}
                        >
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {statusInfo.status}
                        </Badge>
                        
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative p-6">
                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground font-medium mb-2">Aproveitamento</p>
                        <div className={cn(
                          "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-3",
                          statusInfo.gradient
                        )}>
                          {classWithGrades.stats.currentPercentage.toFixed(1)}%
                        </div>
                        <Progress 
                          value={classWithGrades.stats.currentPercentage} 
                          className="h-3"
                        />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground font-medium mb-2">Nota Mínima</p>
                        <div className="text-3xl font-bold text-orange-500 mb-3">
                          {classWithGrades.class.minimum_grade.toFixed(1)}
                        </div>
                        {((classWithGrades.stats.currentPercentage / 100) * classWithGrades.class.maximum_grade) >= classWithGrades.class.minimum_grade ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            ✓ Atingida
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                            ✗ Não atingida
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground font-medium mb-2">Avaliações</p>
                        <div className="text-3xl font-bold text-blue-500 mb-3">
                          {classWithGrades.grades.length}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs">
                          {classWithGrades.stats.currentPercentage > 70 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className="text-muted-foreground">
                            {classWithGrades.stats.currentPercentage > 70 ? 'Tendência positiva' : 'Precisa melhorar'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Assessment Types */}
                    {Object.keys(classWithGrades.stats.gradesByType).length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-purple-500 rounded-full" />
                          Desempenho por Tipo de Avaliação
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(classWithGrades.stats.gradesByType).map(([type, data]) => (
                            <motion.div 
                              key={type}
                              whileHover={{ scale: 1.02 }}
                              className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:border-border transition-all duration-200"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium capitalize">{type}</span>
                                <span className={cn(
                                  "text-sm font-bold",
                                  data.percentage >= 90 ? "text-yellow-600" :
                                  data.percentage >= 75 ? "text-green-600" :
                                  data.percentage >= 60 ? "text-blue-600" :
                                  data.percentage >= 40 ? "text-orange-600" : "text-red-600"
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
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded History */}
                    <AnimatePresence>
                      {isExpanded && classWithGrades.grades.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-6 border-t border-border/50"
                        >
                          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                            <div className="w-1 h-6 bg-gradient-to-b from-primary to-purple-500 rounded-full" />
                            Histórico Detalhado de Avaliações
                          </h4>
                          
                          <div className="space-y-3">
                            {classWithGrades.grades
                              .sort((a, b) => new Date(b.assessment.assessment_date).getTime() - new Date(a.assessment.assessment_date).getTime())
                              .map((grade, index) => (
                                <motion.div 
                                  key={grade.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="p-4 rounded-xl border border-border/50 bg-gradient-to-r from-background to-muted/20 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Trophy className="h-4 w-4 text-primary" />
                                        <h5 className="font-medium">{grade.assessment.title}</h5>
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
                                          "px-4 py-2 rounded-xl border font-bold text-sm",
                                          grade.score / grade.assessment.max_score >= 0.9 ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
                                          grade.score / grade.assessment.max_score >= 0.75 ? "text-green-600 bg-green-50 border-green-200" :
                                          grade.score / grade.assessment.max_score >= 0.6 ? "text-blue-600 bg-blue-50 border-blue-200" :
                                          "text-red-600 bg-red-50 border-red-200"
                                        )}>
                                          {grade.score.toFixed(1)} / {grade.assessment.max_score}
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="text-muted-foreground">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pendente
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredClasses.length === 0 && searchTerm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma matéria encontrada</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termo de busca
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default UltraModernStudentGrades;