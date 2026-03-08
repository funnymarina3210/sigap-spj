import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/submission';

interface User {
  role: UserRole;
  nama: string;
  password: string;
  satker?: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  const refreshUser = useCallback(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUserState(JSON.parse(storedUser));
    } else {
      setUserState(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    
    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        refreshUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUser]);

  const setUser = useCallback((newUser: User) => {
    sessionStorage.setItem('user', JSON.stringify(newUser));
    setUserState(newUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('user');
    setUserState(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout, isAuthenticated: !!user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      refreshUser();
      setIsChecking(false);
    }
  }, [navigate, refreshUser]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
