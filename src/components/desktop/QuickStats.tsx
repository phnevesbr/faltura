import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  BookOpen, 
  UserCheck, 
  FileText, 
  Trophy,
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useNotes } from '../../contexts/NotesContext';

const QuickStats: React.FC = () => {
  const { subjects, absences, schedule } = useData();
  const { getTodayNotes, getUpcomingNotes } = useNotes();

  const todayNotes = getTodayNotes();
  const upcomingNotes = getUpcomingNotes();

  // Calculate stats
  const totalSubjects = subjects.length;
  const totalAbsences = absences.length;
  const subjectsNearLimit = subjects.filter(subject => {
    const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
    return percentage >= 75;
  }).length;
  
  const totalScheduleSlots = schedule.length;
  const completedNotes = todayNotes.filter(note => note.completed).length;

  const stats = [
    {
      title: 'Matérias',
      value: totalSubjects,
      subtitle: 'Cadastradas',
      icon: BookOpen,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Faltas',
      value: totalAbsences,
      subtitle: 'Registradas',
      icon: UserCheck,
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    {
      title: 'Anotações',
      value: todayNotes.length + upcomingNotes.length,
      subtitle: `${completedNotes} concluídas`,
      icon: FileText,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Grade',
      value: totalScheduleSlots,
      subtitle: 'Aulas/semana',
      icon: Calendar,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card 
            key={index}
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Alert for subjects near limit */}
              {stat.title === 'Matérias' && subjectsNearLimit > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-orange-600 font-medium">
                      {subjectsNearLimit} próxima{subjectsNearLimit > 1 ? 's' : ''} do limite
                    </span>
                  </div>
                </div>
              )}
              
              {/* Progress indicator for notes */}
              {stat.title === 'Anotações' && (todayNotes.length > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Progresso</span>
                    <span className="text-slate-700 font-medium">
                      {Math.round((completedNotes / todayNotes.length) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(completedNotes / todayNotes.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Subtle background decoration */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-bl-full`} />
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStats;