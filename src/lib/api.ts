import { supabase } from './supabase';
import type {
  Service, Professional, Customer, Appointment, FinancialTransaction,
  SubscriptionPlan, AdminMetrics,
} from '../types';

// ─── Formatadores ───────────────────────────────────────────
export const brl = (v: number) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─── Serviços ───────────────────────────────────────────────
export const Services = {
  list: (salonId: string) =>
    supabase.from('services').select('*').eq('salon_id', salonId).order('name')
      .then(({ data }) => (data as Service[]) ?? []),
  upsert: (row: Partial<Service> & { salon_id: string }) =>
    supabase.from('services').upsert(row).select().single(),
  remove: (id: string) => supabase.from('services').delete().eq('id', id),
};

// ─── Profissionais ──────────────────────────────────────────
export const Professionals = {
  list: (salonId: string) =>
    supabase.from('professionals').select('*').eq('salon_id', salonId).order('name')
      .then(({ data }) => (data as Professional[]) ?? []),
  upsert: (row: Partial<Professional> & { salon_id: string }) =>
    supabase.from('professionals').upsert(row).select().single(),
  remove: (id: string) => supabase.from('professionals').delete().eq('id', id),
};

// ─── Clientes ───────────────────────────────────────────────
export const Customers = {
  list: (salonId: string) =>
    supabase.from('customers').select('*').eq('salon_id', salonId).order('name')
      .then(({ data }) => (data as Customer[]) ?? []),
  upsert: (row: Partial<Customer> & { salon_id: string }) =>
    supabase.from('customers').upsert(row).select().single(),
  remove: (id: string) => supabase.from('customers').delete().eq('id', id),
};

// ─── Agendamentos ───────────────────────────────────────────
const APPT_SELECT =
  '*, customer:customers(id,name,phone), service:services(id,name), professional:professionals(id,name)';

export const Appointments = {
  listBySalon: (salonId: string, fromISO?: string) => {
    let q = supabase.from('appointments').select(APPT_SELECT).eq('salon_id', salonId);
    if (fromISO) q = q.gte('scheduled_at', fromISO);
    return q.order('scheduled_at').then(({ data }) => (data as Appointment[]) ?? []);
  },
  listForUser: () =>
    supabase.from('appointments').select(APPT_SELECT).order('scheduled_at', { ascending: false })
      .then(({ data }) => (data as Appointment[]) ?? []),
  checkIn: (id: string) => supabase.rpc('check_in_appointment', { p_appointment_id: id }),
  checkOut: (id: string, amount?: number) =>
    supabase.rpc('check_out_appointment', { p_appointment_id: id, p_amount: amount ?? null }),
  cancel: (id: string) => supabase.rpc('cancel_appointment', { p_appointment_id: id }),
  setStatus: (id: string, status: string) =>
    supabase.from('appointments').update({ status }).eq('id', id),
};

// ─── Financeiro ─────────────────────────────────────────────
export const Finance = {
  list: (salonId: string, fromISO?: string) => {
    let q = supabase.from('financial_transactions').select('*').eq('salon_id', salonId);
    if (fromISO) q = q.gte('occurred_at', fromISO);
    return q.order('occurred_at', { ascending: false })
      .then(({ data }) => (data as FinancialTransaction[]) ?? []);
  },
  add: (row: Partial<FinancialTransaction> & { salon_id: string }) =>
    supabase.from('financial_transactions').insert(row),
};

// ─── Planos ─────────────────────────────────────────────────
export const Plans = {
  listActive: () =>
    supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort')
      .then(({ data }) => (data as SubscriptionPlan[]) ?? []),
  listAll: () =>
    supabase.from('subscription_plans').select('*').order('sort')
      .then(({ data }) => (data as SubscriptionPlan[]) ?? []),
  upsert: (row: Partial<SubscriptionPlan>) =>
    supabase.from('subscription_plans').upsert(row).select().single(),
};

// ─── Super Admin ────────────────────────────────────────────
export const Admin = {
  metrics: () => supabase.rpc('admin_metrics').then(({ data }) => (data as AdminMetrics) ?? null),
  listSalons: () =>
    supabase.from('salons').select('*').order('created_at', { ascending: false })
      .then(({ data }) => data ?? []),
};

// ─── Booking público (/:slug) ───────────────────────────────
export const PublicBooking = {
  services: (slug: string) =>
    supabase.rpc('get_public_services', { p_slug: slug }).then(({ data }) => (data as Service[]) ?? []),
  professionals: (slug: string) =>
    supabase.rpc('get_public_professionals', { p_slug: slug }).then(({ data }) => (data as Professional[]) ?? []),
  slots: (salonId: string, professionalId: string, serviceId: string, date: string) =>
    supabase.rpc('get_available_slots', {
      p_salon_id: salonId, p_professional_id: professionalId, p_service_id: serviceId, p_date: date,
    }).then(({ data }) => (data as string[]) ?? []),
  book: (args: {
    slug: string; professionalId: string; serviceId: string; scheduledAt: string;
    name: string; phone: string; email?: string;
  }) =>
    supabase.rpc('public_book_appointment', {
      p_slug: args.slug, p_professional_id: args.professionalId, p_service_id: args.serviceId,
      p_scheduled_at: args.scheduledAt, p_customer_name: args.name,
      p_customer_phone: args.phone, p_customer_email: args.email ?? null,
    }),
};

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
