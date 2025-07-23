import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  BookOpen, 
  UserCheck, 
  FileText, 
  BarChart3, 
  User, 
  Trophy, 
  Users,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Star,
  Zap,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  tips?: string[];
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Bem-vindo ao Faltura!",
    description: "O sistema mais avançado para gerenciar sua vida acadêmica com eficiência e estilo.",
    icon: Sparkles,
    features: [
      "Acompanhe sua grade horária em tempo real",
      "Gerencie matérias e controle de faltas",
      "Sistema de conquistas e gamificação",
      "Estatísticas detalhadas do seu desempenho"
    ],
    tips: [
      "Configure suas matérias logo no início para aproveitar ao máximo",
      "Use o sistema diariamente para ganhar mais XP e subir de nível"
    ],
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 2,
    title: "Grade Horária Inteligente",
    description: "Visualize sua semana acadêmica de forma clara e organizada.",
    icon: Calendar,
    features: [
      "Grade visual com suas matérias organizadas por horário",
      "Próxima aula destacada automaticamente",
      "Configuração personalizada de horários",
      "Integração com sistema de faltas"
    ],
    tips: [
      "Configure seus horários uma vez e o sistema cuida do resto",
      "Veja rapidamente qual é sua próxima aula"
    ],
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 3,
    title: "Gestão de Matérias",
    description: "Controle completo das suas disciplinas e limites de faltas.",
    icon: BookOpen,
    features: [
      "Adicione matérias com cores personalizadas",
      "Defina limites de faltas para cada disciplina",
      "Acompanhe carga horária semanal",
      "Alertas automáticos quando próximo do limite"
    ],
    tips: [
      "Use cores diferentes para identificar rapidamente suas matérias",
      "O sistema alerta quando você está com 75% das faltas utilizadas"
    ],
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: 4,
    title: "Controle de Faltas",
    description: "Nunca mais seja pego de surpresa com o limite de faltas.",
    icon: UserCheck,
    features: [
      "Registre faltas rapidamente",
      "Cálculo automático de percentual utilizado",
      "Alertas visuais para matérias no limite",
      "Histórico completo de ausências"
    ],
    tips: [
      "Registre suas faltas assim que souber que faltará",
      "Mantenha sempre abaixo de 75% para segurança"
    ],
    color: "from-orange-500 to-amber-500"
  },
  {
    id: 5,
    title: "Anotações & Tarefas",
    description: "Organize seus compromissos acadêmicos de forma eficiente.",
    icon: FileText,
    features: [
      "Crie tarefas com diferentes prioridades",
      "Defina datas de entrega",
      "Categorize por tipo (prova, trabalho, etc.)",
      "Sistema de notificações para prazos"
    ],
    tips: [
      "Use prioridades para focar no que é mais importante",
      "Revise suas tarefas de hoje na tela inicial"
    ],
    color: "from-purple-500 to-violet-500"
  },
  {
    id: 6,
    title: "Conquistas & Gamificação",
    description: "Torne sua jornada acadêmica mais divertida e motivadora.",
    icon: Trophy,
    features: [
      "Desbloqueie conquistas por atividades",
      "Ganhe XP por usar o sistema",
      "Suba de nível e tiers",
      "Compare-se com outros estudantes no ranking"
    ],
    tips: [
      "Quanto mais você usar o sistema, mais XP ganha",
      "Conquistas especiais para diferentes marcos acadêmicos"
    ],
    color: "from-yellow-500 to-orange-500"
  },
  {
    id: 7,
    title: "Estatísticas Detalhadas",
    description: "Dados insights sobre seu desempenho acadêmico.",
    icon: BarChart3,
    features: [
      "Gráficos de evolução das faltas",
      "Análise de produtividade",
      "Comparativos por matéria",
      "Relatórios de atividades"
    ],
    tips: [
      "Use as estatísticas para identificar padrões",
      "Dados ajudam a tomar melhores decisões acadêmicas"
    ],
    color: "from-pink-500 to-rose-500"
  },
  {
    id: 8,
    title: "Pronto para Começar!",
    description: "Agora você conhece todas as funcionalidades principais. Vamos começar sua jornada!",
    icon: Target,
    features: [
      "Comece adicionando suas matérias",
      "Configure sua grade horária",
      "Adicione suas primeiras tarefas",
      "Explore todas as funcionalidades!"
    ],
    tips: [
      "Leve alguns minutos para configurar tudo inicialmente",
      "O sistema fica mais útil quanto mais dados você adicionar"
    ],
    color: "from-green-500 to-emerald-500"
  }
];

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const { user } = useAuth();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCompleted([...completed, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCompleted(completed.filter(step => step !== currentStep - 1));
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleSkip = () => {
    onSkip();
  };

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];
  const IconComponent = step.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
                <p className="text-sm text-slate-600">
                  Passo {currentStep + 1} de {onboardingSteps.length}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Progresso</span>
              <span className="text-slate-900 font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-lg text-slate-700 mb-6">{step.description}</p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-blue-500" />
                      Funcionalidades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {step.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm text-slate-700">{feature}</span>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {step.tips && (
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Star className="h-5 w-5 mr-2 text-amber-500" />
                        Dicas Pro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {step.tips.map((tip, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Award className="h-3 w-3 text-amber-600" />
                          </div>
                          <span className="text-sm text-slate-700">{tip}</span>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Special welcome message for first step */}
              {currentStep === 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Olá, {user?.user_metadata?.name || 'Estudante'}! 👋
                  </h3>
                  <p className="text-purple-700">
                    Estamos empolgados em ter você aqui! Este tour rápido vai te mostrar 
                    como aproveitar ao máximo todas as funcionalidades do Faltura.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-primary w-8'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="text-slate-600"
            >
              Pular Tour
            </Button>

            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handlePrevious}
                className="text-slate-600"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}

            <Button
              onClick={handleNext}
              className={`bg-gradient-to-r ${step.color} text-white hover:opacity-90 transition-all duration-300`}
            >
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Começar a Usar!
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;