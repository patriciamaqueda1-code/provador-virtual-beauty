import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://jneokgfjwxqojpagkrkw.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZW9rZ2Zqd3hxb2pwYWdrcmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjIxNDksImV4cCI6MjA5MTA5ODE0OX0.eQifGCm1GAU1HyI_fYfOO1K_qGbN7ihK8WKhmDmrS7Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// ─── Tipos do domínio ───────────────────────────────────────
export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string | null;
  slug: string | null;
  plan: 'free' | 'pro' | 'premium';
  subscription_status: 'trial' | 'active' | 'overdue' | 'canceled';
  quota_limit: number;        // simulações/mês
  quota_used: number;         // usadas no mês atual
  trial_ends_at: string | null;
  created_at: string;
}

export interface TryonSession {
  id: string;
  salon_id: string;
  type: 'nail' | 'hair';
  client_name: string | null;
  result_image: string;       // data URL ou URL do Storage
  before_image: string | null;
  params: Record<string, unknown>;
  created_at: string;
}
