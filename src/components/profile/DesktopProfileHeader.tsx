import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Edit, 
  Crown, 
  Star, 
  Zap,
  Calendar,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useProfile } from '../../contexts/ProfileContext';
import AvatarUpload from '../AvatarUpload';
import { cn } from '../../lib/utils';

interface DesktopProfileHeaderProps {
  profile: any;
  isEditing: boolean;
  onEditToggle: () => void;
  onSettingsClick: () => void;
}

const DesktopProfileHeader: React.FC<DesktopProfileHeaderProps> = ({
  profile,
  isEditing,
  onEditToggle,
  onSettingsClick
}) => {
  const { user } = useAuth();
  const { userLevel, getTierInfo } = useGamification();
  const { profile: userProfile } = useProfile();
  
  const tierInfo = userLevel ? getTierInfo(userLevel.current_tier) : getTierInfo('calouro');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ position: 'relative', zIndex: 'auto' }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-background via-background/50 to-primary/5 border-0 shadow-2xl relative">
        <CardContent className="p-0 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent opacity-50 pointer-events-none" />
          
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                {/* Avatar com nível */}
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    <AvatarUpload size="lg" />
                  </motion.div>
                  
                  {userLevel && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className={cn(
                        "absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-4 border-background shadow-lg",
                        tierInfo.color
                      )}
                      style={{ position: 'absolute', zIndex: 2 }}
                    >
                      {userLevel.level}
                    </motion.div>
                  )}
                </div>

                {/* Informações do usuário */}
                <div className="space-y-2">
                  <motion.h1 
                    className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {userProfile?.name || profile?.name || user?.user_metadata?.name || 'Usuário'}
                  </motion.h1>
                  
                  <motion.p 
                    className="text-muted-foreground text-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {user?.email}
                  </motion.p>

                  {/* Badges do usuário */}
                  <motion.div 
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {userLevel && (
                      <Badge variant="secondary" className="gap-2 px-3 py-1">
                        <span className="text-lg">{tierInfo.emoji}</span>
                        <span className="font-semibold">{tierInfo.name}</span>
                      </Badge>
                    )}
                    
                    {profile?.course && (
                      <Badge variant="outline" className="gap-2 px-3 py-1">
                        <GraduationCap className="h-4 w-4" />
                        {profile.course}
                      </Badge>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Actions */}
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={onSettingsClick}
                  variant="outline"
                  size="lg"
                  className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background"
                >
                  <Settings className="h-5 w-5" />
                  Configurações
                </Button>
                
                <Button
                  onClick={onEditToggle}
                  size="lg"
                  className={cn(
                    "gap-2 transition-all duration-300",
                    isEditing 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  <Edit className="h-5 w-5" />
                  {isEditing ? 'Salvar Perfil' : 'Editar Perfil'}
                </Button>
              </motion.div>
            </div>

            {/* Estatísticas em linha */}
            {userLevel && (
              <motion.div 
                className="grid grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-center mb-2">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userLevel.level}
                  </div>
                  <div className="text-sm text-muted-foreground">Nível</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600 mb-1">
                    {userLevel.experience_points.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">XP Atual</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {userLevel.level_progress.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Progresso</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {profile?.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Dias no app</div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DesktopProfileHeader;