// Created by Google Gemini
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import axios from 'axios';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: initializing session');
    
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('AuthProvider: getSession error', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session) syncUser(session);
      } catch (e) {
        console.error('AuthProvider: session init failed', e);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthProvider: onAuthStateChange', _event);
      setSession(session);
      setUser(session?.user ?? null);
      if (session) syncUser(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUser = async (session: Session) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/auth/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to sync user:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
