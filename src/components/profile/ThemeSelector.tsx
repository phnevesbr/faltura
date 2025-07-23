import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Palette, Lock, Check } from 'lucide-react';
import { useGamification } from '../../contexts/GamificationContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAchievements } from '../../contexts/AchievementsContext';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'sonner';

const ThemeSelector: React.FC = () => {
  const { userLevel } = useGamification();
  const { applyTheme, getCurrentTheme } = useThemeColors();
  const { trackThemeChange } = useAchievements();
  const { shouldShowNotification } = useNotifications();
  const [selectedTheme, setSelectedTheme] = useState('default');
  const level = userLevel?.level || 1;

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
  }, [getCurrentTheme]);

  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);
    applyTheme(themeName);
    trackThemeChange();
    if (shouldShowNotification('profile')) {
      toast.success(`🎨 ${themeName} aplicado com sucesso!`);
    }
  };

  const getUnlockedThemes = () => {
    const themes = [
      { name: 'Padrão', icon: '🌟', level: 1, themeKey: 'default' }
    ];
    
    // Temas desbloqueados baseados no nível
    if (level >= 5) themes.push({ name: 'Oceano', icon: '🌊', level: 5, themeKey: 'Tema Oceano' });
    if (level >= 10) themes.push({ name: 'Floresta', icon: '🌲', level: 10, themeKey: 'Tema Floresta' });
    if (level >= 15) themes.push({ name: 'Sunset', icon: '🌅', level: 15, themeKey: 'Tema Sunset' });
    if (level >= 25) themes.push({ name: 'Cristal', icon: '💎', level: 25, themeKey: 'Tema Cristal' });
    if (level >= 30) themes.push({ name: 'Neon', icon: '⚡', level: 30, themeKey: 'Tema Neon' });
    if (level >= 40) themes.push({ name: 'Vulcão', icon: '🌋', level: 40, themeKey: 'Tema Vulcão' });
    if (level >= 50) themes.push({ name: 'Lendário', icon: '👑', level: 50, themeKey: 'Tema Lendário' });

    return themes;
  };

  const getLockedThemes = () => {
    const themes = [];
    
    // Temas bloqueados
    if (level < 5) themes.push({ name: 'Oceano', icon: '🌊', level: 5, themeKey: 'Tema Oceano' });
    if (level < 10) themes.push({ name: 'Floresta', icon: '🌲', level: 10, themeKey: 'Tema Floresta' });
    if (level < 15) themes.push({ name: 'Sunset', icon: '🌅', level: 15, themeKey: 'Tema Sunset' });
    if (level < 25) themes.push({ name: 'Cristal', icon: '💎', level: 25, themeKey: 'Tema Cristal' });
    if (level < 30) themes.push({ name: 'Neon', icon: '⚡', level: 30, themeKey: 'Tema Neon' });
    if (level < 40) themes.push({ name: 'Vulcão', icon: '🌋', level: 40, themeKey: 'Tema Vulcão' });
    if (level < 50) themes.push({ name: 'Lendário', icon: '👑', level: 50, themeKey: 'Tema Lendário' });

    return themes;
  };

  const unlockedThemes = getUnlockedThemes();
  const lockedThemes = getLockedThemes();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Temas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Temas Desbloqueados */}
          {unlockedThemes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Disponíveis</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {unlockedThemes.map((themeItem) => (
                  <div
                    key={themeItem.name}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors relative ${
                      selectedTheme === themeItem.themeKey ? 'ring-2 ring-primary bg-accent/50' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleThemeChange(themeItem.themeKey)}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl">{themeItem.icon}</div>
                      <div className="text-xs font-medium">{themeItem.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        Nv. {themeItem.level}
                      </Badge>
                      {selectedTheme === themeItem.themeKey && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Temas Bloqueados */}
          {lockedThemes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Bloqueados</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lockedThemes.map((themeItem) => (
                  <div
                    key={themeItem.name}
                    className="p-3 border rounded-lg opacity-50 relative"
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl grayscale">{themeItem.icon}</div>
                      <div className="text-xs font-medium">{themeItem.name}</div>
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Nv. {themeItem.level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unlockedThemes.length === 0 && lockedThemes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Continue jogando para desbloquear novos temas!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;