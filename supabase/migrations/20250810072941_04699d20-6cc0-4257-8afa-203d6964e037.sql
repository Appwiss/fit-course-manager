-- Ensure gen_random_uuid is available
create extension if not exists pgcrypto;

-- =========================
-- ENUMS (safe-creation)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.subscription_level AS ENUM ('debutant','medium','expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_interval AS ENUM ('mensuel','annuel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active','expired','cancelled','overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- COMMON UTIL FUNCTIONS
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safe admin-check function: returns false if profiles table doesn't exist yet
CREATE OR REPLACE FUNCTION public.get_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean := false;
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false)
      INTO result;
  ELSE
    result := false;
  END IF;
  RETURN result;
END;
$$;

-- =========================
-- PROFILES
-- =========================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE,
  email text UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
  CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DROP POLICY IF EXISTS "Profiles: user can view own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: user can insert own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: user can update own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admins manage all" ON public.profiles;

CREATE POLICY "Profiles: user can view own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: user can insert own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: user can update own" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles: admins manage all" ON public.profiles
FOR ALL USING (public.get_is_admin()) WITH CHECK (public.get_is_admin());

-- =========================
-- ROLES
-- =========================
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','member')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.roles;
DROP POLICY IF EXISTS "Admins manage all roles" ON public.roles;

CREATE POLICY "Users can view their own roles" ON public.roles
FOR SELECT USING (auth.uid() = user_id OR public.get_is_admin());

CREATE POLICY "Admins manage all roles" ON public.roles
FOR ALL USING (public.get_is_admin()) WITH CHECK (public.get_is_admin());

-- =========================
-- SUBSCRIPTION PLANS
-- =========================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level public.subscription_level NOT NULL,
  monthly_price numeric(10,2) NOT NULL,
  annual_price numeric(10,2) NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  app_access boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
  CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;

CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans
FOR SELECT USING (true);

CREATE POLICY "Admins manage plans" ON public.subscription_plans
FOR ALL USING (public.get_is_admin()) WITH CHECK (public.get_is_admin());

-- =========================
-- USER SUBSCRIPTIONS
-- =========================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans (id) ON DELETE RESTRICT,
  interval public.payment_interval NOT NULL,
  app_access boolean NOT NULL DEFAULT true,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  status public.subscription_status NOT NULL DEFAULT 'active',
  payment_method text,
  next_payment_date timestamptz,
  overdue_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions (plan_id);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
  CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins manage all subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
FOR SELECT USING (auth.uid() = user_id OR public.get_is_admin());

CREATE POLICY "Users can create their own subscription" ON public.user_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscriptions" ON public.user_subscriptions
FOR ALL USING (public.get_is_admin()) WITH CHECK (public.get_is_admin());

-- =========================
-- COURSES
-- =========================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text,
  level public.subscription_level NOT NULL,
  category text,
  duration integer,
  instructor text,
  thumbnail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
  CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;

CREATE POLICY "Courses are viewable by everyone" ON public.courses
FOR SELECT USING (true);

CREATE POLICY "Admins manage courses" ON public.courses
FOR ALL USING (public.get_is_admin()) WITH CHECK (public.get_is_admin());

-- =========================
-- USER COURSE ACCESS
-- =========================
CREATE TABLE IF NOT EXISTS public.user_course_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  has_access boolean NOT NULL DEFAULT false,
  granted_at timestamptz,
  revoked_at timestamptz,
  reason text,
  override_subscription boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_access_user_id ON public.user_course_access (user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_access_course_id ON public.user_course_access (course_id);

ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_user_course_access_updated_at ON public.user_course_access;
  CREATE TRIGGER update_user_course_access_updated_at
  BEFORE UPDATE ON public.user_course_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DROP POLICY IF EXISTS "Users can view their own course access" ON public.user_course_access;
DROP POLICY IF EXISTS "Admins manage all course access" ON public.user_course_access;
DROP POLICY IF EXISTS "Users cannot modify access" ON public.user_course_access;

CREATE POLICY "Users can view their own course access" ON public.user_course_access
FOR SELECT USING (auth.uid() = user_id OR public.get_is_admin());

CREATE POLICY "Users cannot modify access" ON public.user_course_access
FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Admins manage all course access" ON public.user_course_access
FOR ALL USING (public.get_is_admin()) WITH CHECK (public.get_is_admin());