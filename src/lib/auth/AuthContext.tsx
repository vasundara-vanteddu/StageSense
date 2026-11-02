import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { AuthStatus, User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string) => Promise<User>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  currentIdentityKey: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = 'stagesense.guest.session.v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const u = await api.auth.me();
        if (!mounted) return;
        if (u) {
          setUser(u);
          setStatus('authenticated');
        } else {
          // Check guest session
          const isGuest = localStorage.getItem(GUEST_KEY);
          if (isGuest) {
            setUser({
              id: 'guest',
              email: 'guest@stagesense.local',
              display_name: 'Guest Presenter',
              created_at: new Date().toISOString(),
            });
            setStatus('guest');
          } else {
            setUser(null);
            setStatus('anonymous');
          }
        }
      } catch {
        if (!mounted) return;
        setUser(null);
        setStatus('anonymous');
      }
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    localStorage.removeItem(GUEST_KEY);
    const u = await api.auth.login(email, pass);
    setUser(u);
    setStatus('authenticated');
    return u;
  };

  const register = async (name: string, email: string, pass: string) => {
    localStorage.removeItem(GUEST_KEY);
    const u = await api.auth.register(name, email, pass);
    setUser(u);
    setStatus('authenticated');
    return u;
  };

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_KEY, 'true');
    const guestUser: User = {
      id: 'guest',
      email: 'guest@stagesense.local',
      display_name: 'Guest Presenter',
      created_at: new Date().toISOString(),
    };
    setUser(guestUser);
    setStatus('guest');
  };

  const logout = async () => {
    localStorage.removeItem(GUEST_KEY);
    await api.auth.logout();
    setUser(null);
    setStatus('anonymous');
  };

  const currentIdentityKey = user ? user.id : 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        continueAsGuest,
        logout,
        currentIdentityKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
