import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  userInfo?: {
    username: string;
    subscription?: string;
  };
}

export function Header({ onLogout, userInfo }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border/50 sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo et nom */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
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
          onClick={onLogout}
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}