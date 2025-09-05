-- Create custom types
CREATE TYPE public.subscription_type AS ENUM ('debutant', 'medium', 'expert');
CREATE TYPE public.payment_interval AS ENUM ('mensuel', 'annuel');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'overdue');
CREATE TYPE public.account_status AS ENUM ('active', 'disabled', 'cancelled', 'suspended');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level subscription_type NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2) NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  app_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  level subscription_type NOT NULL,
  category TEXT,
  duration INTEGER, -- en minutes
  instructor TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  interval payment_interval NOT NULL,
  app_access BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  status subscription_status NOT NULL DEFAULT 'active',
  payment_method TEXT,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  overdue_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_course_access table
CREATE TABLE public.user_course_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  has_access BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  override_subscription BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image TEXT, -- data URL ou URL http(s)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_programs table
CREATE TABLE public.weekly_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create day_schedules table
CREATE TABLE public.day_schedules (
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
CREATE TABLE public.schedule_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.day_schedules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, course_id)
);

-- Create function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.get_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN := false;
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false)
      INTO result;
  ELSE
    result := false;
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_course_access_updated_at
  BEFORE UPDATE ON public.user_course_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_programs_updated_at
  BEFORE UPDATE ON public.weekly_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_day_schedules_updated_at
  BEFORE UPDATE ON public.day_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles: user can view own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: user can insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: user can update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles: admins manage all" ON public.profiles
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for subscription_plans
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Admins manage plans" ON public.subscription_plans
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for courses
CREATE POLICY "Courses are viewable by everyone" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR get_is_admin());

CREATE POLICY "Users can create their own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscriptions" ON public.user_subscriptions
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for user_course_access
CREATE POLICY "Users can view their own course access" ON public.user_course_access
  FOR SELECT USING (auth.uid() = user_id OR get_is_admin());

CREATE POLICY "Users cannot modify access" ON public.user_course_access
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Admins manage all course access" ON public.user_course_access
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for roles
CREATE POLICY "Users can view their own roles" ON public.roles
  FOR SELECT USING (auth.uid() = user_id OR get_is_admin());

CREATE POLICY "Admins manage all roles" ON public.roles
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for products
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for weekly_programs
CREATE POLICY "Programs are viewable by everyone" ON public.weekly_programs
  FOR SELECT USING (true);

CREATE POLICY "Admins manage programs" ON public.weekly_programs
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for day_schedules
CREATE POLICY "Schedules are viewable by everyone" ON public.day_schedules
  FOR SELECT USING (true);

CREATE POLICY "Admins manage schedules" ON public.day_schedules
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- RLS Policies for schedule_courses
CREATE POLICY "Schedule courses are viewable by everyone" ON public.schedule_courses
  FOR SELECT USING (true);

CREATE POLICY "Admins manage schedule courses" ON public.schedule_courses
  FOR ALL USING (get_is_admin()) WITH CHECK (get_is_admin());

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (name, level, monthly_price, annual_price, features, app_access) VALUES
('Plan Débutant', 'debutant', 19.99, 199.99, ARRAY['Accès aux cours débutants', 'Support email', '1 séance par semaine'], true),
('Plan Medium', 'medium', 39.99, 399.99, ARRAY['Accès aux cours débutants et medium', 'Support prioritaire', '3 séances par semaine', 'Programmes personnalisés'], true),
('Plan Expert', 'expert', 59.99, 599.99, ARRAY['Accès à tous les cours', 'Support 24/7', 'Séances illimitées', 'Coaching personnel', 'Nutrition personnalisée'], true);

-- Insert sample courses
INSERT INTO public.courses (title, description, level, category, duration, instructor) VALUES
('Yoga pour Débutants', 'Introduction au yoga avec des postures de base', 'debutant', 'Yoga', 30, 'Sarah Johnson'),
('Cardio Training', 'Entraînement cardio intensif pour brûler les calories', 'medium', 'Cardio', 45, 'Mike Wilson'),
('CrossFit Avancé', 'Entraînement CrossFit pour les athlètes expérimentés', 'expert', 'CrossFit', 60, 'David Smith'),
('Pilates Débutant', 'Renforcement musculaire doux avec le Pilates', 'debutant', 'Pilates', 35, 'Emma Davis');

-- Create trigger function for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    NEW.email,
    NEW.email = 'sportxtrem4@gmail.com'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();