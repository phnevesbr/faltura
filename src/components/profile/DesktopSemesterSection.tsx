import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Archive, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  CalendarDays,
  Timer,
  BookOpen
} from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useGamification } from '../../contexts/GamificationContext';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface DesktopSemesterSectionProps {
  isEditing: boolean;
  formData: {
    course: string;
    university: string;
    shift: string;
    semesterStart: string;
    semesterEnd: string;
  };
  onFormDataChange: (data: any) => void;
}

const DesktopSemesterSection: React.FC<DesktopSemesterSectionProps> = ({
  isEditing,
  formData,
  onFormDataChange
}) => {
  const { profile, getDaysUntilSemesterEnd, archiveSemester, startNewSemester } = useProfile();
  const { awardNewSemesterXP } = useGamification();
  const [showNewSemester, setShowNewSemester] = useState(false);
  const [newSemesterData, setNewSemesterData] = useState({
    semesterStart: '',
    semesterEnd: ''
  });

  const daysUntilEnd = getDaysUntilSemesterEnd();
  const isSemesterEnded = daysUntilEnd === 0 && profile?.semesterEnd && new Date() >= new Date(profile.semesterEnd);

  // Calcular progresso do semestre
  const getSemesterProgress = () => {
    if (!profile?.semesterStart || !profile?.semesterEnd) return 0;
    
    const start = new Date(profile.semesterStart).getTime();
    const end = new Date(profile.semesterEnd).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return (elapsed / total) * 100;
  };

  const semesterProgress = getSemesterProgress();

  const handleArchiveSemester = async () => {
    await archiveSemester();
    toast.success('📚 Semestre arquivado com sucesso!');
  };

  const handleStartNewSemester = async () => {
    if (!newSemesterData.semesterStart || !newSemesterData.semesterEnd) {
      toast.error('Preencha todas as datas do novo semestre');
      return;
    }
    
    await startNewSemester(newSemesterData.semesterStart, newSemesterData.semesterEnd);
    await awardNewSemesterXP();
    setShowNewSemester(false);
    setNewSemesterData({ semesterStart: '', semesterEnd: '' });
    toast.success('🎉 Novo semestre iniciado!');
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
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              Semestre Atual
            </CardTitle>
          </motion.div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isEditing ? (
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                  Início do Semestre
                </Label>
                <Input
                  type="date"
                  value={formData.semesterStart}
                  onChange={(e) => onFormDataChange({ ...formData, semesterStart: e.target.value })}
                  className="h-12 bg-background/50 border-green-200 focus:border-green-500 transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-red-600" />
                  Fim do Semestre
                </Label>
                <Input
                  type="date"
                  value={formData.semesterEnd}
                  onChange={(e) => onFormDataChange({ ...formData, semesterEnd: e.target.value })}
                  className="h-12 bg-background/50 border-red-200 focus:border-red-500 transition-all"
                />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Período do semestre */}
              <motion.div variants={itemVariants} className="bg-gradient-to-r from-muted/50 to-muted/30 p-6 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Período Acadêmico
                  </h3>
                  <Badge variant="outline" className="gap-2">
                    <Timer className="h-3 w-3" />
                    {daysUntilEnd > 0 ? `${daysUntilEnd} dias restantes` : 'Finalizado'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20">
                    <CalendarDays className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-green-700 dark:text-green-400">
                      {profile?.semesterStart ? new Date(profile.semesterStart).toLocaleDateString('pt-BR') : 'Não definido'}
                    </div>
                    <div className="text-xs text-muted-foreground">Início</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-lg border border-red-500/20">
                    <CalendarDays className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <div className="font-semibold text-red-700 dark:text-red-400">
                      {profile?.semesterEnd ? new Date(profile.semesterEnd).toLocaleDateString('pt-BR') : 'Não definido'}
                    </div>
                    <div className="text-xs text-muted-foreground">Término</div>
                  </div>
                </div>

                {/* Progresso do semestre */}
                {profile?.semesterStart && profile?.semesterEnd && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso do semestre</span>
                      <span>{semesterProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={semesterProgress} className="h-3" />
                  </div>
                )}
              </motion.div>

              {/* Status do semestre */}
              <motion.div variants={itemVariants}>
                {daysUntilEnd > 0 ? (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 p-4 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-semibold text-green-700 dark:text-green-400">
                          Semestre em andamento
                        </div>
                        <div className="text-sm text-green-600/80">
                          {daysUntilEnd} dias restantes até o final
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isSemesterEnded ? (
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/5 p-4 rounded-xl border border-orange-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                        <div>
                          <div className="font-semibold text-orange-700 dark:text-orange-400">
                            Semestre finalizado
                          </div>
                          <div className="text-sm text-orange-600/80">
                            Recomendamos arquivar e iniciar um novo semestre
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={handleArchiveSemester} 
                        variant="outline"
                        className="gap-2 border-orange-200 hover:bg-orange-50"
                      >
                        <Archive className="h-4 w-4" />
                        Arquivar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 p-4 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div>
                        <div className="font-semibold text-blue-700 dark:text-blue-400">
                          Dados do semestre incompletos
                        </div>
                        <div className="text-sm text-blue-600/80">
                          Configure as datas do semestre para acompanhar o progresso
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Novo semestre */}
              <motion.div variants={itemVariants}>
                {!showNewSemester ? (
                  <Button 
                    onClick={() => setShowNewSemester(true)} 
                    variant="outline" 
                    className="w-full h-14 gap-3 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                  >
                    <Plus className="h-5 w-5" />
                    Iniciar Novo Semestre
                  </Button>
                ) : (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">Configurar Novo Semestre</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewSemester(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Data de Início</Label>
                          <Input
                            type="date"
                            value={newSemesterData.semesterStart}
                            onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterStart: e.target.value })}
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data de Término</Label>
                          <Input
                            type="date"
                            value={newSemesterData.semesterEnd}
                            onChange={(e) => setNewSemesterData({ ...newSemesterData, semesterEnd: e.target.value })}
                            className="bg-background"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button onClick={handleStartNewSemester} className="flex-1 gap-2">
                          <Save className="h-4 w-4" />
                          Iniciar Semestre
                        </Button>
                        <Button 
                          onClick={() => setShowNewSemester(false)} 
                          variant="outline" 
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DesktopSemesterSection;