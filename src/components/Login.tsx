import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function Login() {
  const [loginField, setLoginField] = useState(''); // Email ou nom d'utilisateur
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Vérifier si c'est un email ou un nom d'utilisateur
      const isEmail = loginField.includes('@');
      
      if (isEmail) {
        const { error } = await signIn(loginField, password);
        if (error) {
          toast.error('Email ou mot de passe incorrect');
        } else {
          toast.success('Connexion réussie !');
        }
      } else {
        // Chercher l'email par nom d'utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', loginField)
          .single();
          
        if (profile?.email) {
          const { error } = await signIn(profile.email, password);
          if (error) {
            toast.error('Nom d\'utilisateur ou mot de passe incorrect');
          } else {
            toast.success('Connexion réussie !');
          }
        } else {
          toast.error('Nom d\'utilisateur introuvable');
        }
      }
    } catch (error) {
      toast.error('Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
      
      <Card className="w-full max-w-md relative z-10 border-border/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <img
            src="/lovable-uploads/c7962c38-aebc-4ed0-b262-42d0ca641ab1.png"
            alt="Logo Xtreme Fitness"
            className="mx-auto w-56 h-32 object-contain mb-4"
            loading="lazy"
            width={200}
            height={200}
          />
          <CardTitle className="text-2xl font-bold">Xtreme fitness</CardTitle>
          <CardDescription>
            Connectez-vous à votre espace fitness
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-field">Email ou nom d'utilisateur</Label>
              <Input
                id="login-field"
                type="text"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                placeholder="Entrez votre email ou nom d'utilisateur"
                required
                className="bg-muted/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
                className="bg-muted/50"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}