-- ============================================================
-- Provador Virtual Beauty — Schema do SaaS
-- Aplicar em: jneokgfjwxqojpagkrkw.supabase.co (SQL Editor)
-- Idempotente — pode rodar mais de uma vez.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Salões (perfil, vinculado a auth.users) ──────────────
CREATE TABLE IF NOT EXISTS public.salons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  slug                TEXT UNIQUE,
  plan                TEXT NOT NULL DEFAULT 'free',         -- free | pro | premium
  subscription_status TEXT NOT NULL DEFAULT 'trial',        -- trial | active | overdue | canceled
  quota_limit         INT NOT NULL DEFAULT 10,              -- simulações/mês (free = 10)
  quota_used          INT NOT NULL DEFAULT 0,
  quota_reset_at      DATE DEFAULT (date_trunc('month', now()) + interval '1 month'),
  trial_ends_at       TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salons_owner ON public.salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_slug  ON public.salons(slug);

-- ── 2. Sessões de provador (histórico) ──────────────────────
CREATE TABLE IF NOT EXISTS public.tryon_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id      UUID NOT NULL REFERENCES public.salons ON DELETE CASCADE,
  type          TEXT NOT NULL,                              -- nail | hair
  client_name   TEXT,
  result_image  TEXT NOT NULL,                              -- data URL ou URL do Storage
  before_image  TEXT,
  params        JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tryon_salon ON public.tryon_sessions(salon_id, created_at DESC);

-- ── 3. Trigger: cria salon automaticamente ao cadastrar ─────
CREATE OR REPLACE FUNCTION public.handle_new_salon()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_base TEXT;
  v_i    INT := 0;
BEGIN
  -- Slug escolhido no cadastro (ou derivado do nome). Garante unicidade.
  v_base := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'slug', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '[^a-z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);
  IF v_base = '' THEN v_base := 'salao'; END IF;
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.salons WHERE slug = v_slug) LOOP
    v_i := v_i + 1;
    v_slug := v_base || '-' || v_i;
  END LOOP;

  INSERT INTO public.salons (owner_id, name, email, phone, slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    v_slug
  )
  ON CONFLICT (owner_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_salon failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ── 3b. RPC pública: checar disponibilidade de slug (cadastro) ─
CREATE OR REPLACE FUNCTION public.is_slug_available(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.salons WHERE slug = lower(p_slug));
$$;

-- ── 3c. RPC pública: dados públicos do salão por slug (página /:slug) ─
CREATE OR REPLACE FUNCTION public.get_public_salon(p_slug TEXT)
RETURNS TABLE (id UUID, name TEXT, slug TEXT, plan TEXT, quota_available BOOLEAN)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.name, s.slug, s.plan,
         (s.subscription_status = 'active' OR s.quota_used < s.quota_limit) AS quota_available
  FROM public.salons s
  WHERE s.slug = lower(p_slug)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_slug_available(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_salon(TEXT)  TO anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_salon_created ON auth.users;
CREATE TRIGGER on_auth_salon_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_salon();

-- ── 4. RPC: incrementa uso e checa cota (chamado após gerar) ─
CREATE OR REPLACE FUNCTION public.consume_quota(p_salon_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_used INT; v_limit INT; v_reset DATE; v_status TEXT;
BEGIN
  SELECT quota_used, quota_limit, quota_reset_at, subscription_status
    INTO v_used, v_limit, v_reset, v_status
  FROM public.salons WHERE id = p_salon_id FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Reset mensal automático
  IF v_reset <= CURRENT_DATE THEN
    UPDATE public.salons
      SET quota_used = 0,
          quota_reset_at = date_trunc('month', now()) + interval '1 month'
      WHERE id = p_salon_id;
    v_used := 0;
  END IF;

  -- Plano pago = ilimitado
  IF v_status = 'active' THEN
    UPDATE public.salons SET quota_used = quota_used + 1 WHERE id = p_salon_id;
    RETURN TRUE;
  END IF;

  -- Free: respeita o limite
  IF v_used >= v_limit THEN RETURN FALSE; END IF;

  UPDATE public.salons SET quota_used = quota_used + 1 WHERE id = p_salon_id;
  RETURN TRUE;
END;
$$;

-- ── 5. RLS — cada salão só vê os próprios dados ─────────────
ALTER TABLE public.salons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_own_select" ON public.salons;
CREATE POLICY "salon_own_select" ON public.salons
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "salon_own_update" ON public.salons;
CREATE POLICY "salon_own_update" ON public.salons
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "sessions_own_all" ON public.tryon_sessions;
CREATE POLICY "sessions_own_all" ON public.tryon_sessions
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- ── 6. Backfill: cria salon pra quem já tem auth.users ──────
INSERT INTO public.salons (owner_id, name, email, phone)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
       u.email,
       u.raw_user_meta_data->>'phone'
FROM auth.users u
LEFT JOIN public.salons s ON s.owner_id = u.id
WHERE s.owner_id IS NULL
ON CONFLICT (owner_id) DO NOTHING;

-- ── 7. Verificação ──────────────────────────────────────────
SELECT 'salons' AS tabela, COUNT(*) FROM public.salons
UNION ALL SELECT 'tryon_sessions', COUNT(*) FROM public.tryon_sessions;
