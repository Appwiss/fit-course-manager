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
import { Header } from '@/components/ui/header';
import { SubscriptionManagementAdmin } from '@/components/SubscriptionManagementAdmin';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoInputType, setVideoInputType] = useState<'url' | 'file'>('url');

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
      createdAt: new Date().toISOString(),
      accountStatus: 'active'
    };

    LocalStorageService.addUser(user);
    loadData();
    setNewUser({ username: '', password: '', email: '', subscription: 'debutant' });
    setShowCreateUser(false);
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

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Créer une URL locale pour le fichier
      const videoUrl = URL.createObjectURL(file);
      setNewCourse({...newCourse, videoUrl});
    }
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
    setVideoFile(null);
    setVideoInputType('url');
    setShowCreateCourse(false);
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
      <Header 
        onLogout={logout} 
        userInfo={{
          username: currentUser?.username || '',
          subscription: 'Admin'
        }} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Utilisateurs ({users.filter(u => !u.isAdmin).length})</TabsTrigger>
            <TabsTrigger value="courses">Cours ({courses.length})</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="subscriptions">Gestion Abonnements</TabsTrigger>
          </TabsList>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
              <Button onClick={() => setShowCreateUser(!showCreateUser)} className="bg-gradient-primary">
                {showCreateUser ? 'Annuler' : 'Créer un utilisateur'}
              </Button>
            </div>

            {showCreateUser && (
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
            )}

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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des cours</h2>
              <Button onClick={() => setShowCreateCourse(!showCreateCourse)} className="bg-gradient-primary">
                {showCreateCourse ? 'Annuler' : 'Créer un cours'}
              </Button>
            </div>

            {showCreateCourse && (
              <Card>
                <CardHeader>
                  <CardTitle>Créer un nouveau cours</CardTitle>
                  <CardDescription>Ajoutez un nouveau cours à votre salle de sport (un cours = un niveau + une catégorie)</CardDescription>
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
                      <Label htmlFor="course-level">Niveau requis*</Label>
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
                        placeholder="Description du cours"
                        required
                      />
                    </div>

                    {/* Section vidéo */}
                    <div className="md:col-span-2 space-y-4">
                      <Label>Type de vidéo*</Label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="videoType"
                            value="url"
                            checked={videoInputType === 'url'}
                            onChange={() => setVideoInputType('url')}
                            className="text-primary"
                          />
                          <span>Lien URL</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="videoType"
                            value="file"
                            checked={videoInputType === 'file'}
                            onChange={() => setVideoInputType('file')}
                            className="text-primary"
                          />
                          <span>Fichier local</span>
                        </label>
                      </div>

                      {videoInputType === 'url' ? (
                        <div className="space-y-2">
                          <Label htmlFor="course-video-url">URL de la vidéo*</Label>
                          <Input
                            id="course-video-url"
                            value={newCourse.videoUrl}
                            onChange={(e) => setNewCourse({...newCourse, videoUrl: e.target.value})}
                            placeholder="https://youtube.com/watch?v=..."
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="course-video-file">Fichier vidéo*</Label>
                          <Input
                            id="course-video-file"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            required
                          />
                          {videoFile && (
                            <p className="text-sm text-muted-foreground">
                              Fichier sélectionné: {videoFile.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Button type="submit" className="bg-gradient-primary">
                        Créer le cours
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

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
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-2">
                        <Label>Type de vidéo*</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="edit-video-url"
                              name="editVideoType"
                              checked={videoInputType === 'url'}
                              onChange={() => setVideoInputType('url')}
                            />
                            <Label htmlFor="edit-video-url">Lien URL</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="edit-video-file"
                              name="editVideoType"
                              checked={videoInputType === 'file'}
                              onChange={() => setVideoInputType('file')}
                            />
                            <Label htmlFor="edit-video-file">Fichier PC</Label>
                          </div>
                        </div>
                      </div>
                      
                      {videoInputType === 'url' ? (
                        <div className="space-y-2">
                          <Label htmlFor="edit-video">URL de la vidéo*</Label>
                          <Input
                            id="edit-video"
                            value={editingCourse.videoUrl}
                            onChange={(e) => setEditingCourse({...editingCourse, videoUrl: e.target.value})}
                            placeholder="https://youtube.com/embed/... ou https://vimeo.com/..."
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="edit-video-file">Nouveau fichier vidéo</Label>
                          <Input
                            id="edit-video-file"
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const videoUrl = URL.createObjectURL(file);
                                setEditingCourse({...editingCourse, videoUrl});
                              }
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Laissez vide pour garder la vidéo actuelle
                          </p>
                        </div>
                      )}
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
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Matrice des permissions fluide</CardTitle>
                  <CardDescription>Gestion des accès par utilisateur - Niveau autorisé et catégories correspondantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {users.filter(u => !u.isAdmin).map((user) => {
                      // Organiser les cours par catégorie
                      const coursesByCategory = courses.reduce((acc, course) => {
                        if (!acc[course.category]) {
                          acc[course.category] = [];
                        }
                        acc[course.category].push(course);
                        return acc;
                      }, {} as Record<string, Course[]>);

                      return (
                        <Card key={user.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                                  <span className="text-secondary-foreground font-semibold text-sm">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{user.username}</h3>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="mb-2">
                                  <Label className="text-sm font-medium">Niveau autorisé:</Label>
                                  <div className="mt-1">
                                    <SubscriptionBadge type={user.subscription} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-medium text-muted-foreground">Catégories et cours autorisés:</h4>
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
                                  <Card key={category} className="border border-border/50">
                                    <CardContent className="p-4">
                                      <h5 className="font-semibold mb-3 text-primary">{category}</h5>
                                      <div className="space-y-2">
                                        {categoryCourses.map((course) => {
                                          const hasAccess = getUserCourseAccess(user.id, course.id);
                                          const canAccessByLevel = canAccessBySubscription(user.subscription, course.level);
                                          
                                          return (
                                            <div key={course.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                              <div className="flex items-center space-x-2">
                                                <SubscriptionBadge type={course.level} />
                                                <div>
                                                  <p className="font-medium text-sm">{course.title}</p>
                                                  <p className="text-xs text-muted-foreground">{course.duration}min</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                {canAccessByLevel && (
                                                  <Badge variant="outline" className="text-xs text-success bg-success/10">
                                                    Auto
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
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Abonnements */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Abonnements</CardTitle>
                <CardDescription>
                  Gérez les plans d'abonnement et les paiements (simulation locale)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionManagementAdmin />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}