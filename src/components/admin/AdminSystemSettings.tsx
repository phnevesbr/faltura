import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Settings, 
  RefreshCw,
  Shield,
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  Palette,
  Lock,
  Unlock,
  Trophy,
  Bell,
  Mail,
  RotateCcw,
  CalendarIcon,
  Clock,
  Download,
  Edit,
  Loader2
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';


interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  category: string;
  editable_by: string[];
}

interface GamificationSetting {
  id: string;
  action_type: string;
  category: string;
  description: string;
  xp_reward: number;
  created_at: string;
  updated_at: string;
}

const AdminSystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [advancedSettings, setAdvancedSettings] = useState<any>({});
  const [gamificationSettings, setGamificationSettings] = useState<GamificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('system');
  const [customResetDate, setCustomResetDate] = useState<Date>();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load system settings
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category, setting_key');

      if (error) throw error;

      setSettings(data || []);
      
      // Load advanced settings
      const { data: advancedData, error: advancedError } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', [
          'email_verification_required',
          'ranking_reset_frequency',
          'rate_limit_login_attempts',
          'rate_limit_account_creation',
          'rate_limit_import_grade',
          'rate_limit_profile_edit'
        ]);

      if (advancedError) throw advancedError;

      const advancedSettingsMap: any = {};
      advancedData?.forEach(setting => {
        try {
          advancedSettingsMap[setting.setting_key] = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
        } catch {
          advancedSettingsMap[setting.setting_key] = setting.setting_value;
        }
      });

      setAdvancedSettings(advancedSettingsMap);
      
      // Load gamification settings
      const { data: gamificationData, error: gamificationError } = await supabase
        .from('gamification_settings')
        .select('*')
        .order('category, action_type');

      if (gamificationError) {
        console.error('Erro ao carregar gamificação:', gamificationError);
      } else {
        setGamificationSettings(gamificationData || []);
      }
      
      // Set default active category based on available data
      if (data && data.length > 0) {
        setActiveCategory(data[0].category);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingId: string, newValue: any) => {
    try {
      setSaving(settingId);
      
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: newValue })
        .eq('id', settingId);

      if (error) throw error;

      setSettings(prev => prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, setting_value: newValue }
          : setting
      ));

      toast.success('Configuração atualizada com sucesso');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setSaving(null);
    }
  };

  const updateAdvancedSetting = async (key: string, value: any) => {
    try {
      setSaving(key);
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;

      setAdvancedSettings(prev => ({
        ...prev,
        [key]: value
      }));

      toast.success('Configuração atualizada com sucesso');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setSaving(null);
    }
  };

  const resetAllRankings = async () => {
    try {
      setSaving('rankings');
      const { error } = await supabase.rpc('reset_user_rankings');
      
      if (error) throw error;

      // Atualizar data do último reset
      await updateAdvancedSetting('ranking_reset_frequency', {
        ...advancedSettings.ranking_reset_frequency,
        last_reset: new Date().toISOString()
      });

      toast.success('Rankings resetados com sucesso!');
    } catch (error) {
      console.error('Error resetting rankings:', error);
      toast.error('Erro ao resetar rankings');
    } finally {
      setSaving(null);
    }
  };

  const updateGamificationSetting = async (id: string, xp_reward: number) => {
    try {
      setSaving(`gamification_${id}`);
      
      const { error } = await supabase
        .from('gamification_settings')
        .update({ 
          xp_reward,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local imediatamente
      setGamificationSettings(prev => 
        prev.map(setting => 
          setting.id === id 
            ? { ...setting, xp_reward, updated_at: new Date().toISOString() }
            : setting
        )
      );

      toast.success('XP atualizado com sucesso');
    } catch (error) {
      console.error('Error updating gamification setting:', error);
      toast.error('Erro ao atualizar XP');
      
      // Recarregar dados em caso de erro
      await loadSettings();
    } finally {
      setSaving(null);
    }
  };

  const handleXpChange = (id: string, value: string) => {
    const newValue = parseInt(value) || 0;
    
    // Atualizar estado local imediatamente para feedback visual
    setGamificationSettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, xp_reward: newValue }
          : setting
      )
    );
  };

  const handleXpBlur = (id: string, value: string) => {
    const newValue = parseInt(value) || 0;
    updateGamificationSetting(id, newValue);
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = setting.setting_value;
    const isLoading = saving === setting.id;
    
    switch (setting.setting_key) {
      case 'maintenance_mode':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                {value?.enabled ? (
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium">Modo de Manutenção</p>
                  <p className="text-sm text-muted-foreground">
                    {value?.enabled ? 'Sistema em manutenção' : 'Sistema funcionando normalmente'}
                  </p>
                </div>
              </div>
              <Switch
                checked={value?.enabled || false}
                onCheckedChange={(checked) => 
                  updateSetting(setting.id, { ...value, enabled: checked })
                }
                disabled={isLoading}
              />
            </div>
            
            {value?.enabled && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Mensagem de Manutenção</label>
                <Textarea
                  value={value?.message || ''}
                  onChange={(e) => 
                    updateSetting(setting.id, { ...value, message: e.target.value })
                  }
                  placeholder="Mensagem exibida durante a manutenção..."
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        );

      case 'registration_enabled':
        return (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {value?.enabled ? (
                <div className="p-2 bg-green-100 rounded-lg">
                  <Unlock className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 rounded-lg">
                  <Lock className="h-5 w-5 text-red-600" />
                </div>
              )}
              <div>
                <p className="font-medium">Registros de Novos Usuários</p>
                <p className="text-sm text-muted-foreground">
                  {value?.enabled ? 'Permitindo novos registros' : 'Registros bloqueados'}
                </p>
              </div>
            </div>
            <Switch
              checked={value?.enabled || false}
              onCheckedChange={(checked) => 
                updateSetting(setting.id, { enabled: checked })
              }
              disabled={isLoading}
            />
          </div>
        );

      case 'notification_settings':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Notificações Push</p>
                  <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                </div>
              </div>
              <Switch
                checked={value?.push_enabled || false}
                onCheckedChange={(checked) => 
                  updateSetting(setting.id, { ...value, push_enabled: checked })
                }
                disabled={isLoading}
              />
            </div>
          </div>
        );

      case 'max_absence_limit':
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">Limite Máximo de Faltas por Matéria</label>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                value={value?.value || 15}
                onChange={(e) => 
                  updateSetting(setting.id, { value: parseInt(e.target.value) || 15 })
                }
                className="flex-1"
                disabled={isLoading}
                min="1"
                max="50"
              />
              <Badge variant="secondary">faltas</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Limite padrão aplicado ao criar novas matérias
            </p>
          </div>
        );

      case 'achievement_multiplier':
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">Multiplicador de Experiência</label>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                step="0.1"
                value={value?.value || 1.0}
                onChange={(e) => 
                  updateSetting(setting.id, { value: parseFloat(e.target.value) || 1.0 })
                }
                className="flex-1"
                disabled={isLoading}
                min="0.1"
                max="5"
              />
              <Badge variant="secondary">×{value?.value || 1.0}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Multiplicador global para experiência ganha
            </p>
          </div>
        );

      case 'include_sunday_schedule':
        return (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {value?.enabled && value?.value ? (
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-gray-600" />
                </div>
              )}
              <div>
                <p className="font-medium">Incluir Domingo na Grade</p>
                <p className="text-sm text-muted-foreground">
                  {value?.enabled && value?.value ? 'Domingo está disponível na grade horária' : 'Domingo não aparece na grade horária'}
                </p>
              </div>
            </div>
            <Switch
              checked={value?.enabled && value?.value || false}
              onCheckedChange={(checked) => 
                updateSetting(setting.id, { enabled: true, value: checked })
              }
              disabled={isLoading}
            />
          </div>
        );

      case 'max_subjects_limit':
      case 'max_tasks_limit':
      case 'max_class_memberships':
      case 'max_class_leadership':
      case 'max_time_slots':
      case 'max_semester_duration':
      case 'rate_limit_import_grade':
      case 'rate_limit_profile_edit':
      case 'rate_limit_login_attempts':
      case 'rate_limit_account_creation':
        const getSettingInfo = (key: string) => {
          const info = {
            'max_subjects_limit': { label: 'Limite de Matérias', unit: 'matérias', min: 1, max: 50 },
            'max_tasks_limit': { label: 'Limite de Tarefas', unit: 'tarefas', min: 1, max: 200 },
            'max_class_memberships': { label: 'Limite de Participação em Turmas', unit: 'turmas', min: 1, max: 20 },
            'max_class_leadership': { label: 'Limite de Liderança de Turmas', unit: 'turmas', min: 1, max: 10 },
            'max_time_slots': { label: 'Limite de Horários', unit: 'horários', min: 1, max: 20 },
            'max_semester_duration': { label: 'Duração Máxima do Semestre', unit: 'meses', min: 1, max: 12 },
            'rate_limit_import_grade': { label: 'Limite de Importar Grade', unit: 'por dia', min: 1, max: 10 },
            'rate_limit_profile_edit': { label: 'Limite de Editar Perfil', unit: 'por dia', min: 1, max: 20 },
            'rate_limit_login_attempts': { label: 'Limite de Tentativas de Login', unit: 'por hora', min: 1, max: 50 },
            'rate_limit_account_creation': { label: 'Limite de Criação de Contas', unit: 'por dia', min: 1, max: 20 }
          };
          return info[key] || { label: key, unit: '', min: 1, max: 100 };
        };
        
        const settingInfo = getSettingInfo(setting.setting_key);
        
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">{settingInfo.label}</label>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                value={value?.value || settingInfo.min}
                onChange={(e) => 
                  updateSetting(setting.id, { value: parseInt(e.target.value) || settingInfo.min })
                }
                className="flex-1"
                disabled={isLoading}
                min={settingInfo.min}
                max={settingInfo.max}
              />
              <Badge variant="secondary">{settingInfo.unit}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Limite aplicado a todos os usuários da plataforma
            </p>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium capitalize">
              {setting.setting_key.replace(/_/g, ' ')}
            </label>
            <Textarea
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateSetting(setting.id, parsed);
                } catch {
                  updateSetting(setting.id, e.target.value);
                }
              }}
              className="font-mono text-sm"
              disabled={isLoading}
              rows={6}
            />
          </div>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Settings className="h-5 w-5" />;
      case 'academic': return <Trophy className="h-5 w-5" />;
      case 'system': return <Shield className="h-5 w-5" />;
      case 'auth': return <Shield className="h-5 w-5" />;
      case 'notifications': return <Bell className="h-5 w-5" />;
      case 'gamification': return <Trophy className="h-5 w-5" />;
      case 'security': return <Lock className="h-5 w-5" />;
      case 'classes': return <Users className="h-5 w-5" />;
      case 'schedule': return <Settings className="h-5 w-5" />;
      case 'advanced': return <Settings className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'text-blue-600 bg-blue-100';
      case 'academic': return 'text-green-600 bg-green-100';
      case 'system': return 'text-purple-600 bg-purple-100';
      case 'auth': return 'text-red-600 bg-red-100';
      case 'notifications': return 'text-yellow-600 bg-yellow-100';
      case 'gamification': return 'text-pink-600 bg-pink-100';
      case 'security': return 'text-gray-600 bg-gray-100';
      case 'classes': return 'text-orange-600 bg-orange-100';
      case 'schedule': return 'text-indigo-600 bg-indigo-100';
      case 'advanced': return 'text-purple-600 bg-purple-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  // Filter settings to only show the ones that make sense
  const relevantSettings = settings.filter(setting => 
    ['maintenance_mode', 'registration_enabled', 'notification_settings', 'max_subjects_limit', 'max_tasks_limit', 'max_class_memberships', 'max_class_leadership', 'max_time_slots', 'max_semester_duration', 'include_sunday_schedule'].includes(setting.setting_key)
  );

  // Add gamification settings for the gamification category
  const gamificationSettingsFromSystem = settings.filter(setting => 
    ['achievement_multiplier'].includes(setting.setting_key)
  );

  // Add security category manually if it doesn't exist
  const settingsByCategory = relevantSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  // Ensure security category exists even if empty
  if (!settingsByCategory['security']) {
    settingsByCategory['security'] = [];
  }

  // Add gamification category with its settings
  if (!settingsByCategory['gamification']) {
    settingsByCategory['gamification'] = [];
  }
  settingsByCategory['gamification'].push(...gamificationSettingsFromSystem);

  const categories = Object.keys(settingsByCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Carregando configurações do sistema...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Nenhuma configuração encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema FALTURA
          </p>
        </div>
        <Button onClick={loadSettings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'ghost'}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full justify-start transition-all duration-200 ${
                    activeCategory === category 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mr-3 ${getCategoryColor(category)}`}>
                    {getCategoryIcon(category)}
                  </div>
                  <span className="capitalize font-medium">{category}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeCategory && settingsByCategory[activeCategory] && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(activeCategory)}`}>
                    {getCategoryIcon(activeCategory)}
                  </div>
                  <div>
                    <CardTitle className="capitalize text-xl">{activeCategory}</CardTitle>
                    <CardDescription>
                      Configure as opções da categoria {activeCategory}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {settingsByCategory[activeCategory].map((setting, index) => (
                  <div key={setting.id}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg capitalize">
                              {setting.setting_key.replace(/_/g, ' ')}
                            </h3>
                            {saving === setting.id && (
                              <div className="flex items-center space-x-2 text-primary">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Salvando...</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground">{setting.description}</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 rounded-xl p-6">
                        {renderSettingInput(setting)}
                      </div>
                    </div>
                    
                    {index < settingsByCategory[activeCategory].length - 1 && (
                      <Separator className="my-8" />
                    )}
                  </div>
                ))}

                {/* Adicionar configurações especiais por categoria */}
                {activeCategory === 'auth' && (
                  <>
                    <Separator className="my-8" />
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg">Verificação de Email</h3>
                            {saving === 'email_verification_required' && (
                              <div className="flex items-center space-x-2 text-primary">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Salvando...</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground">Configure se novos usuários precisam verificar o email antes de usar a plataforma</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Verificação de Email Obrigatória</Label>
                            <div className="text-sm text-muted-foreground">
                              Quando ativado, novos usuários precisam confirmar o email
                            </div>
                          </div>
                          <Switch
                            checked={advancedSettings.email_verification_required?.enabled && advancedSettings.email_verification_required?.value}
                            onCheckedChange={(checked) => {
                              updateAdvancedSetting('email_verification_required', {
                                enabled: true,
                                value: checked
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeCategory === 'security' && (
                  <>
                    <Separator className="my-8" />
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg">Limites de Rate</h3>
                            </div>
                            <p className="text-muted-foreground">Configure limites para prevenir abuso do sistema</p>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-xl p-6 space-y-6">
                          {[
                            {
                              key: 'rate_limit_login_attempts',
                              title: 'Tentativas de Login',
                              description: 'Limite de tentativas de login por usuário',
                              defaultLimit: 6,
                              defaultWindow: 60
                            },
                            {
                              key: 'rate_limit_account_creation',
                              title: 'Criação de Contas',
                              description: 'Limite de contas criadas por IP por dia',
                              defaultLimit: 3,
                              defaultWindow: 1440
                            },
                            {
                              key: 'rate_limit_import_grade',
                              title: 'Importar Grade',
                              description: 'Limite de importações de grade por usuário por dia',
                              defaultLimit: 2,
                              defaultWindow: 1440
                            },
                            {
                              key: 'rate_limit_profile_edit',
                              title: 'Editar Perfil',
                              description: 'Limite de edições de perfil por usuário por dia',
                              defaultLimit: 4,
                              defaultWindow: 1440
                            }
                          ].map((limit) => {
                            const currentSetting = advancedSettings[limit.key] || { enabled: true, limit: limit.defaultLimit, window_minutes: limit.defaultWindow };
                            
                            return (
                              <div key={limit.key} className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{limit.title}</h4>
                                    <p className="text-sm text-muted-foreground">{limit.description}</p>
                                  </div>
                                  <Switch
                                    checked={currentSetting.enabled}
                                    onCheckedChange={(checked) => {
                                      updateAdvancedSetting(limit.key, {
                                        ...currentSetting,
                                        enabled: checked
                                      });
                                    }}
                                  />
                                </div>
                                {currentSetting.enabled && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`${limit.key}_limit`}>Limite máximo</Label>
                                      <Input
                                        id={`${limit.key}_limit`}
                                        type="number"
                                        value={currentSetting.limit}
                                        onChange={(e) => {
                                          updateAdvancedSetting(limit.key, {
                                            ...currentSetting,
                                            limit: parseInt(e.target.value)
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`${limit.key}_window`}>Janela (minutos)</Label>
                                      <Input
                                        id={`${limit.key}_window`}
                                        type="number"
                                        value={currentSetting.window_minutes}
                                        onChange={(e) => {
                                          updateAdvancedSetting(limit.key, {
                                            ...currentSetting,
                                            window_minutes: parseInt(e.target.value)
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeCategory === 'gamification' && (
                  <>
                    <Separator className="my-8" />
                    <div className="space-y-6">
                      {/* Configurações de Experiência (XP) */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg">Configurações de Experiência (XP)</h3>
                            </div>
                            <p className="text-muted-foreground">Configure quanto XP cada ação deve conceder aos usuários</p>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-xl p-6">
                          <div className="grid gap-6">
                            {gamificationSettings.map((setting) => (
                              <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {setting.action_type === 'subject_created' && 'Criar uma matéria'}
                                    {setting.action_type === 'profile_update' && 'Atualizar perfil'}
                                    {setting.action_type === 'new_semester' && 'Novo semestre'}
                                    {setting.action_type === 'schedule_slot' && 'Configurar horário'}
                                    {setting.action_type === 'grade_import' && 'Importar grade'}
                                    {setting.action_type === 'absence_registration' && 'Registrar falta'}
                                    {setting.action_type === 'note_creation' && 'Criar tarefa'}
                                    {setting.action_type === 'note_completion' && 'Completar tarefa'}
                                    {setting.action_type === 'achievement' && 'Conquista desbloqueada'}
                                    {setting.action_type === 'onboarding' && 'Completar onboarding'}
                                    {!['subject_created', 'profile_update', 'new_semester', 'schedule_slot', 'grade_import', 'absence_registration', 'note_creation', 'note_completion', 'achievement', 'onboarding'].includes(setting.action_type) && setting.action_type}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Ação: {setting.action_type}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Input
                                    type="number"
                                    value={setting.xp_reward}
                                    onChange={(e) => handleXpChange(setting.id, e.target.value)}
                                    onBlur={(e) => handleXpBlur(setting.id, e.target.value)}
                                    className="w-20 text-center"
                                    disabled={saving === `gamification_${setting.id}`}
                                    min="0"
                                    max="1000"
                                  />
                                  <Badge variant="secondary">XP</Badge>
                                  {saving === `gamification_${setting.id}` && (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Reset de Rankings */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg">Reset de Rankings</h3>
                              {saving === 'rankings' && (
                                <div className="flex items-center space-x-2 text-primary">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span className="text-sm">Salvando...</span>
                                </div>
                              )}
                            </div>
                            <p className="text-muted-foreground">Configure quando os rankings devem ser resetados automaticamente</p>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-xl p-6 space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Label htmlFor="reset_frequency">Frequência:</Label>
                              <Select
                                value={advancedSettings.ranking_reset_frequency?.frequency || 'manual'}
                                onValueChange={(value) => {
                                  updateAdvancedSetting('ranking_reset_frequency', {
                                    ...advancedSettings.ranking_reset_frequency,
                                    frequency: value
                                  });
                                }}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Manual</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                  <SelectItem value="quarterly">Trimestral</SelectItem>
                                  <SelectItem value="yearly">Anual</SelectItem>
                                  <SelectItem value="custom">Data Específica</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {advancedSettings.ranking_reset_frequency?.frequency === 'custom' && (
                              <div className="flex items-center gap-4">
                                <Label>Data para Reset:</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !customResetDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {customResetDate ? format(customResetDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={customResetDate}
                                      onSelect={(date) => {
                                        setCustomResetDate(date);
                                        if (date) {
                                          updateAdvancedSetting('ranking_reset_frequency', {
                                            ...advancedSettings.ranking_reset_frequency,
                                            custom_date: date.toISOString()
                                          });
                                        }
                                      }}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            {advancedSettings.ranking_reset_frequency?.last_reset && (
                              <div className="text-sm text-muted-foreground">
                                Último reset: {format(new Date(advancedSettings.ranking_reset_frequency.last_reset), "PPPp", { locale: ptBR })}
                              </div>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Resetar Todos os Rankings Agora
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Confirmar Reset de Rankings
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação irá resetar todos os níveis e XP de todos os usuários da plataforma.
                                    Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={resetAllRankings}
                                    disabled={saving === 'rankings'}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    {saving === 'rankings' ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Resetando...
                                      </>
                                    ) : (
                                      <>
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Resetar Agora
                                      </>
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSystemSettings;