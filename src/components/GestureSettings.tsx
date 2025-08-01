import React from 'react';
import { useGesturesContext } from '../contexts/GesturesContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Hand, Zap, Settings } from 'lucide-react';

export const GestureSettings: React.FC = () => {
  const { settings, updateSettings } = useGesturesContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Hand className="h-5 w-5" />
          <span>Configurações de Gestos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Deslizar para ações</Label>
              <p className="text-xs text-gray-500">Swipe left/right para deletar e acessar opções</p>
            </div>
            <Switch
              checked={settings.swipeEnabled}
              onCheckedChange={(checked) => updateSettings({ swipeEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Toque duplo</Label>
              <p className="text-xs text-gray-500">Double tap para marcar como concluído</p>
            </div>
            <Switch
              checked={settings.doubleTapEnabled}
              onCheckedChange={(checked) => updateSettings({ doubleTapEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Toque longo</Label>
              <p className="text-xs text-gray-500">Long press para ver detalhes</p>
            </div>
            <Switch
              checked={settings.longPressEnabled}
              onCheckedChange={(checked) => updateSettings({ longPressEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Vibração</Label>
              <p className="text-xs text-gray-500">Feedback tátil nos gestos</p>
            </div>
            <Switch
              checked={settings.hapticFeedback}
              onCheckedChange={(checked) => updateSettings({ hapticFeedback: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Sensibilidade</Label>
            <Select 
              value={settings.sensitivity} 
              onValueChange={(value: 'slow' | 'normal' | 'fast') => updateSettings({ sensitivity: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Lenta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Rápida</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Ajusta a velocidade necessária para os gestos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};