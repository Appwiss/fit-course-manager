export type SubscriptionType = 'debutant' | 'medium' | 'expert';

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  subscription: SubscriptionType;
  isAdmin: boolean;
  accessibleCourses: string[];
  createdAt: string;
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
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}