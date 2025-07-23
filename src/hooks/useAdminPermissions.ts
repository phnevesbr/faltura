import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminPermissions {
  analytics: boolean;
  system_config: boolean;
  user_management: boolean;
  class_management: boolean;
}

export const useAdminPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermissions>({
    analytics: false,
    system_config: false,
    user_management: false,
    class_management: false,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminPermissions();
  }, [user]);

  const checkAdminPermissions = async () => {
    if (!user) {
      setPermissions({
        analytics: false,
        system_config: false,
        user_management: false,
        class_management: false,
      });
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserRole('');
      setLoading(false);
      return;
    }

    try {
      // Verificar se é admin usando a função RPC
      const { data: adminStatus, error: adminError } = await supabase
        .rpc('is_admin', { user_id: user.id });

      if (adminError) {
        console.error('Error checking admin status:', adminError);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setUserRole('');
        setPermissions({
          analytics: false,
          system_config: false,
          user_management: false,
          class_management: false,
        });
        setLoading(false);
        return;
      }

      setIsAdmin(!!adminStatus);

      if (adminStatus) {
        // Se é admin, buscar as permissões específicas
        const { data: roleData, error: roleError } = await supabase
          .from('admin_roles')
          .select('permissions, role')
          .eq('user_id', user.id)
          .is('revoked_at', null)
          .single();

        if (roleError) {
          console.error('Error fetching role permissions:', roleError);
          setUserRole('');
          setIsSuperAdmin(false);
          // Se é admin mas não conseguimos pegar as permissões, dar permissões padrão
          setPermissions({
            analytics: true,
            system_config: false,
            user_management: false,
            class_management: true,
          });
        } else {
          // Verificar se é super admin
          const role = roleData.role;
          setUserRole(role);
          setIsSuperAdmin(role === 'super_admin');
          
          // Type guard para garantir que permissions é um objeto válido
          const rolePermissions = roleData.permissions as any;
          if (rolePermissions && typeof rolePermissions === 'object') {
            setPermissions({
              analytics: rolePermissions.analytics || false,
              system_config: rolePermissions.system_config || false,
              user_management: rolePermissions.user_management || false,
              class_management: rolePermissions.class_management || false,
            });
          } else {
            // Fallback para permissões padrão
            setPermissions({
              analytics: true,
              system_config: false,
              user_management: false,
              class_management: true,
            });
          }
        }
      } else {
        setIsSuperAdmin(false);
        setUserRole('');
        setPermissions({
          analytics: false,
          system_config: false,
          user_management: false,
          class_management: false,
        });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserRole('');
      setPermissions({
        analytics: false,
        system_config: false,
        user_management: false,
        class_management: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return { 
    permissions, 
    isAdmin, 
    isSuperAdmin,
    userRole,
    loading, 
    refetch: checkAdminPermissions,
    // Helper functions for specific permissions
    canViewAnalytics: permissions.analytics,
    canManageUsers: permissions.user_management,
    canManageClasses: permissions.class_management,
    canConfigureSystem: permissions.system_config,
    // Helper para staff management (apenas super admin)
    canManageStaff: isSuperAdmin,
  };
};