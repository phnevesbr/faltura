
import React from 'react';
import { useData } from '../contexts/DataContext';
import { useScheduleConfig } from '../contexts/ScheduleConfigContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, BookOpen, AlertTriangle, Target, Activity } from 'lucide-react';

const StatisticsManager: React.FC = () => {
  const { subjects, schedule, absences } = useData();
  const { timeSlots } = useScheduleConfig();

  // Calcular estatísticas dos horários por dia
  const scheduleStats = React.useMemo(() => {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    return days.map((day, index) => {
      const dayClasses = schedule.filter(s => s.day === index).length;
      return {
        day,
        classes: dayClasses,
        percentage: Math.round((dayClasses / timeSlots.length) * 100)
      };
    });
  }, [schedule, timeSlots]);

  // Estatísticas das matérias
  const subjectStats = React.useMemo(() => {
    return subjects.map(subject => {
      const classCount = schedule.filter(s => s.subjectId === subject.id).length;
      const totalAbsences = subject.currentAbsences;
      const faltsPercentage = subject.maxAbsences > 0 ? Math.round((totalAbsences / subject.maxAbsences) * 100) : 0;
      
      return {
        name: subject.name,
        classes: classCount,
        absences: totalAbsences,
        maxAbsences: subject.maxAbsences,
        faltaPercentage: faltsPercentage,
        status: faltsPercentage >= 100 ? 'reprovado' : faltsPercentage >= 90 ? 'perigo' : faltsPercentage >= 75 ? 'atencao' : 'ok',
        color: subject.color
      };
    });
  }, [subjects, schedule]);

  // Estatísticas de faltas por dia da semana
  const absencesByDay = React.useMemo(() => {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    return days.map((day, index) => {
      // Contar faltas baseado na data da falta e no dia da semana
      const dayAbsences = absences.filter(absence => {
        const dateObj = new Date(absence.date + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to our 0-4 system
        return adjustedDay === index;
      }).reduce((total, absence) => {
        // Somar todas as aulas faltadas neste dia
        return total + absence.subjects.reduce((sum, subject) => sum + subject.classCount, 0);
      }, 0);
      
      return {
        day,
        absences: dayAbsences
      };
    });
  }, [absences]);

  const totalClasses = schedule.length;
  const totalAbsences = absences.reduce((total, absence) => {
    return total + absence.subjects.reduce((sum, subject) => sum + subject.classCount, 0);
  }, 0);
  
  // Calcular quantas matérias estão em situação de risco (acima de 75% do limite)
  const subjectsAtRisk = subjectStats.filter(s => s.faltaPercentage >= 75).length;
  const subjectsReprovadas = subjectStats.filter(s => s.faltaPercentage >= 100).length;

  const chartConfig = {
    classes: {
      label: "Aulas",
      color: "hsl(var(--primary))",
    },
    absences: {
      label: "Faltas",
      color: "hsl(var(--destructive))",
    },
    attendance: {
      label: "Faltas %",
      color: "hsl(var(--muted-foreground))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              {subjects.length} matérias ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faltas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAbsences}</div>
            <p className="text-xs text-muted-foreground">
              Faltas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matérias em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{subjectsAtRisk}</div>
            <p className="text-xs text-muted-foreground">
              Acima de 75% do limite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reprovações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{subjectsReprovadas}</div>
            <p className="text-xs text-muted-foreground">
              Limite de faltas excedido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Aulas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Distribuição de Aulas por Dia
            </CardTitle>
            <CardDescription>
              Quantidade de aulas agendadas para cada dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scheduleStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="classes" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Faltas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Faltas por Dia da Semana
            </CardTitle>
            <CardDescription>
              Distribuição das faltas ao longo da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={absencesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="absences" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas das Matérias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Situação das Matérias
          </CardTitle>
          <CardDescription>
            Status atual de faltas de cada matéria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjectStats.length > 0 ? (
            <div className="space-y-4">
              {subjectStats.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: subject.color }}
                    />
                    <div>
                      <h4 className="font-medium">{subject.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {subject.classes} aulas • {subject.absences}/{subject.maxAbsences} faltas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      subject.status === 'reprovado' ? 'text-red-600' :
                      subject.status === 'perigo' ? 'text-red-500' :
                      subject.status === 'atencao' ? 'text-orange-500' :
                      'text-green-600'
                    }`}>
                      {subject.faltaPercentage}%
                    </div>
                    <p className="text-xs text-muted-foreground">do limite</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Cadastre suas matérias para ver as estatísticas detalhadas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsManager;
