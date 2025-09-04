import { useState, useEffect } from 'react';
import { LocalStorageService } from '@/lib/localStorage';
import { User, WeeklyProgram } from '@/types/fitness';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Calendar, CheckCircle, XCircle } from 'lucide-react';

export function ProgramAssignment() {
  const [users, setUsers] = useState<User[]>([]);
  const [programs, setPrograms] = useState<WeeklyProgram[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(LocalStorageService.getUsers().filter(u => !u.isAdmin));
    setPrograms(LocalStorageService.getWeeklyPrograms());
  };

  const handleAssignProgram = () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    const programId = selectedProgramId || null;
    const success = LocalStorageService.assignProgramToUser(selectedUserId, programId);
    
    if (success) {
      loadData();
      setSelectedUserId('');
      setSelectedProgramId('');
      
      const user = users.find(u => u.id === selectedUserId);
      const program = programs.find(p => p.id === programId);
      
      if (programId) {
        toast.success(`Programme "${program?.name}" assigné à ${user?.username}`);
      } else {
        toast.success(`Programme retiré pour ${user?.username}`);
      }
    } else {
      toast.error('Erreur lors de l\'assignation du programme');
    }
  };

  const getAssignedProgram = (userId: string): WeeklyProgram | null => {
    const user = users.find(u => u.id === userId);
    if (!user?.assignedProgramId) return null;
    return programs.find(p => p.id === user.assignedProgramId) || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h2 className="text-xl font-bold">Affectation des programmes</h2>
      </div>

      {/* Formulaire d'affectation */}
      <Card>
        <CardHeader>
          <CardTitle>Assigner un programme</CardTitle>
          <CardDescription>
            Assignez un programme hebdomadaire à un utilisateur ou retirez son programme actuel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Utilisateur</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.subscription}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Programme</label>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un programme ou laisser vide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <span className="text-muted-foreground">Aucun programme (retirer)</span>
                  </SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{program.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAssignProgram} className="w-full">
            {selectedProgramId ? 'Assigner le programme' : 'Retirer le programme'}
          </Button>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs et leurs programmes */}
      <Card>
        <CardHeader>
          <CardTitle>Programmes assignés</CardTitle>
          <CardDescription>
            Vue d'ensemble des programmes assignés aux utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun utilisateur trouvé
              </p>
            ) : (
              users.map((user) => {
                const assignedProgram = getAssignedProgram(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                        <span className="text-secondary-foreground font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.subscription}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {assignedProgram ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div className="text-right">
                            <div className="font-medium text-sm">{assignedProgram.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Créé le {new Date(assignedProgram.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Aucun programme</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}