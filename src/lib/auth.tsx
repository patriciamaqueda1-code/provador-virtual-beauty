import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, type Salon } from './supabase';

interface AuthState {
  user: User | null;
  salon: Salon | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSalon: () => Promise<void>;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSalon = async (uid: string) => {
    const { data } = await supabase
      .from('salons')
      .select('*')
      .eq('owner_id', uid)
      .maybeSingle();
    setSalon((data as Salon) ?? null);
  };

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) await loadSalon(u.id);
      setLoading(false);
    });

    // Mudanças de auth
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadSalon(u.id);
      else setSalon(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async ({ name, email, password, phone }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone: phone ?? '' } },
    });
    if (error) return { error: traduzErro(error.message) };

    // O trigger handle_new_user cria o salon. Recarrega.
    if (data.user) await loadSalon(data.user.id);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: traduzErro(error.message) };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/painel` },
    });
    if (error) return { error: traduzErro(error.message) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSalon(null);
  };

  const refreshSalon = async () => {
    if (user) await loadSalon(user.id);
  };

  return (
    <AuthCtx.Provider value={{ user, salon, loading, signUp, signIn, signInWithGoogle, signOut, refreshSalon }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/already registered|already exists/i.test(msg)) return 'E-mail já cadastrado. Faça login.';
  if (/password should be at least/i.test(msg)) return 'A senha precisa ter ao menos 6 caracteres.';
  if (/email.*invalid|invalid.*email/i.test(msg)) return 'E-mail inválido.';
  if (/provider is not enabled/i.test(msg)) return 'Login com Google não está ativado ainda.';
  return msg;
}
