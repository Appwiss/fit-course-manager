import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LocalStorageService } from '@/lib/localStorage';
import { User, Course, SubscriptionType } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SubscriptionBadge } from '@/components/ui/subscription-badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Formulaire nouvel utilisateur
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    subscription: 'debutant' as SubscriptionType
  });

  // Formulaire nouveau cours
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    videoUrl: '',
    level: 'debutant' as SubscriptionType,
    category: '',
    duration: 30,
    instructor: '',
    thumbnail: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(LocalStorageService.getUsers());
    setCourses(LocalStorageService.getCourses());
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.password || !newUser.email) {
      toast.error('Tous les champs sont requis');
      return;
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find(u => u.username === newUser.username || u.email === newUser.email);
    if (existingUser) {
      toast.error('Un utilisateur avec ce nom ou email existe déjà');
      return;
    }

    const user: User = {
      id: `user-${Date.now()}`,
      username: newUser.username,
      password: newUser.password,
      email: newUser.email,
      subscription: newUser.subscription,
      isAdmin: false,
      accessibleCourses: [],
      createdAt: new Date().toISOString()
    };

    LocalStorageService.addUser(user);
    loadData();
    setNewUser({ username: '', password: '', email: '', subscription: 'debutant' });
    toast.success('Utilisateur créé avec succès');
  };

  const handleToggleCourseAccess = (userId: string, courseId: string, hasAccess: boolean) => {
    if (hasAccess) {
      LocalStorageService.revokeCourseAccess(userId, courseId);
      toast.success('Accès révoqué');
    } else {
      LocalStorageService.grantCourseAccess(userId, courseId);
      toast.success('Accès accordé');
    }
    loadData();
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    
    LocalStorageService.deleteUser(userId);
    loadData();
    toast.success('Utilisateur supprimé');
  };

  const getUserCourseAccess = (userId: string, courseId: string) => {
    return LocalStorageService.hasAccessToCourse(userId, courseId);
  };

  const canAccessBySubscription = (userSubscription: SubscriptionType, courseLevel: SubscriptionType) => {
    const levels = { debutant: 1, medium: 2, expert: 3 };
    return levels[userSubscription] >= levels[courseLevel];
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCourse.title || !newCourse.description || !newCourse.videoUrl || !newCourse.category || !newCourse.instructor) {
      toast.error('Tous les champs obligatoires doivent être remplis');
      return;
    }

    const course: Course = {
      id: `course-${Date.now()}`,
      title: newCourse.title,
      description: newCourse.description,
      videoUrl: newCourse.videoUrl,
      level: newCourse.level,
      category: newCourse.category,
      duration: newCourse.duration,
      instructor: newCourse.instructor,
      thumbnail: newCourse.thumbnail || undefined
    };

    const courses = LocalStorageService.getCourses();
    courses.push(course);
    LocalStorageService.saveCourses(courses);
    loadData();
    setNewCourse({
      title: '',
      description: '',
      videoUrl: '',
      level: 'debutant',
      category: '',
      duration: 30,
      instructor: '',
      thumbnail: ''
    });
    toast.success('Cours créé avec succès');
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCourse) return;

    const courses = LocalStorageService.getCourses();
    const index = courses.findIndex(c => c.id === editingCourse.id);
    if (index !== -1) {
      courses[index] = editingCourse;
      LocalStorageService.saveCourses(courses);
      loadData();
      setEditingCourse(null);
      toast.success('Cours modifié avec succès');
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    const courses = LocalStorageService.getCourses().filter(c => c.id !== courseId);
    LocalStorageService.saveCourses(courses);
    loadData();
    toast.success('Cours supprimé');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Bienvenue, {currentUser?.username}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline">
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Utilisateurs ({users.filter(u => !u.isAdmin).length})</TabsTrigger>
            <TabsTrigger value="courses">Cours ({courses.length})</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer un nouvel utilisateur</CardTitle>
                <CardDescription>Ajoutez un nouveau client à la salle de sport</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="johndoe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="john@exemple.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="********"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscription">Abonnement</Label>
                    <Select value={newUser.subscription} onValueChange={(value: SubscriptionType) => setNewUser({...newUser, subscription: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debutant">Débutant</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <Button type="submit" className="bg-gradient-primary">
                      Créer l'utilisateur
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Liste des utilisateurs */}
            <div className="grid gap-4">
              {users.filter(u => !u.isAdmin).map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <span className="text-secondary-foreground font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.username}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <SubscriptionBadge type={user.subscription} />
                            <Badge variant="outline">{new Date(user.createdAt).toLocaleDateString()}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        >
                          {selectedUser?.id === user.id ? 'Fermer' : 'Gérer'}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    
                    {selectedUser?.id === user.id && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <h4 className="font-semibold mb-4">Accès aux cours</h4>
                        <div className="grid gap-3">
                          {courses.map((course) => {
                            const hasAccess = getUserCourseAccess(user.id, course.id);
                            const canAccessByLevel = canAccessBySubscription(user.subscription, course.level);
                            
                            return (
                              <div key={course.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <SubscriptionBadge type={course.level} />
                                  <div>
                                    <p className="font-medium">{course.title}</p>
                                    <p className="text-sm text-muted-foreground">{course.category} • {course.duration}min</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  {canAccessByLevel && (
                                    <Badge variant="outline" className="text-success">
                                      Accès par abonnement
                                    </Badge>
                                  )}
                                  <Switch
                                    checked={hasAccess}
                                    onCheckedChange={() => handleToggleCourseAccess(user.id, course.id, hasAccess)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gestion des cours */}
          <TabsContent value="courses" className="space-y-6">
            {/* Formulaire création cours */}
            <Card>
              <CardHeader>
                <CardTitle>Créer un nouveau cours</CardTitle>
                <CardDescription>Ajoutez un nouveau cours à votre salle de sport</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-title">Titre du cours*</Label>
                    <Input
                      id="course-title"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      placeholder="Nom du cours"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-category">Catégorie*</Label>
                    <Input
                      id="course-category"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                      placeholder="Cardio, Musculation, Yoga..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-instructor">Instructeur*</Label>
                    <Input
                      id="course-instructor"
                      value={newCourse.instructor}
                      onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                      placeholder="Nom de l'instructeur"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-duration">Durée (minutes)</Label>
                    <Input
                      id="course-duration"
                      type="number"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: parseInt(e.target.value) || 30})}
                      min="5"
                      max="180"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-level">Niveau requis</Label>
                    <Select value={newCourse.level} onValueChange={(value: SubscriptionType) => setNewCourse({...newCourse, level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debutant">Débutant</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-thumbnail">Image (URL)</Label>
                    <Input
                      id="course-thumbnail"
                      value={newCourse.thumbnail}
                      onChange={(e) => setNewCourse({...newCourse, thumbnail: e.target.value})}
                      placeholder="https://exemple.com/image.jpg"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="course-description">Description*</Label>
                    <Input
                      id="course-description"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                      placeholder="Description du cours..."
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="course-video">URL de la vidéo*</Label>
                    <Input
                      id="course-video"
                      value={newCourse.videoUrl}
                      onChange={(e) => setNewCourse({...newCourse, videoUrl: e.target.value})}
                      placeholder="https://youtube.com/embed/..."
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="bg-gradient-primary">
                      Créer le cours
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Formulaire modification cours */}
            {editingCourse && (
              <Card>
                <CardHeader>
                  <CardTitle>Modifier le cours</CardTitle>
                  <CardDescription>Modifiez les informations du cours sélectionné</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Titre du cours</Label>
                      <Input
                        id="edit-title"
                        value={editingCourse.title}
                        onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Catégorie</Label>
                      <Input
                        id="edit-category"
                        value={editingCourse.category}
                        onChange={(e) => setEditingCourse({...editingCourse, category: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-instructor">Instructeur</Label>
                      <Input
                        id="edit-instructor"
                        value={editingCourse.instructor}
                        onChange={(e) => setEditingCourse({...editingCourse, instructor: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-duration">Durée (minutes)</Label>
                      <Input
                        id="edit-duration"
                        type="number"
                        value={editingCourse.duration}
                        onChange={(e) => setEditingCourse({...editingCourse, duration: parseInt(e.target.value) || 30})}
                        min="5"
                        max="180"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-level">Niveau requis</Label>
                      <Select value={editingCourse.level} onValueChange={(value: SubscriptionType) => setEditingCourse({...editingCourse, level: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debutant">Débutant</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-thumbnail">Image (URL)</Label>
                      <Input
                        id="edit-thumbnail"
                        value={editingCourse.thumbnail || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, thumbnail: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        value={editingCourse.description}
                        onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="edit-video">URL de la vidéo</Label>
                      <Input
                        id="edit-video"
                        value={editingCourse.videoUrl}
                        onChange={(e) => setEditingCourse({...editingCourse, videoUrl: e.target.value})}
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex space-x-2">
                      <Button type="submit" className="bg-gradient-primary">
                        Sauvegarder
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Liste des cours */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
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
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">{course.instructor}</span>
                      <Badge variant="outline">{course.duration} min</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingCourse(course)}
                        className="flex-1"
                      >
                        Modifier
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id)}
                        className="flex-1"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Permissions */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Matrice des permissions</CardTitle>
                <CardDescription>Vue d'ensemble des accès aux cours par utilisateur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Utilisateur</th>
                        {courses.map((course) => (
                          <th key={course.id} className="text-center p-2 min-w-[120px]">
                            <div className="space-y-1">
                              <div className="font-medium text-xs">{course.title}</div>
                              <SubscriptionBadge type={course.level} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => !u.isAdmin).map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/20">
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{user.username}</span>
                              <SubscriptionBadge type={user.subscription} />
                            </div>
                          </td>
                          {courses.map((course) => {
                            const hasAccess = getUserCourseAccess(user.id, course.id);
                            const canAccessByLevel = canAccessBySubscription(user.subscription, course.level);
                            
                            return (
                              <td key={course.id} className="p-2 text-center">
                                <div className="space-y-1">
                                  <Switch
                                    checked={hasAccess}
                                    onCheckedChange={() => handleToggleCourseAccess(user.id, course.id, hasAccess)}
                                  />
                                  {canAccessByLevel && (
                                    <div className="text-xs text-success">Auto</div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}