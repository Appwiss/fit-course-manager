-- Supprimer l'utilisateur existant et le recréer avec un mot de passe correct
DELETE FROM auth.users WHERE email = 'sportxtrem4@gmail.com';

-- Insérer un nouvel utilisateur admin avec mot de passe
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated', 
    'sportxtrem4@gmail.com',
    crypt('XtremSp@rt/*2025', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);