
import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { toast } from 'sonner';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ size = 'md', editable = true }) => {
  const { user } = useAuth();
  const { profile, uploadAvatar, updateProfile } = useProfile();
  const { trackAvatarConfig } = useAchievements();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-20 w-20',
    lg: 'h-32 w-32'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar(file);
      trackAvatarConfig(); // Rastreia a configuração do avatar para conquistas
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar: undefined });
      toast.success('Avatar removido');
    } catch (error) {
      toast.error('Erro ao remover avatar');
      console.error('Avatar removal error:', error);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    const name = profile?.name || user?.user_metadata?.name;
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative group">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={profile?.avatar} alt="Avatar" />
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
            {isUploading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={triggerFileSelect}
                  className="h-6 w-6 p-0 hover:bg-white/20"
                >
                  <Camera className="h-3 w-3 text-white" />
                </Button>
                
                {profile?.avatar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="h-6 w-6 p-0 hover:bg-white/20"
                  >
                    <X className="h-3 w-3 text-white" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AvatarUpload;
