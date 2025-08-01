import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const EmailVerificationWarning: React.FC = () => {
  const { user, signOut } = useAuth();
  const { shouldBlockUnverifiedUsers } = useEmailVerification();
  const [resending, setResending] = React.useState(false);

  if (!user || !shouldBlockUnverifiedUsers(user)) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast.error('Erro ao reenviar email de verificação');
        console.error('Resend error:', error);
      } else {
        toast.success('Email de verificação reenviado!');
      }
    } catch (error) {
      toast.error('Erro inesperado');
      console.error('Unexpected error:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-orange-200 bg-orange-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-orange-900">Verificação de Email Necessária</CardTitle>
          <CardDescription className="text-orange-700">
            Para continuar usando a plataforma, você precisa verificar seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-orange-600">
            Enviamos um email de verificação para:
            <div className="font-semibold mt-1">{user.email}</div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full"
              variant="outline"
            >
              {resending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar Email
                </>
              )}
            </Button>
            
            <Button 
              onClick={signOut}
              variant="ghost"
              className="w-full text-orange-600 hover:text-orange-700"
            >
              Sair e Tentar Novamente
            </Button>
          </div>
          
          <div className="text-xs text-orange-600 text-center">
            Verifique também sua pasta de spam
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationWarning;