-- ============================================================
-- Provador Virtual Beauty — Schema SaaS completo (Etapa 1)
-- Multi-tenant: Super Admin · Seller (salão) · Cliente final
-- Aplicar em: jneokgfjwxqojpagkrkw.supabase.co (SQL Editor)
-- Idempotente — pode rodar mais de uma vez. Roda DEPOIS do schema.sql.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 0. Planos de assinatura (gerenciados pelo Super Admin) ──
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,          -- free | pro | premium
  name              TEXT NOT NULL,
  price_month       NUMERIC(10,2) NOT NULL DEFAULT 0,
  features          JSONB NOT NULL DEFAULT '[]'::jsonb,
  quota_limit       INT NOT NULL DEFAULT 10,       -- simulações IA/mês (-1 = ilimitado)
  max_professionals INT NOT NULL DEFAULT 1,
  max_services      INT NOT NULL DEFAULT 5,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort              INT NOT NULL DEFAULT 0,
  asaas_value       NUMERIC(10,2),                 -- valor cobrado no Asaas
  created_at        TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.subscription_plans (slug, name, price_month, quota_limit, max_professionals, max_services, sort, features)
VALUES
  ('free',    'Grátis',  0,     10, 1,  5,  0, '["10 simulações IA/mês","Agenda online","Link personalizado","1 profissional"]'::jsonb),
  ('pro',     'Pro',     39.90, -1, 5,  50, 1, '["Simulações IA ilimitadas","Agenda + lembretes","Até 5 profissionais","Financeiro e relatórios","Programa de fidelidade"]'::jsonb),
  ('premium', 'Premium', 79.90, -1, 50, -1, 2, '["Tudo do Pro","Profissionais ilimitados","Personalização total da página","Banners e marca própria","Suporte prioritário"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ── 1. Extensões da tabela salons (tenant / seller) ─────────
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS person_type        TEXT DEFAULT 'pf';   -- pf | pj
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS document           TEXT;                -- CPF ou CNPJ
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS razao_social       TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS birthdate          DATE;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS address            JSONB DEFAULT '{}'::jsonb; -- {cep,street,number,complement,district,city,state}
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS logo_url           TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS cover_url          TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS primary_color      TEXT DEFAULT '#db2777';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS instagram          TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS bio                TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS onboarded          BOOLEAN DEFAULT FALSE;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS plan_id            UUID REFERENCES public.subscription_plans(id);
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS asaas_customer_id     TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- vincula plano default (free) onde estiver nulo
UPDATE public.salons s
   SET plan_id = (SELECT id FROM public.subscription_plans WHERE slug = 'free')
 WHERE s.plan_id IS NULL;

-- ── 2. Perfis (papel de cada usuário) ───────────────────────
-- role: super_admin | seller_owner | seller_staff | customer
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'customer',
  salon_id    UUID REFERENCES public.salons ON DELETE SET NULL, -- salão a que o usuário pertence
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_salon ON public.profiles(salon_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles(role);

-- ── 3. Profissionais do salão ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.professionals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID NOT NULL REFERENCES public.salons ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  photo_url   TEXT,
  role_title  TEXT,                                -- "Cabeleireira", "Manicure"...
  work_hours  JSONB NOT NULL DEFAULT
    '{"1":[["09:00","18:00"]],"2":[["09:00","18:00"]],"3":[["09:00","18:00"]],"4":[["09:00","18:00"]],"5":[["09:00","18:00"]],"6":[["09:00","13:00"]]}'::jsonb,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professionals_salon ON public.professionals(salon_id);

-- ── 4. Serviços do salão ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id         UUID NOT NULL REFERENCES public.salons ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_salon ON public.services(salon_id);

-- ── 5. Clientes finais (do salão) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id       UUID NOT NULL REFERENCES public.salons ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users ON DELETE SET NULL, -- se criou conta no portal
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  birthdate      DATE,
  loyalty_points INT NOT NULL DEFAULT 0,
  notes          TEXT,
  last_visit     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (salon_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_customers_salon ON public.customers(salon_id);
CREATE INDEX IF NOT EXISTS idx_customers_user  ON public.customers(user_id);

-- ── 6. Agendamentos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id        UUID NOT NULL REFERENCES public.salons ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES public.customers ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals ON DELETE SET NULL,
  service_id      UUID REFERENCES public.services ON DELETE SET NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed', -- pending|confirmed|checked_in|completed|cancelled|no_show
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  check_in_at     TIMESTAMPTZ,
  check_out_at    TIMESTAMPTZ,
  reminded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appt_salon  ON public.appointments(salon_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appt_prof   ON public.appointments(professional_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appt_cust   ON public.appointments(customer_id, scheduled_at DESC);

-- ── 7. Financeiro ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id       UUID NOT NULL REFERENCES public.salons ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments ON DELETE SET NULL,
  type           TEXT NOT NULL DEFAULT 'income',   -- income | expense
  category       TEXT,
  description    TEXT,
  amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'paid',      -- pending | paid
  occurred_at    TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_salon ON public.financial_transactions(salon_id, occurred_at DESC);

-- ── 8. Fidelidade (extrato de pontos) ───────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id       UUID NOT NULL REFERENCES public.salons ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES public.customers ON DELETE CASCADE,
  points         INT NOT NULL,                      -- +ganho / -resgate
  reason         TEXT,
  appointment_id UUID REFERENCES public.appointments ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_cust ON public.loyalty_ledger(customer_id, created_at DESC);

-- ── 9. Banners (Super Admin global + marca do seller) ───────
CREATE TABLE IF NOT EXISTS public.banners (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id   UUID REFERENCES public.salons ON DELETE CASCADE, -- NULL = banner global (landing)
  title      TEXT,
  image_url  TEXT NOT NULL,
  link_url   TEXT,
  position   INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_banners_salon ON public.banners(salon_id, position);

-- ── 10. Audit log (Super Admin) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id   UUID,
  role       TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  UUID,
  meta       JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Helpers SECURITY DEFINER (evitam recursão de RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.my_salon_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT salon_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- Trigger: cria salon + profile no cadastro (substitui o antigo)
-- Cliente final (metadata.role='customer') NÃO ganha salão.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role     TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'seller_owner');
  v_salon    UUID := NULLIF(NEW.raw_user_meta_data->>'salon_id','')::uuid;
  v_free     UUID;
  v_slug     TEXT;
  v_base     TEXT;
  v_i        INT := 0;
BEGIN
  IF v_role = 'customer' THEN
    -- Cliente final: só perfil, vinculado ao salão de origem (se houver)
    INSERT INTO public.profiles (id, role, salon_id, full_name, phone)
    VALUES (NEW.id, 'customer', v_salon,
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
            NEW.raw_user_meta_data->>'phone')
    ON CONFLICT (id) DO NOTHING;

    -- vincula/atualiza o registro de customer do salão pelo telefone/email
    IF v_salon IS NOT NULL THEN
      UPDATE public.customers
         SET user_id = NEW.id
       WHERE salon_id = v_salon
         AND user_id IS NULL
         AND (email = NEW.email OR phone = NEW.raw_user_meta_data->>'phone');
    END IF;
    RETURN NEW;
  END IF;

  -- Seller: cria salão com slug único + profile owner
  SELECT id INTO v_free FROM public.subscription_plans WHERE slug = 'free' LIMIT 1;
  v_base := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'slug', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    '[^a-z0-9]+','-','g'));
  v_base := trim(both '-' from v_base);
  IF v_base = '' THEN v_base := 'salao'; END IF;
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.salons WHERE slug = v_slug) LOOP
    v_i := v_i + 1; v_slug := v_base || '-' || v_i;
  END LOOP;

  INSERT INTO public.salons (owner_id, name, email, phone, slug, plan_id)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          NEW.email, NEW.raw_user_meta_data->>'phone', v_slug, v_free)
  ON CONFLICT (owner_id) DO NOTHING;

  INSERT INTO public.profiles (id, role, salon_id, full_name, phone)
  SELECT NEW.id, 'seller_owner', s.id,
         COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
         NEW.raw_user_meta_data->>'phone'
  FROM public.salons s WHERE s.owner_id = NEW.id
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_salon_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created  ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: garante profile para owners já existentes
INSERT INTO public.profiles (id, role, salon_id, full_name, phone)
SELECT s.owner_id, 'seller_owner', s.id, s.name, s.phone
FROM public.salons s
LEFT JOIN public.profiles p ON p.id = s.owner_id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RPCs públicas para a página /:slug (booking)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_public_services(p_slug TEXT)
RETURNS TABLE (id UUID, name TEXT, description TEXT, duration_minutes INT, price NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT sv.id, sv.name, sv.description, sv.duration_minutes, sv.price
  FROM public.services sv JOIN public.salons s ON s.id = sv.salon_id
  WHERE s.slug = lower(p_slug) AND sv.is_active ORDER BY sv.name;
$$;

CREATE OR REPLACE FUNCTION public.get_public_professionals(p_slug TEXT)
RETURNS TABLE (id UUID, name TEXT, role_title TEXT, photo_url TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pr.id, pr.name, pr.role_title, pr.photo_url
  FROM public.professionals pr JOIN public.salons s ON s.id = pr.salon_id
  WHERE s.slug = lower(p_slug) AND pr.is_active ORDER BY pr.name;
$$;

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_salon_id UUID, p_professional_id UUID, p_service_id UUID, p_date DATE
) RETURNS SETOF TIMESTAMPTZ
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_duration INT;
  v_ranges   JSONB;
  v_range    JSONB;
  v_end      TIME;
  v_cursor   TIME;
  v_slot     TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
BEGIN
  SELECT duration_minutes INTO v_duration FROM public.services
    WHERE id = p_service_id AND salon_id = p_salon_id;
  IF v_duration IS NULL THEN RETURN; END IF;

  SELECT work_hours -> (extract(dow from p_date)::int::text) INTO v_ranges
    FROM public.professionals WHERE id = p_professional_id AND salon_id = p_salon_id;
  IF v_ranges IS NULL OR jsonb_typeof(v_ranges) <> 'array' THEN RETURN; END IF;

  FOR v_range IN SELECT * FROM jsonb_array_elements(v_ranges) LOOP
    v_cursor := (v_range->>0)::time;
    v_end    := (v_range->>1)::time;
    WHILE v_cursor + (v_duration || ' minutes')::interval <= v_end LOOP
      v_slot     := (p_date + v_cursor) AT TIME ZONE 'America/Sao_Paulo';
      v_slot_end := v_slot + (v_duration || ' minutes')::interval;
      IF v_slot > now() AND NOT EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.professional_id = p_professional_id
          AND a.status NOT IN ('cancelled','no_show')
          AND a.scheduled_at < v_slot_end AND a.end_at > v_slot
      ) THEN
        RETURN NEXT v_slot;
      END IF;
      v_cursor := v_cursor + (v_duration || ' minutes')::interval;
    END LOOP;
  END LOOP;
  RETURN;
END;
$$;

-- Agendamento público (cliente não logado em /:slug)
CREATE OR REPLACE FUNCTION public.public_book_appointment(
  p_slug TEXT, p_professional_id UUID, p_service_id UUID,
  p_scheduled_at TIMESTAMPTZ, p_customer_name TEXT, p_customer_phone TEXT, p_customer_email TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_salon UUID; v_dur INT; v_price NUMERIC; v_cust UUID; v_end TIMESTAMPTZ; v_appt UUID;
BEGIN
  SELECT id INTO v_salon FROM public.salons WHERE slug = lower(p_slug);
  IF v_salon IS NULL THEN RAISE EXCEPTION 'Salão não encontrado'; END IF;

  SELECT duration_minutes, price INTO v_dur, v_price FROM public.services
    WHERE id = p_service_id AND salon_id = v_salon;
  IF v_dur IS NULL THEN RAISE EXCEPTION 'Serviço inválido'; END IF;
  v_end := p_scheduled_at + (v_dur || ' minutes')::interval;

  IF EXISTS (SELECT 1 FROM public.appointments a
             WHERE a.professional_id = p_professional_id
               AND a.status NOT IN ('cancelled','no_show')
               AND a.scheduled_at < v_end AND a.end_at > p_scheduled_at) THEN
    RAISE EXCEPTION 'Horário indisponível';
  END IF;

  INSERT INTO public.customers (salon_id, name, phone, email)
  VALUES (v_salon, p_customer_name, p_customer_phone, p_customer_email)
  ON CONFLICT (salon_id, phone)
  DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, public.customers.email)
  RETURNING id INTO v_cust;

  INSERT INTO public.appointments (salon_id, customer_id, professional_id, service_id, scheduled_at, end_at, price, status)
  VALUES (v_salon, v_cust, p_professional_id, p_service_id, p_scheduled_at, v_end, v_price, 'confirmed')
  RETURNING id INTO v_appt;
  RETURN v_appt;
END;
$$;

-- Cancelamento com regra dos 30 min (cliente, seller ou admin)
CREATE OR REPLACE FUNCTION public.cancel_appointment(p_appointment_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_appt public.appointments; v_owns BOOLEAN;
BEGIN
  SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  v_owns := is_super_admin()
    OR v_appt.salon_id = my_salon_id()
    OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = v_appt.customer_id AND c.user_id = auth.uid());
  IF NOT v_owns THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  IF v_appt.scheduled_at < now() + interval '30 minutes' THEN
    RAISE EXCEPTION 'Não é possível cancelar a menos de 30 minutos do horário.';
  END IF;

  UPDATE public.appointments SET status = 'cancelled' WHERE id = p_appointment_id;
  RETURN TRUE;
END;
$$;

-- Check-in (seller)
CREATE OR REPLACE FUNCTION public.check_in_appointment(p_appointment_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_salon UUID;
BEGIN
  SELECT salon_id INTO v_salon FROM public.appointments WHERE id = p_appointment_id;
  IF v_salon IS NULL OR (v_salon <> my_salon_id() AND NOT is_super_admin()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  UPDATE public.appointments
     SET status = 'checked_in', check_in_at = now() WHERE id = p_appointment_id;
  RETURN TRUE;
END;
$$;

-- Check-out: finaliza, lança financeiro e pontua fidelidade (seller)
CREATE OR REPLACE FUNCTION public.check_out_appointment(p_appointment_id UUID, p_amount NUMERIC DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_appt public.appointments; v_amount NUMERIC; v_points INT := 10;
BEGIN
  SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id;
  IF NOT FOUND OR (v_appt.salon_id <> my_salon_id() AND NOT is_super_admin()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  v_amount := COALESCE(p_amount, v_appt.price, 0);

  UPDATE public.appointments
     SET status = 'completed', check_out_at = now(), price = v_amount WHERE id = p_appointment_id;

  INSERT INTO public.financial_transactions (salon_id, appointment_id, type, category, description, amount, status)
  VALUES (v_appt.salon_id, v_appt.id, 'income', 'serviço', 'Atendimento finalizado', v_amount, 'paid');

  INSERT INTO public.loyalty_ledger (salon_id, customer_id, points, reason, appointment_id)
  VALUES (v_appt.salon_id, v_appt.customer_id, v_points, 'Atendimento concluído', v_appt.id);

  UPDATE public.customers
     SET loyalty_points = loyalty_points + v_points, last_visit = now()
   WHERE id = v_appt.customer_id;
  RETURN TRUE;
END;
$$;

-- Métricas globais (Super Admin)
CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v JSONB;
BEGIN
  IF NOT is_super_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT jsonb_build_object(
    'salons',        (SELECT count(*) FROM public.salons),
    'active',        (SELECT count(*) FROM public.salons WHERE subscription_status = 'active'),
    'customers',     (SELECT count(*) FROM public.customers),
    'appointments',  (SELECT count(*) FROM public.appointments),
    'mrr',           (SELECT COALESCE(sum(p.price_month),0) FROM public.salons s
                        JOIN public.subscription_plans p ON p.id = s.plan_id
                       WHERE s.subscription_status = 'active')
  ) INTO v;
  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_services(TEXT)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_professionals(TEXT)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID,UUID,UUID,DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_book_appointment(TEXT,UUID,UUID,TIMESTAMPTZ,TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment(UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_appointment(UUID)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_out_appointment(UUID,NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_metrics()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_salon_id()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_role()                      TO authenticated;

-- ============================================================
-- RLS — isolamento por tenant + super admin + cliente
-- ============================================================
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_ledger         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log              ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_self ON public.profiles;
CREATE POLICY profiles_self ON public.profiles
  FOR SELECT USING (id = auth.uid() OR is_super_admin());
DROP POLICY IF EXISTS profiles_self_upd ON public.profiles;
CREATE POLICY profiles_self_upd ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- subscription_plans: leitura pública dos ativos; super admin gerencia
DROP POLICY IF EXISTS plans_read ON public.subscription_plans;
CREATE POLICY plans_read ON public.subscription_plans
  FOR SELECT USING (is_active OR is_super_admin());
DROP POLICY IF EXISTS plans_admin ON public.subscription_plans;
CREATE POLICY plans_admin ON public.subscription_plans
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- salons: super admin enxerga/gerencia tudo (além das policies do schema.sql)
DROP POLICY IF EXISTS salons_admin_all ON public.salons;
CREATE POLICY salons_admin_all ON public.salons
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- helper de policy: pertence ao salão (seller) ou é super admin
-- (inline nas policies abaixo)

-- professionals
DROP POLICY IF EXISTS prof_rw ON public.professionals;
CREATE POLICY prof_rw ON public.professionals
  FOR ALL USING (salon_id = my_salon_id() OR is_super_admin())
  WITH CHECK (salon_id = my_salon_id() OR is_super_admin());

-- services
DROP POLICY IF EXISTS svc_rw ON public.services;
CREATE POLICY svc_rw ON public.services
  FOR ALL USING (salon_id = my_salon_id() OR is_super_admin())
  WITH CHECK (salon_id = my_salon_id() OR is_super_admin());

-- customers: seller do salão, super admin, ou o próprio cliente
DROP POLICY IF EXISTS cust_rw ON public.customers;
CREATE POLICY cust_rw ON public.customers
  FOR ALL USING (salon_id = my_salon_id() OR is_super_admin() OR user_id = auth.uid())
  WITH CHECK (salon_id = my_salon_id() OR is_super_admin() OR user_id = auth.uid());

-- appointments: seller, super admin, ou o cliente dono
DROP POLICY IF EXISTS appt_rw ON public.appointments;
CREATE POLICY appt_rw ON public.appointments
  FOR ALL USING (
    salon_id = my_salon_id() OR is_super_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ) WITH CHECK (
    salon_id = my_salon_id() OR is_super_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

-- financeiro / fidelidade: seller do salão ou super admin
DROP POLICY IF EXISTS fin_rw ON public.financial_transactions;
CREATE POLICY fin_rw ON public.financial_transactions
  FOR ALL USING (salon_id = my_salon_id() OR is_super_admin())
  WITH CHECK (salon_id = my_salon_id() OR is_super_admin());

DROP POLICY IF EXISTS loy_rw ON public.loyalty_ledger;
CREATE POLICY loy_rw ON public.loyalty_ledger
  FOR ALL USING (
    salon_id = my_salon_id() OR is_super_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ) WITH CHECK (salon_id = my_salon_id() OR is_super_admin());

-- banners: globais legíveis por todos; seller gerencia os seus; super admin tudo
DROP POLICY IF EXISTS banners_read ON public.banners;
CREATE POLICY banners_read ON public.banners
  FOR SELECT USING (is_active OR salon_id = my_salon_id() OR is_super_admin());
DROP POLICY IF EXISTS banners_write ON public.banners;
CREATE POLICY banners_write ON public.banners
  FOR ALL USING (
    (salon_id = my_salon_id()) OR (salon_id IS NULL AND is_super_admin()) OR is_super_admin()
  ) WITH CHECK (
    (salon_id = my_salon_id()) OR (salon_id IS NULL AND is_super_admin()) OR is_super_admin()
  );

-- audit_log: só super admin lê
DROP POLICY IF EXISTS audit_read ON public.audit_log;
CREATE POLICY audit_read ON public.audit_log
  FOR SELECT USING (is_super_admin());

-- ── Verificação ─────────────────────────────────────────────
SELECT 'subscription_plans' t, count(*) FROM public.subscription_plans
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'professionals', count(*) FROM public.professionals
UNION ALL SELECT 'services', count(*) FROM public.services
UNION ALL SELECT 'customers', count(*) FROM public.customers
UNION ALL SELECT 'appointments', count(*) FROM public.appointments;
