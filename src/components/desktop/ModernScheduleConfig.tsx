import React, { useState, useEffect } from 'react';
import { useScheduleConfig } from '../../contexts/ScheduleConfigContext';
import { useSundayConfig } from '../../hooks/useSundayConfig';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { 
  Plus, 
  X, 
  Clock, 
  RotateCcw, 
  Settings2, 
  Calendar,
  Zap,
  Save,
  Copy,
  Download,
  Upload,
  Grid3X3,
  List,
  Palette,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

const ModernScheduleConfig: React.FC = () => {
  const { timeSlots, updateTimeSlot, addTimeSlot, removeTimeSlot, resetToDefault } = useScheduleConfig();
  const { shouldShowNotification } = useNotifications();
  const { isSundayEnabled } = useSundayConfig();
  const [selectedTab, setSelectedTab] = useState('slots');
  const [showSaturday, setShowSaturday] = useState(() => {
    const saved = localStorage.getItem('faltula_show_saturday');
    return saved ? JSON.parse(saved) : false;
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewMode, setPreviewMode] = useState(false);

  // Salvar estado do sábado no localStorage
  useEffect(() => {
    localStorage.setItem('faltula_show_saturday', JSON.stringify(showSaturday));
  }, [showSaturday]);

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    const slot = timeSlots.find(s => s.id === id);
    if (!slot) return;

    const startTime = field === 'startTime' ? value : slot.startTime;
    const endTime = field === 'endTime' ? value : slot.endTime;

    if (startTime && endTime) {
      updateTimeSlot(id, startTime, endTime);
      
      if (shouldShowNotification('grade')) {
        toast.success("⚡ Horário atualizado!", {
          description: `Configuração salva: ${startTime} - ${endTime}`,
        });
      }
    }
  };

  const handleReset = () => {
    resetToDefault();
    toast.success("🔄 Configuração restaurada", {
      description: "Os horários foram restaurados para o padrão do sistema.",
    });
  };

  const handleQuickAdd = () => {
    addTimeSlot();
    if (shouldShowNotification('grade')) {
      toast.success("⚡ Novo horário adicionado!", {
        description: "Um novo slot de tempo foi criado automaticamente.",
      });
    }
  };

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  if (showSaturday) {
    days.push('Sábado');
  }
  if (isSundayEnabled()) {
    days.push('Domingo');
  }

  const getTimeSlotDuration = (slot: any) => {
    if (!slot.startTime || !slot.endTime) return 0;
    const start = new Date(`2000-01-01T${slot.startTime}`);
    const end = new Date(`2000-01-01T${slot.endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  };

  const getTotalDailyHours = () => {
    return timeSlots.reduce((total, slot) => total + getTimeSlotDuration(slot), 0) / 60;
  };

  // Grid view for time slots
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {timeSlots.map((slot, index) => {
        const duration = getTimeSlotDuration(slot);
        return (
          <Card
            key={slot.id}
            className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-foreground opacity-80" />
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs font-medium">
                  Aula {index + 1}
                </Badge>
                {timeSlots.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTimeSlot(slot.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`start-${slot.id}`} className="text-sm font-medium flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Início
                  </Label>
                  <Input
                    id={`start-${slot.id}`}
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeChange(slot.id, 'startTime', e.target.value)}
                    className="h-10 text-center font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`end-${slot.id}`} className="text-sm font-medium flex items-center">
                    <Timer className="h-3 w-3 mr-1" />
                    Fim
                  </Label>
                  <Input
                    id={`end-${slot.id}`}
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeChange(slot.id, 'endTime', e.target.value)}
                    className="h-10 text-center font-mono"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{duration}min</div>
                  <div className="text-xs text-muted-foreground">duração</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Add New Slot Card */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-300 cursor-pointer group" onClick={handleQuickAdd}>
        <CardContent className="flex flex-col items-center justify-center h-full py-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Adicionar novo horário
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // List view for time slots
  const ListView = () => (
    <div className="space-y-3">
      {timeSlots.map((slot, index) => (
        <Card key={slot.id} className="border border-border hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs min-w-[60px] justify-center">
                Aula {index + 1}
              </Badge>
              
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  <Label className="text-xs text-muted-foreground min-w-[40px]">Início:</Label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeChange(slot.id, 'startTime', e.target.value)}
                    className="h-8 w-20 text-xs text-center"
                  />
                </div>
                
                <span className="text-muted-foreground">→</span>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-xs text-muted-foreground min-w-[30px]">Fim:</Label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeChange(slot.id, 'endTime', e.target.value)}
                    className="h-8 w-20 text-xs text-center"
                  />
                </div>
                
                <Badge variant="secondary" className="text-xs">
                  {getTimeSlotDuration(slot)}min
                </Badge>
              </div>
              
              {timeSlots.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTimeSlot(slot.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Preview of schedule grid
  const SchedulePreview = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Grid3X3 className="h-5 w-5 mr-2" />
          Prévia da Grade Horária
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}>
          {/* Header */}
          <div className="font-medium text-sm text-center p-2 bg-muted rounded">Horário</div>
          {days.map(day => (
            <div key={day} className="font-medium text-sm text-center p-2 bg-muted rounded">
              {day}
            </div>
          ))}
          
          {/* Time slots */}
          {timeSlots.map((slot, index) => (
            <React.Fragment key={slot.id}>
              <div className="text-xs text-center p-2 border rounded flex flex-col items-center justify-center">
                <div className="font-medium">{slot.startTime}</div>
                <div className="text-muted-foreground">-</div>
                <div className="font-medium">{slot.endTime}</div>
              </div>
              {days.map((_, dayIndex) => (
                <div
                  key={`${dayIndex}-${index}`}
                  className="h-16 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center text-xs text-muted-foreground"
                >
                  Vazio
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuração Avançada</h1>
          <p className="text-muted-foreground">Configure seus horários de aula de forma inteligente</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid3X3 className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Lista' : 'Grade'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
          
          <Button size="sm" onClick={() => {
            toast.success("⚡ Configurações salvas!", {
              description: "Todas as suas configurações foram salvas com sucesso.",
            });
          }}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{timeSlots.length}</div>
                <div className="text-xs text-muted-foreground">Horários/dia</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{getTotalDailyHours().toFixed(1)}h</div>
                <div className="text-xs text-muted-foreground">Total/dia</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{days.length}</div>
                <div className="text-xs text-muted-foreground">Dias ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{(getTotalDailyHours() * days.length).toFixed(1)}h</div>
                <div className="text-xs text-muted-foreground">Total semanal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="slots" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Horários</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings2 className="h-4 w-4" />
            <span>Configurações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slots" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Configuração de Horários
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleQuickAdd}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'grid' ? <GridView /> : <ListView />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings2 className="h-5 w-5 mr-2" />
                Configurações da Grade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Incluir Sábado</Label>
                  <p className="text-sm text-muted-foreground">
                    Adiciona o sábado à sua grade horária semanal
                  </p>
                </div>
                <Switch
                  checked={showSaturday}
                  onCheckedChange={setShowSaturday}
                />
              </div>
              
              {isSundayEnabled() && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Domingo Ativo</Label>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        O domingo está habilitado pelo administrador
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-4">
                <Label className="text-base font-medium">Ações Rápidas</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar Configuração
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Grade
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Configuração
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Palette className="h-4 w-4 mr-2" />
                    Personalizar Cores
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Dicas Inteligentes</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Configure horários flexíveis para se adaptar a diferentes durações de aula</p>
                <p>• Use o sábado para aulas de reposição ou atividades extras</p>
                <p>• A prévia mostra como sua grade ficará organizada</p>
                <p>• Cada configuração é salva automaticamente</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernScheduleConfig;