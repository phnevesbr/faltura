import React from 'react';
import { Button } from '../ui/button';

interface DayFilterTabsProps {
  selectedDay: number | null;
  onDaySelect: (day: number | null) => void;
  showSaturday?: boolean;
  isSundayEnabled?: boolean;
}

const DayFilterTabs: React.FC<DayFilterTabsProps> = ({ 
  selectedDay, 
  onDaySelect, 
  showSaturday = false,
  isSundayEnabled = false 
}) => {
  const baseDays = [
    { label: 'Todos', value: null },
    { label: 'Seg', value: 0 },
    { label: 'Ter', value: 1 },
    { label: 'Qua', value: 2 },
    { label: 'Qui', value: 3 },
    { label: 'Sex', value: 4 }
  ];

  const days = [
    ...baseDays,
    ...(showSaturday ? [{ label: 'Sáb', value: 5 }] : []),
    ...(isSundayEnabled ? [{ label: 'Dom', value: 6 }] : [])
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1">
      <div className="flex gap-2 min-w-max py-1">
        {days.map((day) => (
          <Button
            key={day.label}
            variant={selectedDay === day.value ? "default" : "outline"}
            size="sm"
            onClick={() => onDaySelect(day.value)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
              whitespace-nowrap min-w-[64px] flex-shrink-0 h-9
              ${selectedDay === day.value 
                ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                : 'bg-background hover:bg-muted border-border hover:scale-105'
              }
            `}
          >
            {day.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DayFilterTabs;