import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { authService, clearAuthCache } from "../services/auth";

interface User {
  id: string;
  email: string;
  account_type: string;
  first_name: string;
  last_name: string;

  // Optional fields that may not always be present
  child_first_name?: string;
  child_last_name?: string;
  profile_image?: string;
  bio?: string;
  instruments?: string[];

  profile_completed?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isLoggingOut: boolean;
  login: (user: User) => void;
  logout: () => void;
  logoutAndRedirect: (redirectUrl?: string) => void;
  checkAuth: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Store the current auth check promise to prevent multiple simultaneous calls
  const authCheckPromise = React.useRef<Promise<void> | null>(null);

  const checkAuth = async () => {
    // If there's already an auth check in progress, wait for it
    if (authCheckPromise.current) {
      return authCheckPromise.current;
    }

    // If we're already in the process of checking (backup check)
    if (isCheckingAuth) {
      return;
    }

    // Create a new auth check promise
    authCheckPromise.current = (async () => {
      setIsCheckingAuth(true);

      try {
        const result = await authService.checkAuth();

        if (result.authenticated) {
          const userData = {
            id: result.user_id,
            email: result.user_email,
            account_type: result.account_type,
            first_name: result.first_name,
            last_name: result.last_name,

            ...(result.child_first_name && {
              child_first_name: result.child_first_name,
            }),
            ...(result.child_last_name && {
              child_last_name: result.child_last_name,
            }),
            ...(result.profile_image && {
              profile_image: result.profile_image,
            }),
            ...(result.bio && { bio: result.bio }),
            ...(result.instruments && { instruments: result.instruments }),

            profile_completed: result.profile_completed || false,
          };

          setIsAuthenticated(true);
          setUser(userData);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error: any) {
        // If session was cleared due to deleted user, update auth state
        if (error.sessionCleared) {
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        setLoading(false);
        setIsCheckingAuth(false);
        authCheckPromise.current = null; // Clear the promise
      }
    })();

    return authCheckPromise.current;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData: User) => {
    clearAuthCache(); // Clear cache when user logs in
    setIsAuthenticated(true);
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    clearAuthCache(); // Clear cache when user logs out
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
  };

  const logoutAndRedirect = (redirectUrl: string = "/") => {
    setIsLoggingOut(true);
    clearAuthCache(); // Clear cache when user logs out
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);

    // Use a small timeout to ensure state updates, then redirect
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 100);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...updates } : null));
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    isLoggingOut,
    login,
    logout,
    logoutAndRedirect,
    checkAuth,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
