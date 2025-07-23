import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'yellow';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  className
}) => {
  const colorConfig = {
    blue: {
      bg: 'from-blue-500/10 via-blue-500/5 to-transparent',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-600',
      border: 'border-blue-200',
      accent: 'bg-blue-500/10'
    },
    purple: {
      bg: 'from-purple-500/10 via-purple-500/5 to-transparent',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-600',
      border: 'border-purple-200',
      accent: 'bg-purple-500/10'
    },
    green: {
      bg: 'from-green-500/10 via-green-500/5 to-transparent',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
      border: 'border-green-200',
      accent: 'bg-green-500/10'
    },
    red: {
      bg: 'from-red-500/10 via-red-500/5 to-transparent',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
      border: 'border-red-200',
      accent: 'bg-red-500/10'
    },
    orange: {
      bg: 'from-orange-500/10 via-orange-500/5 to-transparent',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-600',
      valueColor: 'text-orange-600',
      border: 'border-orange-200',
      accent: 'bg-orange-500/10'
    },
    yellow: {
      bg: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-600',
      valueColor: 'text-yellow-600',
      border: 'border-yellow-200',
      accent: 'bg-yellow-500/10'
    }
  };

  const config = colorConfig[color];

  return (
    <Card className={cn(
      `relative overflow-hidden border-0 shadow-xl bg-gradient-to-br ${config.bg} hover:shadow-2xl transition-all duration-300`,
      className
    )}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-20 h-20 -translate-y-10 translate-x-10 opacity-30">
        <div className={`w-full h-full ${config.accent} rounded-full`} />
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 translate-y-8 -translate-x-8 opacity-20">
        <div className={`w-full h-full ${config.accent} rounded-full`} />
      </div>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${config.iconBg} rounded-2xl shadow-lg`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          {trend && (
            <Badge 
              variant={trend.isPositive ? "default" : "secondary"}
              className={cn(
                "flex items-center space-x-1 px-3 py-1",
                trend.isPositive 
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs font-semibold">
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className={`text-4xl font-bold ${config.valueColor} tracking-tight`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground flex items-center space-x-1">
              <div className={`w-1 h-1 ${config.accent} rounded-full`} />
              <span>{subtitle}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;