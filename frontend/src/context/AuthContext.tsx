'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthUser, LoginCredentials, UserRole } from '@/types';
import { PERSONAS } from '@/lib/demoFixtures';
import { loginWithApi, fetchCurrentUser, logoutApi, SEEDED_CREDENTIALS } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  switchDemoPersona: (newRole: UserRole) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'campusone_access_token';
const REFRESH_TOKEN_KEY = 'campusone_refresh_token';
const ACTIVE_ROLE_KEY = 'campusone_active_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage or seed default student session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const savedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole | null;

        if (savedToken) {
          setAccessToken(savedToken);
          setRefreshToken(savedRefresh);
          const currentUser = await fetchCurrentUser(savedToken);
          if (isMounted) {
            setUser(currentUser);
            setRole(currentUser.role);
            setIsLoading(false);
          }
          return;
        }

        // Default to student persona for immediate seamless exploration
        const defaultRole = savedRole && savedRole in PERSONAS ? savedRole : 'student';
        const creds = SEEDED_CREDENTIALS[defaultRole];
        const res = await loginWithApi(creds);

        if (isMounted) {
          setAccessToken(res.access_token);
          setRefreshToken(res.refresh_token);
          localStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
          localStorage.setItem(ACTIVE_ROLE_KEY, defaultRole);

          const currentUser = await fetchCurrentUser(res.access_token);
          setUser(currentUser);
          setRole(defaultRole);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await loginWithApi(credentials);
      setAccessToken(res.access_token);
      setRefreshToken(res.refresh_token);
      localStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);

      const currentUser = await fetchCurrentUser(res.access_token);
      setUser(currentUser);
      setRole(currentUser.role);
      localStorage.setItem(ACTIVE_ROLE_KEY, currentUser.role);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchDemoPersona = useCallback(async (newRole: UserRole) => {
    setIsLoading(true);
    try {
      const creds = SEEDED_CREDENTIALS[newRole];
      const res = await loginWithApi(creds);

      setAccessToken(res.access_token);
      setRefreshToken(res.refresh_token);
      localStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
      localStorage.setItem(ACTIVE_ROLE_KEY, newRole);

      const currentUser = await fetchCurrentUser(res.access_token);
      setUser(currentUser);
      setRole(newRole);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (refreshToken) {
      logoutApi(refreshToken);
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setRole('student');
  }, [refreshToken]);

  const hasRole = useCallback(
    (rolesToCheck: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (Array.isArray(rolesToCheck)) {
        return rolesToCheck.includes(role);
      }
      return role === rolesToCheck;
    },
    [user, role]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.permissions.includes('*')) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      role,
      accessToken,
      refreshToken,
      isAuthenticated: !!user,
      isLoading,
      login,
      switchDemoPersona,
      logout,
      hasRole,
      hasPermission,
    }),
    [
      user,
      role,
      accessToken,
      refreshToken,
      isLoading,
      login,
      switchDemoPersona,
      logout,
      hasRole,
      hasPermission,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
