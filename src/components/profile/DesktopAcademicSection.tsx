import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { motion } from 'framer-motion';
import { GraduationCap, School, Clock, Edit3 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DesktopAcademicSectionProps {
  isEditing: boolean;
  formData: {
    course: string;
    university: string;
    shift: string;
    semesterStart: string;
    semesterEnd: string;
  };
  profile: any;
  onFormDataChange: (data: any) => void;
}

const DesktopAcademicSection: React.FC<DesktopAcademicSectionProps> = ({
  isEditing,
  formData,
  profile,
  onFormDataChange
}) => {
  const shiftLabels = {
    morning: 'Matutino',
    afternoon: 'Vespertino', 
    night: 'Noturno'
  };

  const shiftIcons = {
    morning: '🌅',
    afternoon: '🌞',
    night: '🌙'
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
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              Informações Acadêmicas
              {isEditing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Edit3 className="h-4 w-4" />
                  Editando
                </div>
              )}
            </CardTitle>
          </motion.div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Curso */}
            <motion.div variants={itemVariants} className="space-y-3">
              <Label htmlFor="course" className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Curso
              </Label>
              {isEditing ? (
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => onFormDataChange({ ...formData, course: e.target.value })}
                  placeholder="Digite seu curso"
                  className="h-12 bg-background/50 border-primary/20 focus:border-primary transition-all"
                />
              ) : (
                <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-lg font-medium">
                    {profile?.course || (
                      <span className="text-muted-foreground italic">Não informado</span>
                    )}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Universidade */}
            <motion.div variants={itemVariants} className="space-y-3">
              <Label htmlFor="university" className="text-base font-semibold flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                Universidade/Escola
              </Label>
              {isEditing ? (
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => onFormDataChange({ ...formData, university: e.target.value })}
                  placeholder="Digite sua instituição"
                  className="h-12 bg-background/50 border-primary/20 focus:border-primary transition-all"
                />
              ) : (
                <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-lg font-medium">
                    {profile?.university || (
                      <span className="text-muted-foreground italic">Não informado</span>
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Turno */}
          <motion.div variants={itemVariants} className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Turno
            </Label>
            {isEditing ? (
              <Select 
                value={formData.shift} 
                onValueChange={(value: any) => onFormDataChange({ ...formData, shift: value })}
              >
                <SelectTrigger className="h-12 bg-background/50 border-primary/20 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">🌅 Matutino</SelectItem>
                  <SelectItem value="afternoon">🌞 Vespertino</SelectItem>
                  <SelectItem value="night">🌙 Noturno</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {shiftIcons[profile?.shift || 'morning']}
                  </span>
                  <p className="text-lg font-medium">
                    {shiftLabels[profile?.shift || 'morning']}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Informações adicionais quando não está editando */}
          {!isEditing && (
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
            >
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20">
                <div className="text-2xl mb-2">📚</div>
                <div className="font-semibold text-blue-700 dark:text-blue-400">
                  {profile?.course ? 'Curso definido' : 'Curso pendente'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Status do curso</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20">
                <div className="text-2xl mb-2">🏫</div>
                <div className="font-semibold text-green-700 dark:text-green-400">
                  {profile?.university ? 'Instituição ativa' : 'Instituição pendente'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Status da instituição</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20">
                <div className="text-2xl mb-2">{shiftIcons[profile?.shift || 'morning']}</div>
                <div className="font-semibold text-purple-700 dark:text-purple-400">
                  {shiftLabels[profile?.shift || 'morning']}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Turno definido</div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DesktopAcademicSection;