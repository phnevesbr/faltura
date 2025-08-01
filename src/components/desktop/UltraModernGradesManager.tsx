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
  ChevronDown,
  FileText,
  Edit,
  Download,
  Share2,
  Settings,
  Plus
} from 'lucide-react';
import { useStudentGrades } from '../../hooks/useStudentGrades';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

const UltraModernGradesManager = () => {
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
      <div className="space-y-8">
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
          className="relative p-8 rounded-3xl mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 rounded-3xl blur-xl" />
          <div className="relative p-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl border border-orange-500/20">
            <GraduationCap className="h-20 w-20 text-orange-500 mx-auto" />
          </div>
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-3 text-center"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      <div className="container mx-auto p-8 space-y-10">
        {/* Ultra Modern Hero Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-10 text-white shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          
          {/* Floating Orbs */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-500/30 blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tight">
                      Controle de <span className="text-white/80">Notas</span>
                    </h1>
                    <p className="text-purple-100 text-xl font-medium">
                      Transforme sua organização acadêmica
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <Target className="h-5 w-5 text-emerald-300" />
                    <span className="text-sm font-semibold">{overallPercentage.toFixed(0)}% aproveitamento</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <AlertTriangle className="h-5 w-5 text-orange-300" />
                    <span className="text-sm font-semibold">{overallStats.failingClasses} críticas</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <BookOpen className="h-5 w-5 text-blue-300" />
                    <span className="text-sm font-semibold">{overallStats.totalAssessments} avaliações</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    placeholder="Buscar suas notas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 w-full sm:w-80 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-2xl text-base"
                  />
                </div>
                
                <Button
                  size="lg"
                  className="h-12 bg-white text-purple-600 hover:bg-white/90 shadow-xl gap-3 font-bold rounded-2xl px-8"
                >
                  <Plus className="h-5 w-5" />
                  Importar Nota
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra Modern Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-7">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Desempenho Geral</p>
                  <p className="text-4xl font-black mt-1">{overallPercentage.toFixed(0)}%</p>
                </div>
              </div>
              <div className="space-y-3">
                <Progress value={overallPercentage} className="h-2 bg-blue-400/30" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">{overallPercentage.toFixed(0)}% aproveitamento</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-blue-100">+{overallStats.totalScore.toFixed(0)} pts</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-7">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-medium">Matérias Críticas</p>
                  <p className="text-4xl font-black mt-1">{overallStats.failingClasses}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-orange-400/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/40 rounded-full transition-all duration-500"
                    style={{ width: `${classes.length > 0 ? (overallStats.failingClasses / classes.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-sm text-orange-100">
                  {overallStats.failingClasses > 0 ? `${((overallStats.failingClasses / classes.length) * 100).toFixed(0)}% do total` : 'Tudo em ordem! 🎉'}
                </p>
              </div>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-7">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-7 w-7" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Excelentes</p>
                  <p className="text-4xl font-black mt-1">{overallStats.excellentClasses}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-emerald-400/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/40 rounded-full transition-all duration-500"
                    style={{ width: `${classes.length > 0 ? (overallStats.excellentClasses / classes.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-sm text-emerald-100">
                  {overallStats.excellentClasses > 0 ? `${((overallStats.excellentClasses / classes.length) * 100).toFixed(0)}% do total` : 'Continue se esforçando!'}
                </p>
              </div>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-7">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-7 w-7" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Avaliações</p>
                  <p className="text-4xl font-black mt-1">{overallStats.totalAssessments}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Realizadas</span>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    <span className="text-purple-100">Total</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
          </Card>
        </div>

        {/* Grades List Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Suas Notas por Matéria</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

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

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent className="relative p-6 border-t">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">Avaliações</h4>
                                <Badge variant="outline">{classWithGrades.grades.length} avaliações</Badge>
                              </div>
                              
                              {classWithGrades.grades.length > 0 ? (
                                <div className="grid gap-3">
                                  {classWithGrades.grades.map((grade, gradeIndex) => (
                                    <div key={gradeIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                          <FileText className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                          <p className="font-medium">{grade.assessment.title || `Avaliação ${gradeIndex + 1}`}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {new Date(grade.assessment.assessment_date).toLocaleDateString('pt-BR')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold">{grade.score || 0}</div>
                                        <div className="text-sm text-muted-foreground">de {grade.assessment.max_score}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                  <p>Nenhuma avaliação registrada ainda</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default UltraModernGradesManager;