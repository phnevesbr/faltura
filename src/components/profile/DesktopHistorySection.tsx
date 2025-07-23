import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { 
  History, 
  Trash2, 
  Calendar, 
  BookOpen, 
  XCircle, 
  FileText, 
  Trophy,
  GraduationCap,
  School,
  Clock,
  BarChart3
} from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { toast } from 'sonner';

const DesktopHistorySection: React.FC = () => {
  const { semesterHistory, deleteSemesterHistory } = useProfile();

  const handleDeleteSemester = async (semesterId: string) => {
    try {
      await deleteSemesterHistory(semesterId);
      toast.success('📚 Semestre removido do histórico');
    } catch (error) {
      toast.error('Erro ao remover semestre');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <motion.div variants={itemVariants}>
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                <History className="h-6 w-6 text-primary" />
              </div>
              Histórico de Semestres
            </CardTitle>
          </motion.div>
        </CardHeader>
        
        <CardContent>
          {semesterHistory.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-16 text-muted-foreground"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <History className="h-10 w-10 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum histórico ainda</h3>
              <p className="text-sm max-w-md mx-auto">
                Os semestres arquivados aparecerão aqui. Quando finalizar um semestre, 
                você pode arquivá-lo para manter um histórico organizado.
              </p>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  {semesterHistory.length} semestre{semesterHistory.length > 1 ? 's' : ''} arquivado{semesterHistory.length > 1 ? 's' : ''}
                </div>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  Histórico completo
                </Badge>
              </div>
              
              <ScrollArea className={`${semesterHistory.length > 2 ? 'h-[500px]' : 'h-auto'}`}>
                <div className="space-y-4 pr-4">
                  {semesterHistory.map((semester, index) => (
                    <motion.div
                      key={semester.id}
                      variants={itemVariants}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <Card className="border-0 bg-gradient-to-r from-background to-muted/30 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          {/* Header do semestre */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl">
                                <GraduationCap className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-foreground mb-1">
                                  {semester.course || 'Curso não informado'}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <School className="h-4 w-4" />
                                  {semester.university || 'Instituição não informada'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {semester.shift === 'morning' ? '🌅 Matutino' : 
                                   semester.shift === 'afternoon' ? '🌞 Vespertino' : 
                                   '🌙 Noturno'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-medium text-foreground">
                                  {new Date(semester.semesterStart).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-xs text-muted-foreground">até</div>
                                <div className="text-sm font-medium text-foreground">
                                  {new Date(semester.semesterEnd).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteSemester(semester.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Estatísticas do semestre */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20">
                              <BookOpen className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-blue-700">
                                {semester.subjectsData?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Matérias</div>
                            </div>
                            
                            <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl border border-red-500/20">
                              <XCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-red-700">
                                {semester.absencesData?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Faltas</div>
                            </div>
                            
                            <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20">
                              <FileText className="h-5 w-5 text-green-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-green-700">
                                {semester.notesData?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Tarefas</div>
                            </div>
                            
                            <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20">
                              <Trophy className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                              <div className="text-lg font-bold text-purple-700">
                                {semester.achievementsData?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Conquistas</div>
                            </div>
                          </div>

                          {/* Resumo adicional */}
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Duração: {Math.ceil((new Date(semester.semesterEnd).getTime() - new Date(semester.semesterStart).getTime()) / (1000 * 60 * 60 * 24))} dias
                              </div>
                              <div className="text-xs">
                                Arquivado em {new Date(semester.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DesktopHistorySection;