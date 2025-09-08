import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LocalStorageService } from '@/lib/localStorage';
import { supabase } from '@/integrations/supabase/client';
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
import { ImageInput } from '@/components/ui/image-input';
import { CourseAccessManagement } from '@/components/CourseAccessManagement';
import { ShopManager } from '@/components/ShopManager';
import { WeeklyProgramManager } from '@/components/WeeklyProgramManager';
import { ProgramAssignment } from '@/components/ProgramAssignment';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  
  // Etat d'édition des infos utilisateur sélectionné
  const [editUserInfo, setEditUserInfo] = useState({
    username: '',
    email: '',
    password: '',
    subscription: 'debutant' as SubscriptionType,
  });
  // Gestion du statut du compte
  const [suspensionUntil, setSuspensionUntil] = useState<string>('');
  
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

  // Hydrate le formulaire d'édition lorsque l'admin ouvre "Gérer"
  useEffect(() => {
    if (selectedUser) {
      setEditUserInfo({
        username: selectedUser.username,
        email: selectedUser.email,
        password: '', // vide = ne pas changer
        subscription: selectedUser.subscription,
      });
    }
  }, [selectedUser]);

  const loadData = async () => {
    try {
      // Charger les utilisateurs depuis Supabase
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false);

      if (profiles) {
        const formattedUsers: User[] = profiles.map(profile => ({
          id: profile.id,
          username: profile.username || profile.email,
          email: profile.email,
          password: '', // Ne pas exposer les mots de passe
          subscription: 'debutant' as SubscriptionType,
          isAdmin: false,
          accessibleCourses: [],
          createdAt: profile.created_at,
          accountStatus: 'active'
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // Fallback vers localStorage
      setUsers(LocalStorageService.getUsers());
    }
    
    setCourses(LocalStorageService.getCourses());
  };

  const handleCreateUser = async (e: React.FormEvent) => {
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

    try {
      // Utiliser la fonction Edge pour créer l'utilisateur sans connexion automatique
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          username: newUser.username
        }
      });

      if (error || data.error) {
        toast.error(`Erreur lors de la création: ${data?.error || error.message}`);
        return;
      }

      toast.success('Utilisateur créé avec succès! Il peut maintenant se connecter.');
      
      loadData();
      setNewUser({ username: '', password: '', email: '', subscription: 'debutant' });
      setShowCreateUser(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
    }
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
    if (userId === user?.id) {
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
        onLogout={signOut} 
        userInfo={{
          username: user?.email || '',
          subscription: 'Admin'
        }} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 gap-1">
            <TabsTrigger value="users" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Utilisateurs</span>
              <span className="sm:hidden">Users</span>
              <span className="ml-1">({users.filter(u => !u.isAdmin).length})</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Cours</span>
              <span className="sm:hidden">Cours</span>
              <span className="ml-1">({courses.length})</span>
            </TabsTrigger>
            <TabsTrigger value="programs" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Programmes</span>
              <span className="sm:hidden">Prog</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Affectations</span>
              <span className="sm:hidden">Affect</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Permissions</span>
              <span className="sm:hidden">Perms</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Gestion Abonnements</span>
              <span className="sm:hidden">Abos</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Boutique</span>
              <span className="sm:hidden">Shop</span>
            </TabsTrigger>
          </TabsList>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Gestion des utilisateurs</h2>
              <Button onClick={() => setShowCreateUser(!showCreateUser)} className="bg-gradient-primary w-full sm:w-auto">
                <span className="sm:hidden">{showCreateUser ? 'Annuler' : 'Créer'}</span>
                <span className="hidden sm:inline">{showCreateUser ? 'Annuler' : 'Créer un utilisateur'}</span>
              </Button>
            </div>

            {showCreateUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Créer un nouvel utilisateur</CardTitle>
                  <CardDescription>Ajoutez un nouveau client à la salle de sport</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="sm:col-span-2 lg:col-span-4">
                      <Button type="submit" className="bg-gradient-primary w-full">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-secondary-foreground font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">{user.username}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <SubscriptionBadge type={user.subscription} />
                            {user.accountStatus !== 'active' && (
                              <Badge variant="destructive" className="text-xs">
                                {user.accountStatus === 'disabled' && 'Compte désactivé'}
                                {user.accountStatus === 'cancelled' && 'Abonnement annulé'}
                                {user.accountStatus === 'suspended' && `Suspendu jusqu'au ${user.suspendedUntil ? new Date(user.suspendedUntil).toLocaleDateString() : ''}`}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                          className="flex-1 sm:flex-none"
                        >
                          {selectedUser?.id === user.id ? 'Fermer' : 'Gérer'}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <span className="sm:hidden">Suppr.</span>
                          <span className="hidden sm:inline">Supprimer</span>
                        </Button>
                      </div>
                      </div>
                      
                        {selectedUser?.id === user.id && (
                          <div className="mt-6 pt-6 border-t border-border space-y-6">
                            {/* Informations de l'utilisateur */}
                            <div>
                              <h4 className="font-semibold mb-4">Informations de l'utilisateur</h4>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-username-${user.id}`}>Nom d'utilisateur</Label>
                                  <Input
                                    id={`edit-username-${user.id}`}
                                    value={editUserInfo.username}
                                    onChange={(e) => setEditUserInfo({ ...editUserInfo, username: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                                  <Input
                                    id={`edit-email-${user.id}`}
                                    type="email"
                                    value={editUserInfo.email}
                                    onChange={(e) => setEditUserInfo({ ...editUserInfo, email: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-password-${user.id}`}>Nouveau mot de passe</Label>
                                  <Input
                                    id={`edit-password-${user.id}`}
                                    type="password"
                                    placeholder="Laisser vide pour conserver"
                                    value={editUserInfo.password}
                                    onChange={(e) => setEditUserInfo({ ...editUserInfo, password: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-subscription-${user.id}`}>Abonnement</Label>
                                  <Select
                                    value={editUserInfo.subscription}
                                    onValueChange={(value: SubscriptionType) =>
                                      setEditUserInfo({ ...editUserInfo, subscription: value })
                                    }
                                  >
                                    <SelectTrigger id={`edit-subscription-${user.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="debutant">Débutant</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="sm:col-span-2 lg:col-span-4">
                                  <Button
                                    className="w-full bg-gradient-primary"
                                    onClick={() => {
                                      if (!editUserInfo.username || !editUserInfo.email) {
                                        toast.error('Nom et email sont requis');
                                        return;
                                      }
                                      const otherUsers = users.filter((u) => u.id !== user.id);
                                      const conflict = otherUsers.find(
                                        (u) => u.username === editUserInfo.username || u.email === editUserInfo.email
                                      );
                                      if (conflict) {
                                        toast.error("Nom d’utilisateur ou email déjà utilisés");
                                        return;
                                      }
                                      const updatedUser: User = {
                                        ...user,
                                        username: editUserInfo.username,
                                        email: editUserInfo.email,
                                        subscription: editUserInfo.subscription as SubscriptionType,
                                        password: editUserInfo.password ? editUserInfo.password : user.password,
                                      };
                                      LocalStorageService.updateUser(updatedUser);
                                      loadData();
                                      toast.success('Informations mises à jour');
                                    }}
                                  >
                                    Mettre à jour les informations
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {/* Statut du compte */}
                          <div>
                            <h4 className="font-semibold mb-4">Statut du compte</h4>
                            <div className="grid gap-3 sm:grid-cols-2 items-end">
                              <div className="space-y-2">
                                <Label>Date de fin de suspension</Label>
                                <Input
                                  type="date"
                                  value={suspensionUntil}
                                  onChange={(e) => setSuspensionUntil(e.target.value)}
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    if (!suspensionUntil) { toast.error('Sélectionnez une date'); return; }
                                    LocalStorageService.suspendUserAccount(user.id, suspensionUntil, 'admin_action');
                                    loadData();
                                    toast.success('Compte suspendu');
                                  }}
                                >
                                  Suspendre jusqu’à la date
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => { LocalStorageService.disableUserAccount(user.id, 'admin_action'); loadData(); toast.success('Compte désactivé'); }}
                                >
                                  Désactiver
                                </Button>
                                <Button
                                  onClick={() => { LocalStorageService.reactivateUserAccount(user.id); loadData(); toast.success('Compte réactivé'); }}
                                >
                                  Réactiver
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Accès aux cours */}
                          <div>
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
          </TabsContent>

          {/* Gestion des cours */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Gestion des cours</h2>
              <Button onClick={() => setShowCreateCourse(!showCreateCourse)} className="bg-gradient-primary w-full sm:w-auto">
                <span className="sm:hidden">{showCreateCourse ? 'Annuler' : 'Créer'}</span>
                <span className="hidden sm:inline">{showCreateCourse ? 'Annuler' : 'Créer un cours'}</span>
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
                    <ImageInput
                      value={newCourse.thumbnail}
                      onChange={(value) => setNewCourse({...newCourse, thumbnail: value})}
                      label="Image du cours"
                      placeholder="https://exemple.com/image.jpg"
                    />
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
                    <ImageInput
                      value={editingCourse.thumbnail || ''}
                      onChange={(value) => setEditingCourse({...editingCourse, thumbnail: value})}
                      label="Image du cours"
                      placeholder="https://exemple.com/image.jpg"
                    />
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

          {/* Programmes par semaine */}
          <TabsContent value="programs" className="space-y-6">
            <WeeklyProgramManager />
          </TabsContent>

          {/* Affectation des programmes */}
          <TabsContent value="assignments" className="space-y-6">
            <ProgramAssignment />
          </TabsContent>

          {/* Permissions granulaires */}
          <TabsContent value="permissions" className="space-y-6">
            <CourseAccessManagement users={users} courses={courses} />
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

          {/* Boutique */}
          <TabsContent value="shop" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Boutique</CardTitle>
                <CardDescription>Créer et gérer vos produits (simulation locale)</CardDescription>
              </CardHeader>
              <CardContent>
                <ShopManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}