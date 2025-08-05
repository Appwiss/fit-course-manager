import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LocalStorageService } from '@/lib/localStorage';
import { Course, SubscriptionType } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionBadge } from '@/components/ui/subscription-badge';
import { Header } from '@/components/ui/header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ClientDashboard() {
  const { currentUser, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    setCourses(LocalStorageService.getCourses());
  }, []);

  const canAccessBySubscription = (userSubscription: SubscriptionType, courseLevel: SubscriptionType) => {
    const levels = { debutant: 1, medium: 2, expert: 3 };
    return levels[userSubscription] >= levels[courseLevel];
  };

  const hasCustomAccess = (courseId: string) => {
    const courseAccess = LocalStorageService.getCourseAccess();
    const customAccess = courseAccess.find(
      access => access.userId === currentUser!.id && access.courseId === courseId && access.overrideSubscription
    );
    return customAccess ? customAccess.hasAccess : null;
  };

  const canAccessCourse = (course: Course) => {
    const customAccess = hasCustomAccess(course.id);
    
    // Si il y a une permission spéciale, l'utiliser
    if (customAccess !== null) {
      return customAccess;
    }
    
    // Sinon, utiliser l'accès par défaut basé sur l'abonnement
    return canAccessBySubscription(currentUser!.subscription, course.level);
  };

  const getAvailableCourses = () => {
    return courses.filter(course => canAccessCourse(course));
  };

  const getLockedCourses = () => {
    return courses.filter(course => !canAccessCourse(course));
  };

  const getCoursesByCategory = (availableCourses: Course[]) => {
    const categories = [...new Set(availableCourses.map(course => course.category))];
    return categories.map(category => ({
      category,
      courses: availableCourses.filter(course => course.category === category)
    }));
  };

  const availableCourses = getAvailableCourses();
  const lockedCourses = getLockedCourses();
  const coursesByCategory = getCoursesByCategory(availableCourses);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onLogout={logout} 
        userInfo={{
          username: currentUser?.username || '',
          subscription: currentUser?.subscription || 'debutant'
        }} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-success/10 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cours disponibles</p>
                  <p className="text-2xl font-bold text-success">{availableCourses.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-success rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-secondary/10 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mon abonnement</p>
                  <p className="text-2xl font-bold">{currentUser?.subscription.charAt(0).toUpperCase() + currentUser?.subscription.slice(1)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-expert/10 border-expert/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total des cours</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-expert rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-expert-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Mes cours</span>
              <span className="sm:hidden">Cours</span>
              <span className="ml-1">({availableCourses.length})</span>
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Cours verrouillés</span>
              <span className="sm:hidden">Verrouillés</span>
              <span className="ml-1">({lockedCourses.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Cours disponibles */}
          <TabsContent value="available" className="space-y-6">
            {coursesByCategory.map(({ category, courses: categoryCourses }) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>{category}</span>
                  <Badge variant="outline">{categoryCourses.length} cours</Badge>
                </h3>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryCourses.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {course.thumbnail ? (
                          <img 
                            src={course.thumbnail} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-secondary">
                            <svg className="w-12 h-12 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a4 4 0 118 0v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <SubscriptionBadge type={course.level} />
                        </div>
                        {hasCustomAccess(course.id) && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-gradient-primary">
                              Accès spécial
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">{course.instructor}</span>
                          <Badge variant="outline">{course.duration} min</Badge>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full bg-gradient-primary hover:opacity-90 transition-all"
                              onClick={() => setSelectedCourse(course)}
                            >
                              Commencer le cours
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
                            <DialogHeader>
                              <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-base sm:text-lg">{selectedCourse?.title}</span>
                                <SubscriptionBadge type={selectedCourse?.level || 'debutant'} />
                              </DialogTitle>
                            </DialogHeader>
                            {selectedCourse && (
                              <div className="space-y-4">
                                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                  <iframe
                                    src={selectedCourse.videoUrl}
                                    title={selectedCourse.title}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allowFullScreen
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className="text-muted-foreground text-sm">{selectedCourse.description}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Instructeur:</span>
                                      <span className="text-sm font-medium text-right">{selectedCourse.instructor}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Durée:</span>
                                      <span className="text-sm font-medium">{selectedCourse.duration} min</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Catégorie:</span>
                                      <span className="text-sm font-medium text-right">{selectedCourse.category}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Niveau:</span>
                                      <SubscriptionBadge type={selectedCourse.level} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            
            {availableCourses.length === 0 && (
              <Card className="p-8 text-center">
                <CardContent>
                  <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">Aucun cours disponible</h3>
                  <p className="text-muted-foreground">Votre abonnement ne donne accès à aucun cours pour le moment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cours verrouillés */}
          <TabsContent value="locked" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {lockedCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden opacity-60 relative">
                  <div className="aspect-video bg-muted relative">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover grayscale"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-sm font-medium">Verrouillé</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <SubscriptionBadge type={course.level} />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">{course.instructor}</span>
                      <Badge variant="outline">{course.duration} min</Badge>
                    </div>
                    <Badge variant="destructive" className="w-full justify-center">
                      Abonnement {course.level.charAt(0).toUpperCase() + course.level.slice(1)} requis
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {lockedCourses.length === 0 && (
              <Card className="p-8 text-center">
                <CardContent>
                  <svg className="w-16 h-16 text-success mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">Tous les cours sont disponibles !</h3>
                  <p className="text-muted-foreground">Votre abonnement vous donne accès à tous les cours disponibles.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}