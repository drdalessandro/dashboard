// src/features/auth/hooks/useAuth.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MedplumClient } from '@medplum/core';
import { 
  AuthState, 
  LoginCredentials, 
  User, 
  OfflineAuthOptions 
} from '../types/auth.types';
import { authService } from '../services/authService';
import { useTranslation } from 'react-i18next';

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
  error: null,
  offline: {
    isOffline: !navigator.onLine,
    offlineAuthenticated: false
  }
};

// Create the context
const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  enableOfflineAccess: (options?: OfflineAuthOptions) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}>({
  state: initialState,
  login: async () => {},
  logout: async () => {},
  enableOfflineAccess: async () => false,
  refreshToken: async () => false
});

interface AuthProviderProps {
  children: ReactNode;
  medplumClient: MedplumClient;
}

/**
 * Auth provider component that wraps the app and provides authentication state and methods
 */
export const AuthProvider = ({ children, medplumClient }: AuthProviderProps) => {
  const { i18n } = useTranslation();
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize auth service with Medplum client
  useEffect(() => {
    authService.initialize(medplumClient);
    
    // Check if we're already authenticated from previous session
    const checkAuth = async () => {
      try {
        const user = authService.getUser();
        const token = authService.getToken();
        const isOfflineMode = authService.isOfflineMode();
        
        if (user && token) {
          // Set language from user preference if available
          if (user.language && i18n.language !== user.language) {
            i18n.changeLanguage(user.language);
          }
          
          setState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false,
            error: null,
            offline: {
              isOffline: !navigator.onLine,
              offlineAuthenticated: isOfflineMode
            }
          });
        } else {
          setState({
            ...initialState,
            isLoading: false
          });
        }
      } catch (error) {
        setState({
          ...initialState,
          isLoading: false,
          error: 'Failed to restore authentication session'
        });
      }
    };
    
    checkAuth();
    
    // Monitor network status
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        offline: {
          ...prev.offline,
          isOffline: false
        }
      }));
    };
    
    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        offline: {
          ...prev.offline,
          isOffline: true
        }
      }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [medplumClient, i18n]);

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      
      const user = await authService.login(credentials);
      const token = authService.getToken();
      const isOfflineMode = authService.isOfflineMode();
      
      // Set language from user preference if available
      if (user.language && i18n.language !== user.language) {
        i18n.changeLanguage(user.language);
      }
      
      setState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false,
        error: null,
        offline: {
          isOffline: !navigator.onLine,
          offlineAuthenticated: isOfflineMode
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message || 'Login failed'
      }));
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true
      }));
      
      await authService.logout();
      
      setState({
        ...initialState,
        isLoading: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message || 'Logout failed'
      }));
    }
  };

  /**
   * Enable offline access for the current user
   */
  const enableOfflineAccess = async (options?: OfflineAuthOptions) => {
    try {
      if (!state.isAuthenticated || !state.user) {
        throw new Error('User must be logged in to enable offline access');
      }
      
      // Configure offline auth
      authService.setupOfflineAuth({
        enableBiometrics: options?.enableBiometrics || false,
        deviceIdentifier: options?.deviceIdentifier,
        offlineTokenDuration: options?.offlineTokenDuration || 30
      });
      
      // Update user with offline access flag
      const updatedUser: User = {
        ...state.user,
        offlineAccessEnabled: true
      };
      
      setState(prev => ({
        ...prev,
        user: updatedUser
      }));
      
      // Enable biometrics if requested
      if (options?.enableBiometrics) {
        await authService.enableBiometrics();
      }
      
      return true;
    } catch (error) {
      console.error('Error enabling offline access:', error);
      return false;
    }
  };

  /**
   * Refresh the authentication token
   */
  const refreshToken = async () => {
    try {
      if (!state.isAuthenticated) {
        return false;
      }
      
      const newToken = await authService.refreshToken();
      
      if (newToken) {
        setState(prev => ({
          ...prev,
          token: newToken
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      state, 
      login, 
      logout,
      enableOfflineAccess,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
