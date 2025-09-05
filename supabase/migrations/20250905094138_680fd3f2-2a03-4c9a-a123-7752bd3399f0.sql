-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE public.subscription_type AS ENUM ('debutant', 'medium', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.account_status AS ENUM ('active', 'disabled', 'cancelled', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables only if they don't exist

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image TEXT, -- data URL ou URL http(s)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_programs table  
CREATE TABLE IF NOT EXISTS public.weekly_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create day_schedules table
CREATE TABLE IF NOT EXISTS public.day_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.weekly_programs(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_name TEXT NOT NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  rest_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule_courses table (relation many-to-many between day_schedules and courses)
CREATE TABLE IF NOT EXISTS public.schedule_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.day_schedules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, course_id)
);

-- Enable Row Level Security on new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for weekly_programs
DROP POLICY IF EXISTS "Programs are viewable by everyone" ON public.weekly_programs;
CREATE POLICY "Programs are viewable by everyone" ON public.weekly_programs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage programs" ON public.weekly_programs;
CREATE POLICY "Admins manage programs" ON public.weekly_programs
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for day_schedules
DROP POLICY IF EXISTS "Schedules are viewable by everyone" ON public.day_schedules;
CREATE POLICY "Schedules are viewable by everyone" ON public.day_schedules
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage schedules" ON public.day_schedules;
CREATE POLICY "Admins manage schedules" ON public.day_schedules
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for schedule_courses
DROP POLICY IF EXISTS "Schedule courses are viewable by everyone" ON public.schedule_courses;
CREATE POLICY "Schedule courses are viewable by everyone" ON public.schedule_courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage schedule courses" ON public.schedule_courses;
CREATE POLICY "Admins manage schedule courses" ON public.schedule_courses
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- Create triggers for updated_at on new tables
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_programs_updated_at ON public.weekly_programs;
CREATE TRIGGER update_weekly_programs_updated_at
  BEFORE UPDATE ON public.weekly_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_day_schedules_updated_at ON public.day_schedules;
CREATE TRIGGER update_day_schedules_updated_at
  BEFORE UPDATE ON public.day_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample courses if they don't exist
INSERT INTO public.courses (title, description, level, category, duration, instructor) 
SELECT 'Yoga pour Débutants', 'Introduction au yoga avec des postures de base', 'debutant'::subscription_type, 'Yoga', 30, 'Sarah Johnson'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Yoga pour Débutants');

INSERT INTO public.courses (title, description, level, category, duration, instructor) 
SELECT 'Cardio Training', 'Entraînement cardio intensif pour brûler les calories', 'medium'::subscription_type, 'Cardio', 45, 'Mike Wilson'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Cardio Training');

INSERT INTO public.courses (title, description, level, category, duration, instructor) 
SELECT 'CrossFit Avancé', 'Entraînement CrossFit pour les athlètes expérimentés', 'expert'::subscription_type, 'CrossFit', 60, 'David Smith'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'CrossFit Avancé');

INSERT INTO public.courses (title, description, level, category, duration, instructor) 
SELECT 'Pilates Débutant', 'Renforcement musculaire doux avec le Pilates', 'debutant'::subscription_type, 'Pilates', 35, 'Emma Davis'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Pilates Débutant');