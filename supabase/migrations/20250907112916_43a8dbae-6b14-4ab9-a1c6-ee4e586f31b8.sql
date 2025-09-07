-- Définir le mot de passe pour l'utilisateur admin
UPDATE auth.users 
SET encrypted_password = crypt('XtremSp@rt/*2025', gen_salt('bf')), 
    email_confirmed_at = now(),
    confirmed_at = now()
WHERE email = 'sportxtrem4@gmail.com';