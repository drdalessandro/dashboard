import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    setAccessToken(localStorage.getItem('access_token'));
    setRefreshToken(localStorage.getItem('refresh_token'));
  }, []);

  const login = () => {
    // Login handled by LoginButton
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setRefreshToken(null);
    window.location.href = process.env.NEXT_PUBLIC_MEDPLUM_LOGOUT_URL +
      '?redirect_uri=' + encodeURIComponent(process.env.NEXT_PUBLIC_MEDPLUM_LOGOUT_REDIRECT_URL!);
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
