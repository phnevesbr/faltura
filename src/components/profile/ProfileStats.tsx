import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Calendar, BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useGamification } from '../../contexts/GamificationContext';

const ProfileStats: React.FC = () => {
  const { profile, getDaysUntilSemesterEnd } = useProfile();
  const { userLevel } = useGamification();

  const daysUntilEnd = getDaysUntilSemesterEnd();
  const daysInApp = profile?.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const stats = [
    {
      title: 'Dias no App',
      value: daysInApp,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Desde o cadastro'
    },
    {
      title: 'Nível Atual',
      value: userLevel?.level || 1,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: userLevel?.current_tier || 'Calouro'
    },
    {
      title: 'XP Total',
      value: userLevel?.total_experience || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Experiência acumulada'
    },
    {
      title: 'Dias Restantes',
      value: Math.max(0, daysUntilEnd),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'No semestre'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
              <div className="text-sm font-medium text-foreground">
                {stat.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.description}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStats;