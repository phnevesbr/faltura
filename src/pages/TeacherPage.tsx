import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsTeacher } from '@/hooks/useIsTeacher';
import TeacherDashboard from '@/components/TeacherDashboard';

const TeacherPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isTeacher, loading: teacherLoading } = useIsTeacher();

  if (authLoading || teacherLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || !isTeacher) {
    return <Navigate to="/" replace />;
  }

  return <TeacherDashboard />;
};

export default TeacherPage;