-- Mettre à jour le profil existant avec le nouvel ID utilisateur
UPDATE profiles 
SET id = (SELECT id FROM auth.users WHERE email = 'sportxtrem4@gmail.com')
WHERE email = 'sportxtrem4@gmail.com';