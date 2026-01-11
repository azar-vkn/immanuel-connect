import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@immanuelag.com': {
    password: 'admin123',
    user: { id: '1', email: 'admin@immanuelag.com', name: 'Admin User', role: 'admin' }
  },
  'marker@immanuelag.com': {
    password: 'marker123',
    user: { id: '2', email: 'marker@immanuelag.com', name: 'Marker User', role: 'marker' }
  },
  'leader@immanuelag.com': {
    password: 'leader123',
    user: { id: '3', email: 'leader@immanuelag.com', name: 'Area Leader', role: 'area_leader' }
  }
};

// Role-based permissions
const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'dashboard.view',
    'members.view', 'members.create', 'members.edit', 'members.delete', 'members.export',
    'families.view', 'families.edit', 'families.delete',
    'events.view', 'events.create', 'events.edit',
    'attendance.view', 'attendance.mark',
    'reports.view', 'reports.export',
    'followup.view', 'followup.edit',
    'teams.manage' // Admin can manage teams
  ],
  marker: [
    'dashboard.view',
    'members.view',
    'families.view',
    'events.view', 'events.create', 'events.edit',
    'attendance.view', 'attendance.mark',
    'reports.view', 'reports.export'
  ],
  area_leader: [
    'dashboard.view',
    'families.view',
    'followup.view', 'followup.edit'
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('iag_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const mockUser = mockUsers[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem('iag_user', JSON.stringify(mockUser.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('iag_user');
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
