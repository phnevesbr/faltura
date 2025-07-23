import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface ModernCardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
  noPadding?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  title,
  icon,
  children,
  className,
  gradient = false,
  hover = true,
  noPadding = false
}) => {
  return (
    <Card 
      className={cn(
        "transition-all duration-300 border-0 shadow-sm",
        hover && "hover:shadow-xl hover:scale-[1.02]",
        gradient && "bg-gradient-to-br from-white to-slate-50",
        "backdrop-blur-sm bg-white/80",
        className
      )}
    >
      {title && (
        <CardHeader className={noPadding ? "p-0" : "pb-3"}>
          <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
            {icon}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={noPadding ? "p-0" : undefined}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ModernCard;