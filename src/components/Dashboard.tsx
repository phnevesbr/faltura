import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClassNotifications } from '../hooks/useClassNotifications';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogOut, Calendar, BookOpen, UserCheck, FileText, BarChart3, User, Trophy, Heart, Users, Shield } from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';
import WeeklySchedule from './WeeklySchedule';
import SubjectManager from './SubjectManager';
import AbsenceManager from './AbsenceManager';
import NotesManager from './NotesManager';
import StatisticsManager from './StatisticsManager';
import MobileWeeklySchedule from './mobile/MobileWeeklySchedule';
import MobileSubjectManager from './mobile/MobileSubjectManager';
import MobileAbsenceManager from './mobile/MobileAbsenceManager';
import MobileNotesManager from './mobile/MobileNotesManager';
import MobileStatisticsManager from './mobile/MobileStatisticsManager';
import { useNotes } from '../contexts/NotesContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { useIsMobile } from '../hooks/use-mobile';
import { useData } from '../contexts/DataContext';
import MobileBottomNav from './MobileBottomNav';
import ModernMobileNav from './mobile/ModernMobileNav';
import ModernMobileSchedule from './mobile/ModernMobileSchedule';
import ModernMobileHeader from './mobile/ModernMobileHeader';
import ModernMobileSubjects from './mobile/ModernMobileSubjects';
import ModernAcademicProfile from './profile/ModernAcademicProfile';
import AchievementsManager from './AchievementsManager';
import MobileAchievementsManager from './mobile/MobileAchievementsManager';
import MobileModernProfile from './mobile/MobileModernProfile';
import GamificationProfile from './GamificationProfile';
import { ClassManager } from './ClassManager';
import { ModernMobileClassManager } from './mobile/ModernMobileClassManager';
import MobileRankingLeaderboard from './mobile/MobileRankingLeaderboard';
import MobileShareGradeModal from './mobile/MobileShareGradeModal';
import MobileImportGradeModal from './mobile/MobileImportGradeModal';
import AdminDashboard from './admin/AdminDashboard';
import ModernDesktopLayout from './desktop/ModernDesktopLayout';
import ErrorBoundary from './ErrorBoundary';
import { SafeScheduleWrapper } from './mobile/SafeScheduleWrapper';
import StudentGrades from './StudentGrades';
import MobileStudentGrades from './mobile/MobileStudentGrades';
import { useStudentGrades } from '../hooks/useStudentGrades';

interface DashboardProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ initialTab, onTabChange: externalOnTabChange }) => {
  const { user, signOut, isLoading } = useAuth();
  const { getTodayNotes, getUpcomingNotes } = useNotes();
  const { trackSectionVisit } = useAchievements();
  const { subjects } = useData();
  const { classNotifications, markNotificationsAsRead } = useClassNotifications();
  const { isStudent } = useStudentGrades();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(initialTab || 'schedule');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { isAdmin } = useIsAdmin();

  // Sync with external tab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    trackSectionVisit(newTab);
    
    // Call external tab change handler if provided
    if (externalOnTabChange) {
      externalOnTabChange(newTab);
    }
    
    // Se está indo para turmas, marcar notificações como lidas
    if (newTab === 'classes') {
      markNotificationsAsRead();
    }
  };

  // Marcar a seção inicial como visitada apenas uma vez
  React.useEffect(() => {
    trackSectionVisit('schedule');
  }, []); // Removido trackSectionVisit da dependência para evitar loop infinito

  // Verificação de segurança para dados
  const todayNotes = getTodayNotes();
  const upcomingNotes = getUpcomingNotes();
  
  // Calcular matérias próximas do limite (≥75% das faltas)
  const subjectsNearLimit = subjects?.filter(subject => {
    const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
    return percentage >= 75;
  }).length || 0;

  const handleLogout = () => {
    signOut();
  };

  // Se ainda está carregando a autenticação, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário após carregar, não renderizar nada (vai para login)
  if (!user) {
    return null;
  }

  if (isMobile) {
    // Modern Mobile layout with enhanced UX
    const notifications = {
      subjects: subjectsNearLimit || 0,
      notes: (todayNotes?.length || 0) + (upcomingNotes?.length || 0),
      achievements: 0, // You can calculate this based on your achievements data
      classes: classNotifications || 0
    };

    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
          {/* Modern Mobile Header */}
          <ModernMobileHeader 
            user={user}
            activeTab={activeTab}
            notifications={notifications}
            onNotificationClick={() => {
              // Sempre vai para turmas quando clicar no ícone de notificação (Users)
              handleTabChange('classes');
            }}
            onSettingsClick={() => setActiveTab('profile')}
          />

          {/* Mobile Content */}
          <main className="px-4 py-6">
            <div className="space-y-6">
              {activeTab === 'schedule' && (
                <ErrorBoundary>
                  <SafeScheduleWrapper>
                    <ModernMobileSchedule />
                  </SafeScheduleWrapper>
                </ErrorBoundary>
              )}
              {activeTab === 'subjects' && (
                <ErrorBoundary>
                  <ModernMobileSubjects />
                </ErrorBoundary>
              )}
              {activeTab === 'absences' && (
                <ErrorBoundary>
                  <MobileAbsenceManager />
                </ErrorBoundary>
              )}
              {activeTab === 'notes' && (
                <ErrorBoundary>
                  <MobileNotesManager />
                </ErrorBoundary>
              )}
              {activeTab === 'stats' && (
                <ErrorBoundary>
                  <MobileStatisticsManager />
                </ErrorBoundary>
              )}
              {activeTab === 'profile' && (
                <ErrorBoundary>
                  <MobileModernProfile />
                </ErrorBoundary>
              )}
              {activeTab === 'achievements' && (
                <ErrorBoundary>
                  <MobileAchievementsManager />
                </ErrorBoundary>
              )}
              {activeTab === 'classes' && (
                <ErrorBoundary>
                  <ModernMobileClassManager />
                </ErrorBoundary>
              )}
              {activeTab === 'ranking' && (
                <ErrorBoundary>
                  <MobileRankingLeaderboard />
                </ErrorBoundary>
              )}
              {activeTab === 'grades' && isStudent && (
                <ErrorBoundary>
                  <MobileStudentGrades />
                </ErrorBoundary>
              )}
              {activeTab === 'admin' && isAdmin && (
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              )}
            </div>
          </main>

          {/* Modern Mobile Navigation */}
          <ModernMobileNav 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            onLogout={signOut}
            notifications={notifications}
            isStudent={isStudent}
          />
        </div>

        {/* Modals */}
        <MobileShareGradeModal 
          open={showShareModal} 
          onOpenChange={setShowShareModal} 
        />
        <MobileImportGradeModal 
          open={showImportModal} 
          onOpenChange={setShowImportModal} 
        />
      </ErrorBoundary>
    );
  }

  // Desktop layout - Modern Design
  return <ModernDesktopLayout user={user} signOut={signOut} />;
};

export default Dashboard;
