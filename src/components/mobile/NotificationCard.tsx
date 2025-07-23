import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  MessageSquare, 
  Trash2, 
  Upload, 
  X, 
  Image, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCardProps {
  notification: any;
  currentUserId: string;
  isLeader: boolean;
  selectedNotification: string | null;
  contentText: string;
  selectedFiles: File[];
  isUploading: boolean;
  onSelectNotification: (id: string) => void;
  onContentChange: (content: string) => void;
  onFileChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onSendContent: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onCancel: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  currentUserId,
  isLeader,
  selectedNotification,
  contentText,
  selectedFiles,
  isUploading,
  onSelectNotification,
  onContentChange,
  onFileChange,
  onRemoveFile,
  onSendContent,
  onDeleteNotification,
  onCancel
}) => {
  const getInitials = (email: string) => {
    return email?.split('@')[0]?.substring(0, 2)?.toUpperCase() || 'U';
  };

  const getUserName = () => {
    return notification.user_id === currentUserId 
      ? 'Você' 
      : (notification.profiles?.email?.split('@')[0] || 'Usuário');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFileChange(files);
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-red-400 shadow-lg bg-gradient-to-br from-white to-red-50/30">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header da notificação */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12 ring-2 ring-red-100">
                <AvatarFallback className="bg-gradient-to-br from-red-100 to-red-200 text-red-700 font-semibold">
                  {getInitials(notification.profiles?.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {getUserName()}
                  </h4>
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Faltou
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(notification.absence_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{notification.subjects.length} matéria{notification.subjects.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Matérias afetadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {notification.subjects.map((subject: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 ml-3">
              {!notification.content_sent && notification.user_id !== currentUserId && (
                <Button
                  size="sm"
                  onClick={() => onSelectNotification(notification.id)}
                  disabled={selectedNotification === notification.id}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
              )}
              {isLeader && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteNotification(notification.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Conteúdo enviado */}
          {notification.content_sent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Conteúdo enviado</span>
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                  Completo
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Descrição:</p>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                    {notification.content_text}
                  </p>
                </div>
                
                {notification.content_photos && notification.content_photos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {notification.content_photos.length} foto{notification.content_photos.length !== 1 ? 's' : ''} anexada{notification.content_photos.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {notification.content_photos.map((photoUrl: string, index: number) => (
                        <img
                          key={index}
                          src={photoUrl}
                          alt={`Conteúdo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          loading="lazy"
                          onClick={() => {
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
                            modal.innerHTML = `
                              <div class="relative max-w-4xl max-h-full">
                                <img src="${photoUrl}" class="max-w-full max-h-full object-contain rounded-lg" />
                                <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors text-xl">
                                  ×
                                </button>
                              </div>
                            `;
                            modal.onclick = (e) => {
                              if (e.target === modal || (e.target as HTMLElement).tagName === 'BUTTON') {
                                document.body.removeChild(modal);
                              }
                            };
                            document.body.appendChild(modal);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form de envio */}
          {selectedNotification === notification.id && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Enviar conteúdo do dia</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`content-${notification.id}`} className="text-sm font-medium text-gray-700">
                    Descrição do conteúdo
                  </Label>
                  <Textarea
                    id={`content-${notification.id}`}
                    value={contentText}
                    onChange={(e) => onContentChange(e.target.value)}
                    placeholder="Descreva o conteúdo das aulas que foram perdidas..."
                    rows={3}
                    className="mt-1 bg-white"
                  />
                </div>
                
                {/* Upload de arquivos */}
                <div className="space-y-3">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id={`file-upload-${notification.id}`}
                      onChange={handleFileInputChange}
                    />
                    <Label 
                      htmlFor={`file-upload-${notification.id}`}
                      className="cursor-pointer bg-white border-2 border-dashed border-blue-300 hover:border-blue-400 text-blue-600 hover:text-blue-700 h-12 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center whitespace-nowrap transition-colors w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Anexar Fotos ({selectedFiles.length}/5)
                    </Label>
                  </div>
                  
                  {/* Preview das imagens */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRemoveFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => onSendContent(notification.id)}
                    disabled={!contentText.trim() || isUploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? 'Enviando...' : 'Enviar Conteúdo'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};