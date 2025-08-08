export type SubscriptionType = 'debutant' | 'medium' | 'expert';
export type PaymentInterval = 'mensuel' | 'annuel';

export interface SubscriptionPlan {
  id: string;
  name: string;
  level: SubscriptionType;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  appAccess: boolean;
}

export interface UserSubscription {
  userId: string;
  planId: string;
  interval: PaymentInterval;
  appAccess: boolean;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'overdue';
  paymentMethod: string;
  nextPaymentDate: string;
  overdueDate?: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  subscription: SubscriptionType;
  isAdmin: boolean;
  accessibleCourses: string[];
  createdAt: string;
  accountStatus: 'active' | 'disabled' | 'cancelled' | 'suspended';
  disabledReason?: 'payment_overdue' | 'admin_action';
  suspendedUntil?: string;
  suspensionReason?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  level: SubscriptionType;
  category: string;
  duration: number; // en minutes
  instructor: string;
  thumbnail?: string;
}

export interface UserCourseAccess {
  userId: string;
  courseId: string;
  hasAccess: boolean;
  grantedAt?: string;
  revokedAt?: string;
  reason?: string; // Raison de la modification d'accès
  overrideSubscription?: boolean; // Si true, ignore les permissions de l'abonnement
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}