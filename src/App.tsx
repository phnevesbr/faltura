/**
 * Faltula - Sistema de Gestão Acadêmica
 * Desenvolvido Por PHNevs
 * Instagram: https://www.instagram.com/phnevs/
 * 
 * Componente principal da aplicação que configura:
 * - Roteamento da aplicação
 * - Contextos globais (Auth, Dados, Perfil, etc.)
 * - Providers de terceiros (QueryClient, Tooltip)
 * - Sistema de notificações (Toast)
 * - Boundary de erro para captura de exceções
 */

import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { NotesProvider } from "./contexts/NotesContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { AchievementsProvider } from "./contexts/AchievementsContext";
import { GamificationProvider } from "./contexts/GamificationContext";
import { ScheduleConfigProvider } from "./contexts/ScheduleConfigContext";
import { GesturesProvider } from "./contexts/GesturesContext";
import { ClassProvider } from "./contexts/ClassContext";
import { useThemeColors } from "./hooks/useThemeColors";
import ErrorBoundary from "./components/ErrorBoundary";

import Index from "./pages/Index";
import RankingPage from "./pages/RankingPage";
import AdminPage from "./pages/AdminPage";
import TeacherPage from "./pages/TeacherPage";
import NotFound from "./pages/NotFound";
import LoginForm from "./components/LoginForm";
import AchievementTracker from "./components/AchievementTracker";
import { UndoToast } from "./components/UndoToast";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, isLoading } = useAuth();

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

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ErrorBoundary>
      <GesturesProvider>
        <GamificationProvider>
          <DataProvider>
            <ProfileProvider>
              <AchievementsProvider>
                <NotesProvider>
                  <ScheduleConfigProvider>
                    <ClassProvider>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/ranking" element={<RankingPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/professor" element={<TeacherPage />} />
                        <Route path="/404" element={<NotFound />} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                      </Routes>
                      <AchievementTracker />
                      <UndoToast />
                    </ClassProvider>
                  </ScheduleConfigProvider>
                </NotesProvider>
              </AchievementsProvider>
            </ProfileProvider>
          </DataProvider>
        </GamificationProvider>
      </GesturesProvider>
    </ErrorBoundary>
  );
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useThemeColors();
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster duration={3000} />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;