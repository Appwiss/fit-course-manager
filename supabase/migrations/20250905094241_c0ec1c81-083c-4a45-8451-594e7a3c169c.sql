-- Fix security warning: Add search path to function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create admin user directly in auth.users and profiles
-- Note: This creates the user record, but the user will need to set their password via password reset
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) 
SELECT 
  gen_random_uuid(),
  'sportxtrem4@gmail.com',
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "sportxtrem4@gmail.com"}',
  false,
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'sportxtrem4@gmail.com'
);

-- Insert admin profile 
INSERT INTO public.profiles (id, username, email, is_admin, created_at, updated_at)
SELECT 
  u.id,
  'Admin Xtrem Sport',
  'sportxtrem4@gmail.com',
  true,
  now(),
  now()
FROM auth.users u 
WHERE u.email = 'sportxtrem4@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.email = 'sportxtrem4@gmail.com'
);