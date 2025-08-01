
import React from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

const predefinedColors = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5A2B', // Brown
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#F97316', // Orange
  '#3B82F6', // Blue
  '#8B5A3C', // Amber brown
  '#059669', // Emerald green
  '#DC2626', // Red 600
  '#7C3AED', // Violet
  '#0891B2', // Cyan 600
];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange, disabled }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 border-2"
          style={{ backgroundColor: selectedColor }}
        >
          <Palette className="h-3 w-3 text-white drop-shadow-sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <p className="text-sm font-medium">Escolha uma cor</p>
          <div className="grid grid-cols-8 gap-2">
            {predefinedColors.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                  selectedColor === color ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                title={color}
              />
            ))}
          </div>
          <div className="pt-2 border-t">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full h-8 rounded border cursor-pointer"
              title="Cor personalizada"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
