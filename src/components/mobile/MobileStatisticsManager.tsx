import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingUp, Calendar, BookOpen, AlertTriangle, Target, Activity } from 'lucide-react';

const MobileStatisticsManager: React.FC = () => {
  const { subjects, schedule, absences } = useData();
  const { timeSlots } = useScheduleConfig();

  // Estatísticas gerais
  const totalClasses = schedule.length;
  const totalAbsences = absences.reduce((total, absence) => {
    return total + absence.subjects.reduce((sum, subject) => sum + subject.classCount, 0);
  }, 0);

  // Estatísticas das matérias
  const subjectStats = React.useMemo(() => {
    return subjects.map(subject => {
      const classCount = schedule.filter(s => s.subjectId === subject.id).length;
      const totalAbsences = subject.currentAbsences;
      const percentage = subject.maxAbsences > 0 ? Math.round((totalAbsences / subject.maxAbsences) * 100) : 0;
      
      return {
        name: subject.name,
        classes: classCount,
        absences: totalAbsences,
        maxAbsences: subject.maxAbsences,
        percentage,
        status: percentage >= 100 ? 'reprovado' : percentage >= 90 ? 'perigo' : percentage >= 75 ? 'atencao' : 'ok',
        color: subject.color
      };
    });
  }, [subjects, schedule]);

  // Estatísticas por dia da semana
  const scheduleStats = React.useMemo(() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    return days.map((day, index) => {
      const dayClasses = schedule.filter(s => s.day === index).length;
      return {
        day,
        classes: dayClasses,
        percentage: timeSlots.length > 0 ? Math.round((dayClasses / timeSlots.length) * 100) : 0
      };
    });
  }, [schedule, timeSlots]);

  const subjectsAtRisk = subjectStats.filter(s => s.percentage >= 75).length;
  const subjectsReprovadas = subjectStats.filter(s => s.percentage >= 100).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Estatísticas</h1>
        <p className="text-sm text-gray-500">Resumo da sua situação acadêmica</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{totalClasses}</span>
            </div>
            <p className="text-xs text-gray-500">Total de Aulas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{totalAbsences}</span>
            </div>
            <p className="text-xs text-gray-500">Total de Faltas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">{subjectsAtRisk}</span>
            </div>
            <p className="text-xs text-gray-500">Em Risco</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{subjectsReprovadas}</span>
            </div>
            <p className="text-xs text-gray-500">Reprovações</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de aulas por dia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <TrendingUp className="h-4 w-4 mr-2" />
            Aulas por Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scheduleStats.map((stat, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{stat.day}</span>
                <span className="text-sm text-gray-500">{stat.classes} aulas</span>
              </div>
              <Progress 
                value={stat.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Situação das matérias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <BookOpen className="h-4 w-4 mr-2" />
            Situação das Matérias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectStats.length > 0 ? (
            <div className="space-y-3">
              {subjectStats.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm font-medium truncate">{subject.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-bold ${
                        subject.status === 'reprovado' ? 'text-red-600' :
                        subject.status === 'perigo' ? 'text-red-500' :
                        subject.status === 'atencao' ? 'text-orange-500' :
                        'text-green-600'
                      }`}>
                        {subject.percentage}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(subject.percentage, 100)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{subject.absences}/{subject.maxAbsences} faltas</span>
                      <span>
                        {subject.status === 'reprovado' ? 'REPROVADO' :
                         subject.status === 'perigo' ? 'PERIGO' :
                         subject.status === 'atencao' ? 'ATENÇÃO' :
                         'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Cadastre suas matérias para ver as estatísticas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileStatisticsManager;