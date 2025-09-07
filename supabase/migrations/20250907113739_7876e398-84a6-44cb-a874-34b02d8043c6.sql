-- Créer le profil admin pour le nouvel utilisateur
INSERT INTO profiles (id, email, is_admin) 
SELECT id, email, true 
FROM auth.users 
WHERE email = 'sportxtrem4@gmail.com';