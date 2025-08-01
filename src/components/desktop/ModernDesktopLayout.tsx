import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useClassNotifications } from '../../hooks/useClassNotifications';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useIsTeacher } from '../../hooks/useIsTeacher';
import { useNotes } from '../../contexts/NotesContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { useData } from '../../contexts/DataContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useIsMobile } from '../../hooks/use-mobile';
import { useGamification } from '../../contexts/GamificationContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Calendar, 
  BookOpen, 
  UserCheck, 
  FileText, 
  BarChart3, 
  User, 
  Trophy, 
  Users, 
  Shield,
  LogOut,
  Search,
  Bell,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  GraduationCap
} from 'lucide-react';

// Import the desktop components
import WeeklySchedule from '../WeeklySchedule';
import ModernWeeklySchedule from './ModernWeeklySchedule';
import UltraModernSubjectManager from './UltraModernSubjectManager';
import UltraModernAbsenceManager from './UltraModernAbsenceManager';
import UltraModernNotesManager from './UltraModernNotesManager';
import StatisticsManager from '../StatisticsManager';
import DesktopModernProfile from '../profile/DesktopModernProfile';
import ModernAchievementsManager from './ModernAchievementsManager';
import UltraModernClassManager from './UltraModernClassManager';
import UltraModernAdminDashboard from '../admin/UltraModernAdminDashboard';
import ModernRankingPageV2 from './ModernRankingPageV2';
import OnboardingFlow from '../OnboardingFlow';
import ModernTeacherDashboard from './ModernTeacherDashboard';
import StudentGrades from '../StudentGrades';
import UltraModernGradesManager from './UltraModernGradesManager';
import { useStudentGrades } from '../../hooks/useStudentGrades';

interface ModernDesktopLayoutProps {
  user: any;
  signOut: () => void;
}

const ModernDesktopLayout: React.FC<ModernDesktopLayoutProps> = ({ user, signOut }) => {
  const { getTodayNotes, getUpcomingNotes } = useNotes();
  const { trackSectionVisit } = useAchievements();
  const { subjects } = useData();
  const { classNotifications, markNotificationsAsRead } = useClassNotifications();
  const { isAdmin } = useIsAdmin();
  const { isTeacher } = useIsTeacher();
  const { isStudent } = useStudentGrades();
  const { shouldShowOnboarding, isLoading, markOnboardingComplete, markOnboardingSkipped } = useOnboarding();
  const isMobile = useIsMobile();
  const { awardOnboardingXP } = useGamification();

  const handleOnboardingComplete = async () => {
    await markOnboardingComplete();
    await awardOnboardingXP();
    toast.success('🎉 Tutorial concluído! Você ganhou XP de boas-vindas!');
  };

  const handleOnboardingSkip = async () => {
    await markOnboardingSkipped();
  };
  const [activeTab, setActiveTab] = useState('schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    trackSectionVisit(newTab);
    
    if (newTab === 'classes') {
      markNotificationsAsRead();
    }
  };

  const todayNotes = getTodayNotes();
  const upcomingNotes = getUpcomingNotes();
  
  const subjectsNearLimit = subjects.filter(subject => {
    const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
    return percentage >= 75;
  }).length;

  let navigationItems = [
    { id: 'schedule', label: 'Grade', icon: Calendar, color: 'from-blue-500 to-cyan-500' },
    { id: 'subjects', label: 'Matérias', icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { id: 'absences', label: 'Faltas', icon: UserCheck, color: 'from-orange-500 to-amber-500' },
    { id: 'notes', label: 'Anotações', icon: FileText, color: 'from-purple-500 to-violet-500' },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3, color: 'from-pink-500 to-rose-500' },
    { id: 'profile', label: 'Perfil', icon: User, color: 'from-indigo-500 to-blue-500' },
    { id: 'achievements', label: 'Conquistas', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
    { id: 'ranking', label: 'Ranking', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
    { id: 'classes', label: 'Turmas', icon: Users, color: 'from-green-500 to-emerald-500' },
  ];

  // Add grades tab if user is student
  if (isStudent) {
    navigationItems.splice(4, 0, {
      id: 'grades', 
      label: 'Notas', 
      icon: GraduationCap, 
      color: 'from-indigo-500 to-purple-500'
    });
  }

  if (isTeacher) {
    navigationItems.push({ 
      id: 'teacher', 
      label: 'Professor', 
      icon: GraduationCap, 
      color: 'from-teal-500 to-green-500' 
    });
  }

  if (isAdmin) {
    navigationItems.push({ 
      id: 'admin', 
      label: 'Admin', 
      icon: Shield, 
      color: 'from-red-500 to-pink-500' 
    });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        return <ModernWeeklySchedule />;
      case 'subjects':
        return <UltraModernSubjectManager />;
      case 'absences':
        return <UltraModernAbsenceManager />;
      case 'grades':
        return isStudent ? <UltraModernGradesManager /> : null;
      case 'notes':
        return <UltraModernNotesManager />;
      case 'stats':
        return <StatisticsManager />;
      case 'profile':
        return <DesktopModernProfile />;
      case 'achievements':
        return <ModernAchievementsManager />;
      case 'ranking':
        return <ModernRankingPageV2 />;
      case 'classes':
        return <UltraModernClassManager />;
      case 'teacher':
        return isTeacher ? <ModernTeacherDashboard /> : null;
      case 'admin':
        return isAdmin ? <UltraModernAdminDashboard /> : null;
      default:
        return <WeeklySchedule />;
    }
  };

  const getNotificationCount = () => {
    let count = 0;
    if (todayNotes.length > 0 || upcomingNotes.length > 0) count++;
    if (subjectsNearLimit > 0) count++;
    if (classNotifications > 0) count++;
    return count;
  };

  return (
    <>
      <div className={`min-h-screen transition-all duration-500 ${
        isDarkMode 
          ? 'dark bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}>
      {/* Ultra Modern Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-950/80 border-slate-800/50' 
          : 'bg-white/70 border-slate-200/50'
      } shadow-lg shadow-black/5`}>
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Brand and Toggle */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:scale-110 transition-transform duration-200"
              >
                {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                    <span className="text-white font-bold text-lg">F</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                
                {!sidebarCollapsed && (
                  <div>
                    <h1 className={`text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent`}>
                      Faltula
                    </h1>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Olá, {user?.user_metadata?.name || 'Usuário'}!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Center - Advanced Search */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <Input
                  type="text"
                  placeholder="Pesquisar em todas as seções..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-12 pr-4 h-10 rounded-xl transition-all duration-300 focus:scale-105 ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400 focus:bg-slate-800/80' 
                      : 'bg-white/80 border-slate-200/50 focus:bg-white shadow-sm'
                  }`}
                />
              </div>
            </div>

            {/* Right side - Actions and Status */}
            <div className="flex items-center space-x-3">
              {/* Smart Notifications */}
              <div className="flex items-center space-x-2">
                {(todayNotes.length > 0 || upcomingNotes.length > 0) && (
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 transition-all duration-300">
                    <FileText className="h-3 w-3 mr-1" />
                    {todayNotes.length > 0 ? `${todayNotes.length} hoje` : `${upcomingNotes.length} próximas`}
                  </Badge>
                )}
                {subjectsNearLimit > 0 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {subjectsNearLimit} no limite
                  </Badge>
                )}
                {classNotifications > 0 && (
                  <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800">
                    <Users className="h-3 w-3 mr-1" />
                    {classNotifications}
                  </Badge>
                )}
              </div>


              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDarkMode()}
                className="p-2 hover:scale-110 transition-all duration-200"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-600" />
                )}
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm" className="p-2 hover:scale-110 transition-transform duration-200">
                <Settings className="h-5 w-5" />
              </Button>

              {/* Logout */}
              <Button 
                variant="outline" 
                onClick={signOut} 
                size="sm"
                className={`transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600' 
                    : 'border-slate-300 hover:bg-slate-50 hover:shadow-md'
                }`}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Ultra Modern Sidebar */}
        <aside className={`${
          sidebarCollapsed ? 'w-16' : 'w-80'
        } sticky top-16 h-[calc(100vh-4rem)] transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/50 border-slate-800/50' 
            : 'bg-white/50 border-slate-200/50'
        } border-r backdrop-blur-sm overflow-hidden flex-shrink-0`}>
          <div className={`${sidebarCollapsed ? 'p-2' : 'p-6'} transition-all duration-300`}>
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full transition-all duration-300 group relative overflow-hidden ${
                      isActive 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-black/10 scale-105 hover:scale-110 [&>*]:text-white` 
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:scale-105'
                          : 'text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 hover:scale-105'
                    } ${sidebarCollapsed ? 'h-14 w-12 px-0 flex items-center justify-center' : 'h-14 px-4 justify-start text-left'}`}
                    onClick={() => handleTabChange(item.id)}
                  >
                    {sidebarCollapsed ? (
                      <div className="flex items-center justify-center w-full">
                        <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : ''} transition-all duration-300 group-hover:scale-110`} />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 w-full">
                        <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : ''} transition-all duration-300 group-hover:scale-110`} />
                        <span className="font-medium truncate">{item.label}</span>
                      </div>
                    )}
                    
                    {/* Notification indicators */}
                    {!sidebarCollapsed && (
                      <>
                        {item.id === 'notes' && (todayNotes.length > 0 || upcomingNotes.length > 0) && (
                          <Badge variant="secondary" className="ml-auto text-xs bg-white/20 text-current">
                            {todayNotes.length + upcomingNotes.length}
                          </Badge>
                        )}
                        {item.id === 'subjects' && subjectsNearLimit > 0 && (
                          <Badge variant="destructive" className="ml-auto text-xs">
                            {subjectsNearLimit}
                          </Badge>
                        )}
                        {item.id === 'classes' && classNotifications > 0 && (
                          <Badge variant="default" className="ml-auto text-xs bg-white/20 text-current">
                            {classNotifications}
                          </Badge>
                        )}
                      </>
                    )}
                    
                    {/* Hover effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  </Button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-8">
            {/* Content with enhanced styling */}
            <div className={`rounded-2xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-900/50 backdrop-blur-sm border border-slate-700/50' 
                : 'bg-white/70 backdrop-blur-sm border border-slate-200/50 shadow-xl'
            } p-6 min-h-[calc(100vh-8rem)]`}>
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>

    {/* Onboarding Flow - apenas para desktop */}
    {shouldShowOnboarding && !isLoading && !isMobile && (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    )}
    </>
  );
};

export default ModernDesktopLayout;