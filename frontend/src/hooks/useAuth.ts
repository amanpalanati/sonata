import { useState, useEffect } from "react";

import { authService } from "../services/auth";

interface User {
  id: string;
  email: string;
  account_type: string;
  first_name: string;
  last_name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const checkAuth = async () => {
    try {
      const result = await authService.checkAuth();

      if (result.authenticated) {
        setAuthState({
          isAuthenticated: true,
          user: {
            id: result.user_id,
            email: result.user_email,
            account_type: result.account_type,
            first_name: result.first_name,
            last_name: result.last_name,
          },
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    } catch (error: any) {
      console.error("Auth check failed:", error);

      // If session was cleared due to deleted user, update auth state
      if (error.sessionCleared) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user,
      loading: false,
    });
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  };

  return {
    ...authState,
    checkAuth,
    login,
    logout,
  };
};
