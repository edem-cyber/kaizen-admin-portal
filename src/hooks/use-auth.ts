import { useAuthStore } from '@/stores/auth-store';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    setAuth,
    setUser,
    logout,
    setLoading,
    devLoginAs,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    setAuth,
    setUser,
    logout,
    setLoading,
    devLoginAs,
  };
}

