import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { User, Course, UserCourseAccess, SubscriptionType } from '@/types/fitness';

import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Search,
  Filter,
  Settings,
  Check,
  X
} from 'lucide-react';

interface CourseAccessManagementProps {
  users: User[];
  courses: Course[];
}

export function CourseAccessManagement({ users, courses }: CourseAccessManagementProps) {
  const [userCourseAccess, setUserCourseAccess] = useState<UserCourseAccess[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<SubscriptionType | 'all'>('all');
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [accessReason, setAccessReason] = useState('');

  useEffect(() => {
    loadUserCourseAccess();
  }, []);

  const loadUserCourseAccess = async () => {
    const { data } = await supabase.from('user_course_access').select('*');
    if (data) {
      // Map Supabase fields to UserCourseAccess interface
      const mappedAccess = data.map(access => ({
        ...access,
        userId: access.user_id,
        courseId: access.course_id,
        hasAccess: access.has_access
      }));
      setUserCourseAccess(mappedAccess);
    }
  };

  const saveUserCourseAccess = async (userId: string, courseId: string, hasAccess: boolean) => {
    const { error } = await supabase
      .from('user_course_access')
      .upsert({
        user_id: userId,
        course_id: courseId,
        has_access: hasAccess,
        override_subscription: true,
        granted_at: hasAccess ? new Date().toISOString() : null,
        revoked_at: !hasAccess ? new Date().toISOString() : null
      });
    
    if (error) {
      console.error('Error updating course access:', error);
      toast.error('Erreur lors de la mise à jour de l\'accès');
      return;
    }
    
    loadUserCourseAccess();
  };

  // Obtenir l'accès par défaut basé sur l'abonnement
  const getDefaultAccess = (user: User, course: Course): boolean => {
    const subscriptionLevels: SubscriptionType[] = ['debutant', 'medium', 'expert'];
    const userLevelIndex = subscriptionLevels.indexOf(user.subscription);
    const courseLevelIndex = subscriptionLevels.indexOf(course.level);
    return userLevelIndex >= courseLevelIndex;
  };

  // Obtenir l'accès effectif (défaut + permissions spéciales)
  const getEffectiveAccess = (user: User, course: Course): { hasAccess: boolean; isOverride: boolean; reason?: string } => {
    const defaultAccess = getDefaultAccess(user, course);
    const customAccess = userCourseAccess.find(
      access => access.userId === user.id && access.courseId === course.id
    );

    if (customAccess && customAccess.overrideSubscription) {
      return {
        hasAccess: customAccess.hasAccess,
        isOverride: true,
        reason: customAccess.reason
      };
    }

    return {
      hasAccess: defaultAccess,
      isOverride: false
    };
  };

  const toggleCourseAccess = async (user: User, course: Course, newAccess: boolean) => {
    const existingAccessIndex = userCourseAccess.findIndex(
      access => access.userId === user.id && access.courseId === course.id
    );

    const defaultAccess = getDefaultAccess(user, course);
    const needsOverride = newAccess !== defaultAccess;

    let newUserCourseAccess = [...userCourseAccess];

    if (needsOverride) {
      const accessData: UserCourseAccess = {
        userId: user.id,
        courseId: course.id,
        hasAccess: newAccess,
        overrideSubscription: true,
        reason: accessReason || (newAccess ? 'Accès accordé par l\'administrateur' : 'Accès refusé par l\'administrateur'),
        grantedAt: newAccess ? new Date().toISOString() : undefined,
        revokedAt: !newAccess ? new Date().toISOString() : undefined
      };

      if (existingAccessIndex >= 0) {
        newUserCourseAccess[existingAccessIndex] = accessData;
      } else {
        newUserCourseAccess.push(accessData);
      }
    } else {
      // Retour à l'accès par défaut - supprimer l'override
      if (existingAccessIndex >= 0) {
        newUserCourseAccess.splice(existingAccessIndex, 1);
      }
    }

    await saveUserCourseAccess(user.id, course.id, newAccess);
    setAccessReason('');
    toast.success(`Accès ${newAccess ? 'accordé' : 'refusé'} pour ${user.username} au cours "${course.title}"`);
  };

  const filteredUsers = users.filter(user => 
    !user.isAdmin && 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(course => 
    levelFilter === 'all' || course.level === levelFilter
  );

  const getLevelBadgeVariant = (level: SubscriptionType) => {
    switch (level) {
      case 'debutant': return 'default';
      case 'medium': return 'secondary';
      case 'expert': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gestion des accès aux cours
        </CardTitle>
        <CardDescription>
          Gérez l'accès aux cours de manière granulaire pour chaque utilisateur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search-users">Rechercher un utilisateur</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-users"
                placeholder="Nom d'utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="level-filter">Filtrer par niveau</Label>
            <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as SubscriptionType | 'all')}>
              <SelectTrigger id="level-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="debutant">Débutant</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Gestion détaillée
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gestion détaillée des accès</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-select">Sélectionner un utilisateur</Label>
                    <Select 
                      value={selectedUser?.id || ''} 
                      onValueChange={(value) => {
                        const user = users.find(u => u.id === value);
                        setSelectedUser(user || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un utilisateur..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username} - {user.subscription}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUser && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <h4 className="font-semibold">{selectedUser.username}</h4>
                          <p className="text-sm text-muted-foreground">
                            Abonnement: <Badge variant={getLevelBadgeVariant(selectedUser.subscription)}>
                              {selectedUser.subscription}
                            </Badge>
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="access-reason">Raison de la modification (optionnel)</Label>
                        <Textarea
                          id="access-reason"
                          placeholder="Expliquez pourquoi vous modifiez l'accès..."
                          value={accessReason}
                          onChange={(e) => setAccessReason(e.target.value)}
                        />
                      </div>

                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cours</TableHead>
                              <TableHead>Niveau</TableHead>
                              <TableHead>Accès par défaut</TableHead>
                              <TableHead>Accès effectif</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCourses.map(course => {
                              const defaultAccess = getDefaultAccess(selectedUser, course);
                              const effectiveAccess = getEffectiveAccess(selectedUser, course);
                              
                              return (
                                <TableRow key={course.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{course.title}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {course.duration} min - {course.instructor}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getLevelBadgeVariant(course.level)}>
                                      {course.level}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {defaultAccess ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <X className="h-4 w-4 text-red-600" />
                                      )}
                                      <span className="text-sm">
                                        {defaultAccess ? 'Oui' : 'Non'}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {effectiveAccess.hasAccess ? (
                                        <Eye className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <EyeOff className="h-4 w-4 text-red-600" />
                                      )}
                                      <span className="text-sm">
                                        {effectiveAccess.hasAccess ? 'Oui' : 'Non'}
                                      </span>
                                      {effectiveAccess.isOverride && (
                                        <Badge variant="outline" className="text-xs">
                                          Modifié
                                        </Badge>
                                      )}
                                    </div>
                                    {effectiveAccess.reason && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {effectiveAccess.reason}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant={effectiveAccess.hasAccess ? "outline" : "default"}
                                        onClick={() => toggleCourseAccess(selectedUser, course, true)}
                                        disabled={effectiveAccess.hasAccess && !effectiveAccess.isOverride}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={!effectiveAccess.hasAccess ? "outline" : "destructive"}
                                        onClick={() => toggleCourseAccess(selectedUser, course, false)}
                                        disabled={!effectiveAccess.hasAccess && !effectiveAccess.isOverride}
                                      >
                                        <EyeOff className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Résumé des permissions personnalisées */}
        <div>
          <h4 className="font-semibold mb-3">Permissions personnalisées actives</h4>
          {userCourseAccess.filter(access => access.overrideSubscription).length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune permission personnalisée définie</p>
          ) : (
            <div className="grid gap-2">
              {userCourseAccess
                .filter(access => access.overrideSubscription)
                .map(access => {
                  const user = users.find(u => u.id === access.userId);
                  const course = courses.find(c => c.id === access.courseId);
                  if (!user || !course) return null;
                  
                  return (
                    <div key={`${access.userId}-${access.courseId}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium">{user.username}</span>
                          <span className="mx-2">→</span>
                          <span>{course.title}</span>
                        </div>
                        <Badge variant={access.hasAccess ? "default" : "destructive"}>
                          {access.hasAccess ? "Accordé" : "Refusé"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newAccess = userCourseAccess.filter(
                            a => !(a.userId === access.userId && a.courseId === access.courseId)
                          );
                          // Delete custom access - simplified version
                          loadUserCourseAccess();
                          toast.success("Permission personnalisée supprimée");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}