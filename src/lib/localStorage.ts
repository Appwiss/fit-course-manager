import { User, Course, UserCourseAccess, SubscriptionPlan, UserSubscription } from '@/types/fitness';

const STORAGE_KEYS = {
  USERS: 'fitness_app_users',
  COURSES: 'fitness_app_courses',
  COURSE_ACCESS: 'fitness_app_course_access',
  CURRENT_USER: 'fitness_app_current_user',
  SUBSCRIPTION_PLANS: 'fitness_app_subscription_plans',
  USER_SUBSCRIPTIONS: 'fitness_app_user_subscriptions'
};

// Utilisateurs par défaut
const defaultUsers: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@fitness.com',
    subscription: 'expert',
    isAdmin: true,
    accessibleCourses: [],
    createdAt: new Date().toISOString()
  }
];

// Plans d'abonnement par défaut
const defaultSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-debutant',
    name: 'Plan Débutant',
    level: 'debutant',
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    features: ['Accès aux cours débutants', 'Support email', 'Suivi des progrès'],
    appAccess: false
  },
  {
    id: 'plan-medium',
    name: 'Plan Medium',
    level: 'medium',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    features: ['Accès aux cours débutants et medium', 'Support prioritaire', 'Suivi avancé', 'Plans nutrition'],
    appAccess: false
  },
  {
    id: 'plan-expert',
    name: 'Plan Expert',
    level: 'expert',
    monthlyPrice: 39.99,
    annualPrice: 399.99,
    features: ['Accès à tous les cours', 'Support VIP', 'Coaching personnalisé', 'Plans nutrition premium'],
    appAccess: false
  }
];

// Cours par défaut
const defaultCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Introduction au Fitness',
    description: 'Apprenez les bases du fitness avec des exercices simples et efficaces pour débuter votre transformation.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'debutant',
    category: 'Cardio',
    duration: 30,
    instructor: 'Coach Sarah',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
  },
  {
    id: 'course-2',
    title: 'Musculation Intermédiaire',
    description: 'Développez votre force avec des exercices de musculation adaptés au niveau medium.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'medium',
    category: 'Musculation',
    duration: 45,
    instructor: 'Coach Mike',
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400'
  },
  {
    id: 'course-3',
    title: 'CrossFit Avancé',
    description: 'Entraînement intensif de CrossFit pour les athlètes expérimentés. Repoussez vos limites !',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'expert',
    category: 'CrossFit',
    duration: 60,
    instructor: 'Coach Alex',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'
  },
  {
    id: 'course-4',
    title: 'Yoga Débutant',
    description: 'Découvrez la sérénité et la flexibilité avec cette session de yoga pour débutants.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'debutant',
    category: 'Yoga',
    duration: 35,
    instructor: 'Coach Emma',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
  },
  {
    id: 'course-5',
    title: 'HIIT Medium',
    description: 'Brûlez des calories avec cette session HIIT de niveau intermédiaire.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'medium',
    category: 'HIIT',
    duration: 25,
    instructor: 'Coach Tom',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
  },
  {
    id: 'course-6',
    title: 'Powerlifting Expert',
    description: 'Maîtrisez les mouvements de powerlifting avec cette formation experte.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    level: 'expert',
    category: 'Powerlifting',
    duration: 90,
    instructor: 'Coach David',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'
  }
];

export class LocalStorageService {
  // Initialisation des données par défaut
  static initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(defaultCourses));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURSE_ACCESS)) {
      localStorage.setItem(STORAGE_KEYS.COURSE_ACCESS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_PLANS)) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PLANS, JSON.stringify(defaultSubscriptionPlans));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER_SUBSCRIPTIONS)) {
      localStorage.setItem(STORAGE_KEYS.USER_SUBSCRIPTIONS, JSON.stringify([]));
    }
  }

  // Gestion des utilisateurs
  static getUsers(): User[] {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  }

  static saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static addUser(user: User) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  static updateUser(updatedUser: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.saveUsers(users);
    }
  }

  static deleteUser(userId: string) {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);
  }

  // Gestion des cours
  static getCourses(): Course[] {
    const courses = localStorage.getItem(STORAGE_KEYS.COURSES);
    return courses ? JSON.parse(courses) : [];
  }

  static saveCourses(courses: Course[]) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }

  // Gestion des accès aux cours
  static getCourseAccess(): UserCourseAccess[] {
    const access = localStorage.getItem(STORAGE_KEYS.COURSE_ACCESS);
    return access ? JSON.parse(access) : [];
  }

  static saveCourseAccess(access: UserCourseAccess[]) {
    localStorage.setItem(STORAGE_KEYS.COURSE_ACCESS, JSON.stringify(access));
  }

  static grantCourseAccess(userId: string, courseId: string) {
    const accessList = this.getCourseAccess();
    const existingAccess = accessList.find(a => a.userId === userId && a.courseId === courseId);
    
    if (existingAccess) {
      existingAccess.hasAccess = true;
      existingAccess.grantedAt = new Date().toISOString();
      existingAccess.revokedAt = undefined;
    } else {
      accessList.push({
        userId,
        courseId,
        hasAccess: true,
        grantedAt: new Date().toISOString()
      });
    }
    
    this.saveCourseAccess(accessList);
  }

  static revokeCourseAccess(userId: string, courseId: string) {
    const accessList = this.getCourseAccess();
    const existingAccess = accessList.find(a => a.userId === userId && a.courseId === courseId);
    
    if (existingAccess) {
      existingAccess.hasAccess = false;
      existingAccess.revokedAt = new Date().toISOString();
    } else {
      accessList.push({
        userId,
        courseId,
        hasAccess: false,
        revokedAt: new Date().toISOString()
      });
    }
    
    this.saveCourseAccess(accessList);
  }

  static hasAccessToCourse(userId: string, courseId: string): boolean {
    const accessList = this.getCourseAccess();
    const access = accessList.find(a => a.userId === userId && a.courseId === courseId);
    return access ? access.hasAccess : false;
  }

  // Authentification
  static getCurrentUser(): User | null {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  }

  static setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  static authenticate(username: string, password: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      this.setCurrentUser(user);
      return user;
    }
    return null;
  }

  static logout() {
    this.setCurrentUser(null);
  }

  // Gestion des plans d'abonnement
  static getSubscriptionPlans(): SubscriptionPlan[] {
    const plans = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_PLANS);
    return plans ? JSON.parse(plans) : [];
  }

  static saveSubscriptionPlans(plans: SubscriptionPlan[]) {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PLANS, JSON.stringify(plans));
  }

  // Gestion des abonnements utilisateurs
  static getUserSubscriptions(): UserSubscription[] {
    const subscriptions = localStorage.getItem(STORAGE_KEYS.USER_SUBSCRIPTIONS);
    return subscriptions ? JSON.parse(subscriptions) : [];
  }

  static saveUserSubscriptions(subscriptions: UserSubscription[]) {
    localStorage.setItem(STORAGE_KEYS.USER_SUBSCRIPTIONS, JSON.stringify(subscriptions));
  }

  static getUserSubscription(userId: string): UserSubscription | null {
    const subscriptions = this.getUserSubscriptions();
    return subscriptions.find(s => s.userId === userId && s.status === 'active') || null;
  }

  static createSubscription(subscription: UserSubscription) {
    const subscriptions = this.getUserSubscriptions();
    
    // Désactiver l'ancien abonnement s'il existe
    const existingIndex = subscriptions.findIndex(s => s.userId === subscription.userId && s.status === 'active');
    if (existingIndex !== -1) {
      subscriptions[existingIndex].status = 'cancelled';
    }
    
    subscriptions.push(subscription);
    this.saveUserSubscriptions(subscriptions);
  }

  static cancelSubscription(userId: string) {
    const subscriptions = this.getUserSubscriptions();
    const subscription = subscriptions.find(s => s.userId === userId && s.status === 'active');
    if (subscription) {
      subscription.status = 'cancelled';
      this.saveUserSubscriptions(subscriptions);
    }
  }
}