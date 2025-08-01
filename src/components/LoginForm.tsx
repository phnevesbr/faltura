import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, User, GraduationCap, AlertCircle, Sparkles, Ban, Calendar, Clock } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';
import { useRateLimit } from '../hooks/useRateLimit';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { supabase } from '@/integrations/supabase/client';

const LoginForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDetails, setBanDetails] = useState<{
    ban_type: string;
    expires_at: string | null;
    reason: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    course: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp, isLoading, user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { checkRateLimit } = useRateLimit();
  const { shouldBlockUnverifiedUsers } = useEmailVerification();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (!formData.course) {
        newErrors.course = 'Curso é obrigatório';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (isLogin) {
        // Check rate limit for login attempts
        const canProceed = await checkRateLimit('login_attempts', { userId: formData.email });
        if (!canProceed) {
          return; // Rate limit error already shown
        }

        const result = await signIn(formData.email, formData.password);
        if (result.error) {
          toast({
            title: "Erro no login",
            description: result.error,
            variant: "destructive",
          });
        } else {
          // Check if user is banned after successful login
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', formData.email)
            .single();

          if (profile) {
            const { data: banInfo } = await supabase
              .from('user_bans')
              .select('ban_type, expires_at, reason')
              .eq('user_id', profile.user_id)
              .eq('is_active', true)
              .single();

            if (banInfo) {
              // User is banned, show detailed ban information and sign out
              await supabase.auth.signOut();
              
              const isExpired = banInfo.expires_at && new Date(banInfo.expires_at) < new Date();
              if (isExpired) {
                // Ban expired, update status
                await supabase
                  .from('user_bans')
                  .update({ is_active: false })
                  .eq('user_id', profile.user_id)
                  .eq('is_active', true);
              } else {
                // Set ban details and show modal
                setBanDetails(banInfo);
                setShowBanModal(true);
                return;
              }
            }
          }

          // Check email verification if required
          if (shouldBlockUnverifiedUsers(user)) {
            toast({
              title: "Email não verificado",
              description: "Verifique sua caixa de entrada e confirme seu email antes de continuar.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao Faltula!",
          });
        }
      } else {
        // Check rate limit for account creation
        const canProceed = await checkRateLimit('account_creation', { ipAddress: '127.0.0.1' }); // Should get real IP
        if (!canProceed) {
          return; // Rate limit error already shown
        }

        const result = await signUp(formData.email, formData.password, formData.name, formData.course);
        if (result.error) {
          toast({
            title: "Erro no cadastro",
            description: result.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "✅ Conta criada com sucesso!",
            description: "📧 IMPORTANTE: Verifique sua caixa de entrada e confirme seu email antes de fazer login. Sem a confirmação você não conseguirá entrar.",
            duration: 10000,
          });
          setIsLogin(true);
          setFormData({ name: '', email: '', password: '', course: '' });
          setErrors({});
        }
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getBanDuration = () => {
    if (!banDetails) return '';
    
    if (banDetails.ban_type === 'permanent') return 'Permanente';
    
    if (banDetails.expires_at) {
      const daysLeft = Math.ceil((new Date(banDetails.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return `${daysLeft} dias`;
    }
    
    return 'Indefinido';
  };

  const formatBanType = () => {
    if (!banDetails) return '';
    return banDetails.ban_type === 'permanent' ? 'Permanente' : 'Temporário';
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col">
        {/* Mobile Header */}
        <div className="flex-1 flex flex-col">
          {/* Hero Section */}
          <div className="px-6 pt-16 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6 animate-float">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center auth-glow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 animate-fade-in">
              Faltula
            </h1>
            <p className="text-muted-foreground text-base animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Controle acadêmico inteligente
            </p>
          </div>

          {/* Form Card */}
          <div className="flex-1 px-4 pb-6">
            <Card className="border-0 auth-shadow animate-scale-in bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold">
                  {isLogin ? 'Bem-vindo!' : 'Criar conta'}
                </CardTitle>
                <CardDescription className="text-base">
                  {isLogin 
                    ? 'Entre para continuar sua jornada' 
                    : 'Comece hoje a controlar suas faltas'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                          Nome completo
                        </Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className={`pl-12 h-14 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base ${
                              errors.name ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                            }`}
                            placeholder="Seu nome completo"
                          />
                        </div>
                        {errors.name && (
                          <div className="flex items-center text-destructive text-sm">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{errors.name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="course" className="text-sm font-semibold text-foreground">
                          Curso
                        </Label>
                        <div className="relative group">
                          <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                          <Input
                            id="course"
                            name="course"
                            type="text"
                            value={formData.course}
                            onChange={handleChange}
                            className={`pl-12 h-14 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base ${
                              errors.course ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                            }`}
                            placeholder="Seu curso"
                          />
                        </div>
                        {errors.course && (
                          <div className="flex items-center text-destructive text-sm">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{errors.course}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                      Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-12 h-14 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base ${
                          errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                        }`}
                        placeholder="seu@email.com"
                      />
                    </div>
                    {errors.email && (
                      <div className="flex items-center text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                      Senha
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        className={`pl-12 pr-12 h-14 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base ${
                          errors.password ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                        }`}
                        placeholder="Sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="flex items-center text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{errors.password}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 auth-gradient text-primary-foreground font-semibold rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        <span>Carregando...</span>
                      </div>
                    ) : isLogin ? (
                      <>
                        <LogIn className="mr-3 h-5 w-5" />
                        Entrar
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-3 h-5 w-5" />
                        Criar conta
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="text-center pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                      setFormData({ name: '', email: '', password: '', course: '' });
                    }}
                    className="text-base text-muted-foreground hover:text-primary transition-colors h-12"
                  >
                    {isLogin ? (
                      <>
                        Não tem uma conta? <span className="text-primary font-semibold ml-1">Cadastre-se</span>
                      </>
                    ) : (
                      <>
                        Já tem uma conta? <span className="text-primary font-semibold ml-1">Entre aqui</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ban Modal */}
        <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-destructive">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Ban className="h-6 w-6 text-destructive" />
                </div>
                <span>Conta Banida</span>
              </DialogTitle>
              <DialogDescription>
                Sua conta foi suspensa temporariamente. Veja os detalhes abaixo:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Ban className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Tipo de Banimento</p>
                    <p className="text-sm text-muted-foreground">{formatBanType()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duração</p>
                    <p className="text-sm text-muted-foreground">{getBanDuration()}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Motivo do Banimento</p>
                  <p className="text-sm text-muted-foreground">{banDetails?.reason}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => setShowBanModal(false)}
                className="w-full"
              >
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Version
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 animate-fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center auth-glow animate-float">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-5xl font-bold text-foreground">Faltula</h1>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-foreground leading-tight">
                Controle acadêmico <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  inteligente
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Gerencie suas faltas, organize seus estudos e acompanhe seu progresso acadêmico de forma simples e eficiente.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <User className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Perfil Personalizado</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Múltiplos Cursos</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Sistema Gamificado</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="border-0 auth-shadow animate-scale-in bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center space-y-3 pb-8">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? 'Bem-vindo de volta!' : 'Criar nova conta'}
              </CardTitle>
              <CardDescription className="text-base">
                {isLogin 
                  ? 'Entre para acessar seu painel de controle' 
                  : 'Junte-se a milhares de estudantes organizados'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                        Nome completo
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          className={`pl-11 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg ${
                            errors.name ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                          }`}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      {errors.name && (
                        <div className="flex items-center text-destructive text-sm">
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>{errors.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="course" className="text-sm font-semibold text-foreground">
                        Curso
                      </Label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                        <Input
                          id="course"
                          name="course"
                          type="text"
                          value={formData.course}
                          onChange={handleChange}
                          className={`pl-11 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg ${
                            errors.course ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                          }`}
                          placeholder="Seu curso"
                        />
                      </div>
                      {errors.course && (
                        <div className="flex items-center text-destructive text-sm">
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>{errors.course}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-11 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg ${
                        errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                      }`}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Senha
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-11 pr-11 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg ${
                        errors.password ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                      }`}
                      placeholder="Sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 auth-gradient text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      <span>Carregando...</span>
                    </div>
                  ) : isLogin ? (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Entrar
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Criar conta
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setFormData({ name: '', email: '', password: '', course: '' });
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? (
                    <>
                      Não tem uma conta? <span className="text-primary font-semibold">Cadastre-se</span>
                    </>
                  ) : (
                    <>
                      Já tem uma conta? <span className="text-primary font-semibold">Entre aqui</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ban Modal - Desktop */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-destructive">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <Ban className="h-6 w-6 text-destructive" />
              </div>
              <span>Conta Banida</span>
            </DialogTitle>
            <DialogDescription>
              Sua conta foi suspensa. Veja os detalhes abaixo:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Ban className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tipo de Banimento</p>
                  <p className="text-sm text-muted-foreground">{formatBanType()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duração</p>
                  <p className="text-sm text-muted-foreground">{getBanDuration()}</p>
                </div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Motivo do Banimento</p>
                <p className="text-sm text-muted-foreground">{banDetails?.reason}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowBanModal(false)}
              className="w-full"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginForm;