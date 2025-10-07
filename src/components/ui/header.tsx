import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  userInfo?: {
    username: string;
    subscription?: string;
  };
}

export function Header({ userInfo }: HeaderProps) {
  const { signOut } = useAuth();
  return (
    <header className="bg-card border-b border-border/50 sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo et nom */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img
              src="/lovable-uploads/c7962c38-aebc-4ed0-b262-42d0ca641ab1.png"
              alt="Logo Xtreme Fitness"
              className="w-10 h-10 object-contain"
              loading="lazy"
              width={40}
              height={40}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Xtreme fitness</h1>
            {userInfo && (
              <p className="text-sm text-muted-foreground">
                Bienvenue, {userInfo.username}
                {userInfo.subscription && ` • ${userInfo.subscription}`}
              </p>
            )}
          </div>
        </div>

        {/* Bouton de déconnexion */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}