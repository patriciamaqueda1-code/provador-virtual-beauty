// Tipos de domínio do SaaS (multi-tenant: Super Admin · Seller · Cliente)

export type UserRole = 'super_admin' | 'seller_owner' | 'seller_staff' | 'customer';

export type AppointmentStatus =
  | 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export interface Address {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  salon_id: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  price_month: number;
  features: string[];
  quota_limit: number;        // -1 = ilimitado
  max_professionals: number;  // -1 = ilimitado
  max_services: number;       // -1 = ilimitado
  is_active: boolean;
  sort: number;
  asaas_value: number | null;
}

export interface Professional {
  id: string;
  salon_id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  role_title: string | null;
  work_hours: Record<string, [string, string][]>; // "0".."6" -> [["09:00","18:00"]]
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  salon_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  birthdate: string | null;
  loyalty_points: number;
  notes: string | null;
  last_visit: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  salon_id: string;
  customer_id: string;
  professional_id: string | null;
  service_id: string | null;
  scheduled_at: string;
  end_at: string;
  status: AppointmentStatus;
  price: number;
  notes: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  reminded_at: string | null;
  created_at: string;
  // joins opcionais
  customer?: Pick<Customer, 'id' | 'name' | 'phone'> | null;
  service?: Pick<Service, 'id' | 'name'> | null;
  professional?: Pick<Professional, 'id' | 'name'> | null;
}

export interface FinancialTransaction {
  id: string;
  salon_id: string;
  appointment_id: string | null;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  amount: number;
  status: 'pending' | 'paid';
  occurred_at: string;
  created_at: string;
}

export interface Banner {
  id: string;
  salon_id: string | null;
  title: string | null;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminMetrics {
  salons: number;
  active: number;
  customers: number;
  appointments: number;
  mrr: number;
}
