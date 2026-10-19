import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, type Salon } from './supabase';
import type { Profile, UserRole } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  salon: Salon | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signUpCustomer: (data: CustomerSignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (redirect?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSalon: () => Promise<void>;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  slug?: string;
}

interface CustomerSignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  salonId: string;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  const loadContext = async (uid: string) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    const p = (prof as Profile) ?? null;
    setProfile(p);

    // Salão: por salon_id do perfil (seller/staff) ou por owner_id (fallback)
    const salonId = p?.salon_id;
    let salonData: Salon | null = null;
    if (salonId) {
      const { data } = await supabase.from('salons').select('*').eq('id', salonId).maybeSingle();
      salonData = (data as Salon) ?? null;
    }
    if (!salonData) {
      const { data } = await supabase.from('salons').select('*').eq('owner_id', uid).maybeSingle();
      salonData = (data as Salon) ?? null;
    }
    setSalon(salonData);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) await loadContext(u.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadContext(u.id);
      else { setProfile(null); setSalon(null); }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async ({ name, email, password, phone, slug }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone: phone ?? '', slug: slug ?? '', role: 'seller_owner' } },
    });
    if (error) return { error: traduzErro(error.message) };
    if (data.user) await loadContext(data.user.id);
    return { error: null };
  };

  const signUpCustomer = async ({ name, email, password, phone, salonId }: CustomerSignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, role: 'customer', salon_id: salonId } },
    });
    if (error) return { error: traduzErro(error.message) };
    if (data.user) await loadContext(data.user.id);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: traduzErro(error.message) };
    return { error: null };
  };

  const signInWithGoogle = async (redirect = '/painel') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirect}` },
    });
    if (error) return { error: traduzErro(error.message) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSalon(null);
  };

  const refreshSalon = async () => {
    if (user) await loadContext(user.id);
  };

  return (
    <AuthCtx.Provider
      value={{
        user, profile, salon, role: profile?.role ?? null, loading,
        signUp, signUpCustomer, signIn, signInWithGoogle, signOut, refreshSalon,
      }}
    >
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
