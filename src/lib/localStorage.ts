import { User, Course, UserCourseAccess, SubscriptionPlan, UserSubscription, PaymentInterval, Product, WeeklyProgram } from '@/types/fitness';

const STORAGE_KEYS = {
  USERS: 'fitness_app_users',
  COURSES: 'fitness_app_courses',
  COURSE_ACCESS: 'fitness_app_course_access',
  CURRENT_USER: 'fitness_app_current_user',
  SUBSCRIPTION_PLANS: 'fitness_app_subscription_plans',
  USER_SUBSCRIPTIONS: 'fitness_app_user_subscriptions',
  PRODUCTS: 'fitness_app_products',
  WEEKLY_PROGRAMS: 'fitness_app_weekly_programs'
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
    createdAt: new Date().toISOString(),
    accountStatus: 'active'
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
    appAccess: false,
    isFamily: false
  },
  {
    id: 'plan-medium',
    name: 'Plan Medium',
    level: 'medium',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    features: ['Accès aux cours débutants et medium', 'Support prioritaire', 'Suivi avancé', 'Plans nutrition'],
    appAccess: false,
    isFamily: false
  },
  {
    id: 'plan-expert',
    name: 'Plan Expert',
    level: 'expert',
    monthlyPrice: 39.99,
    annualPrice: 399.99,
    features: ['Accès à tous les cours', 'Support VIP', 'Coaching personnalisé', 'Plans nutrition premium'],
    appAccess: false,
    isFamily: false
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
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WEEKLY_PROGRAMS)) {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_PROGRAMS, JSON.stringify([]));
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

  // Gestion des produits
  static getProducts(): Product[] {
    const products = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return products ? JSON.parse(products) : [];
  }

  static saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static addProduct(product: Product) {
    const products = this.getProducts();
    products.push(product);
    this.saveProducts(products);
  }

  static deleteProduct(productId: string) {
    const products = this.getProducts().filter(p => p.id !== productId);
    this.saveProducts(products);
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
    return subscriptions.find(s => s.userId === userId && (s.status === 'active' || s.status === 'overdue')) || null;
  }

  static addSubscriptionPlan(plan: SubscriptionPlan) {
    const plans = this.getSubscriptionPlans();
    plans.push(plan);
    this.saveSubscriptionPlans(plans);
  }

  static updateSubscriptionPlan(updatedPlan: SubscriptionPlan) {
    const plans = this.getSubscriptionPlans();
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
      plans[index] = updatedPlan;
      this.saveSubscriptionPlans(plans);
    }
  }

  static deleteSubscriptionPlan(planId: string) {
    const plans = this.getSubscriptionPlans().filter(p => p.id !== planId);
    this.saveSubscriptionPlans(plans);
  }

  static assignUserToSubscription(userId: string, planId: string, interval: PaymentInterval, appAccess: boolean) {
    const user = this.getUsers().find(u => u.id === userId);
    if (!user) return false;

    const plan = this.getSubscriptionPlans().find(p => p.id === planId);
    if (!plan) return false;

    const startDate = new Date();
    const endDate = new Date();
    const nextPaymentDate = new Date();
    
    if (interval === 'mensuel') {
      endDate.setMonth(endDate.getMonth() + 1);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
      nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
    }

    const subscription: UserSubscription = {
      userId,
      planId,
      interval,
      appAccess,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nextPaymentDate: nextPaymentDate.toISOString(),
      status: 'active',
      paymentMethod: 'admin_assigned'
    };

    this.createSubscription(subscription);

    // Activer le compte utilisateur
    user.accountStatus = 'active';
    user.subscription = plan.level;
    this.updateUser(user);

    return true;
  }

  static setSubscriptionOverdue(userId: string) {
    const subscriptions = this.getUserSubscriptions();
    const subscription = subscriptions.find(s => s.userId === userId && s.status === 'active');
    if (subscription) {
      subscription.status = 'overdue';
      subscription.overdueDate = new Date().toISOString();
      this.saveUserSubscriptions(subscriptions);

      // Désactiver le compte utilisateur
      const users = this.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
        user.accountStatus = 'disabled';
        user.disabledReason = 'payment_overdue';
        this.saveUsers(users);
      }
    }
  }

  static cancelUserAccount(userId: string) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.accountStatus = 'cancelled';
      this.saveUsers(users);

      // Annuler l'abonnement
      this.cancelSubscription(userId);
    }
  }

  static reactivateUserAccount(userId: string) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.accountStatus = 'active';
      user.disabledReason = undefined;
      user.suspendedUntil = undefined;
      user.suspensionReason = undefined;
      this.saveUsers(users);

      // Réactiver l'abonnement si il existe
      const subscriptions = this.getUserSubscriptions();
      const subscription = subscriptions.find(s => s.userId === userId && s.status === 'overdue');
      if (subscription) {
        subscription.status = 'active';
        subscription.overdueDate = undefined;
        // Prolonger la date de fin
        const endDate = new Date();
        if (subscription.interval === 'mensuel') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        subscription.endDate = endDate.toISOString();
        subscription.nextPaymentDate = endDate.toISOString();
        this.saveUserSubscriptions(subscriptions);
      }
    }
  }

  static suspendUserAccount(userId: string, until: string, reason?: string) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.accountStatus = 'suspended';
      user.suspendedUntil = until;
      user.suspensionReason = reason;
      this.saveUsers(users);
    }
  }

  static disableUserAccount(userId: string, reason?: 'payment_overdue' | 'admin_action') {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.accountStatus = 'disabled';
      user.disabledReason = reason || 'admin_action';
      this.saveUsers(users);
    }
  }


  static getAccountsKPI() {
    const users = this.getUsers().filter(u => !u.isAdmin);
    const overdue = users.filter(u => u.accountStatus === 'disabled' && u.disabledReason === 'payment_overdue');
    const cancelled = users.filter(u => u.accountStatus === 'cancelled');
    const active = users.filter(u => u.accountStatus === 'active');

    return {
      total: users.length,
      active: active.length,
      overdue: overdue.length,
      cancelled: cancelled.length,
      overdueUsers: overdue,
      cancelledUsers: cancelled
    };
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

  // Gestion des programmes hebdomadaires
  static getWeeklyPrograms(): WeeklyProgram[] {
    const programs = localStorage.getItem(STORAGE_KEYS.WEEKLY_PROGRAMS);
    return programs ? JSON.parse(programs) : [];
  }

  static saveWeeklyPrograms(programs: WeeklyProgram[]) {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_PROGRAMS, JSON.stringify(programs));
  }

  static addWeeklyProgram(program: WeeklyProgram) {
    const programs = this.getWeeklyPrograms();
    programs.push(program);
    this.saveWeeklyPrograms(programs);
  }

  static updateWeeklyProgram(updatedProgram: WeeklyProgram) {
    const programs = this.getWeeklyPrograms();
    const index = programs.findIndex(p => p.id === updatedProgram.id);
    if (index !== -1) {
      programs[index] = updatedProgram;
      this.saveWeeklyPrograms(programs);
    }
  }

  static deleteWeeklyProgram(programId: string) {
    const programs = this.getWeeklyPrograms().filter(p => p.id !== programId);
    this.saveWeeklyPrograms(programs);
  }

  // Gestion de l'affectation de programmes aux utilisateurs
  static assignProgramToUser(userId: string, programId: string | null) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.assignedProgramId = programId || undefined;
      this.updateUser(user);
      return true;
    }
    return false;
  }

  static getUserAssignedProgram(userId: string): WeeklyProgram | null {
    const user = this.getUsers().find(u => u.id === userId);
    if (!user?.assignedProgramId) return null;
    
    const programs = this.getWeeklyPrograms();
    return programs.find(p => p.id === user.assignedProgramId) || null;
  }
}