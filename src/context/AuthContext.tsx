import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanPassword = password.trim();

      console.log('=== SUPABASE AUTH DEBUG ===');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Expected project ID: qgzersovjtqseaylexgl');
      console.log('Project ID matches:', import.meta.env.VITE_SUPABASE_URL?.includes('qgzersovjtqseaylexgl'));
      console.log('Attempting login with email:', cleanEmail);
      console.log('Email length:', cleanEmail.length);
      console.log('Password length:', cleanPassword.length);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      console.log('Login response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('Login error:', error);
        return { error };
      }

      setSession(data.session);
      setUser(data.user);
      console.log('Login successful, user:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('Login exception:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
