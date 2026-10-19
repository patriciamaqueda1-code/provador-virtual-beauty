import { createClient } from '@supabase/supabase-js';
import type { Address } from '../types';

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

// ─── Tipos do domínio (salão = tenant) ──────────────────────
export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string | null;
  slug: string | null;
  plan: 'free' | 'pro' | 'premium';
  plan_id: string | null;
  subscription_status: 'trial' | 'active' | 'overdue' | 'canceled';
  quota_limit: number;
  quota_used: number;
  trial_ends_at: string | null;
  created_at: string;
  // perfil/onboarding
  person_type: 'pf' | 'pj';
  document: string | null;
  razao_social: string | null;
  inscricao_estadual: string | null;
  birthdate: string | null;
  address: Address | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
  instagram: string | null;
  bio: string | null;
  onboarded: boolean;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
}

export interface TryonSession {
  id: string;
  salon_id: string;
  type: 'nail' | 'hair';
  client_name: string | null;
  result_image: string;
  before_image: string | null;
  params: Record<string, unknown>;
  created_at: string;
}
