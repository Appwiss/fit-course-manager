import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ClientDashboard } from '@/components/ClientDashboard';

export function Dashboard() {
  const { isAdmin } = useAuth();

  return isAdmin ? <AdminDashboard /> : <ClientDashboard />;
}