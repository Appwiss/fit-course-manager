import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Users, CreditCard, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { LocalStorageService } from "@/lib/localStorage";
import { SubscriptionPlan, User, UserSubscription, PaymentInterval, SubscriptionType } from "@/types/fitness";
import { useToast } from "@/hooks/use-toast";

export function SubscriptionManagementAdmin() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [kpi, setKpi] = useState<any>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showAssignUser, setShowAssignUser] = useState(false);
  const { toast } = useToast();

  // États pour création de plan
  const [newPlan, setNewPlan] = useState({
    name: '',
    level: 'debutant' as SubscriptionType,
    monthlyPrice: '',
    annualPrice: '',
    features: ['']
  });

  // États pour assignation utilisateur
  const [assignForm, setAssignForm] = useState({
    userId: '',
    planId: '',
    interval: 'mensuel' as PaymentInterval,
    appAccess: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPlans(LocalStorageService.getSubscriptionPlans());
    setUsers(LocalStorageService.getUsers().filter(u => !u.isAdmin));
    setSubscriptions(LocalStorageService.getUserSubscriptions());
    setKpi(LocalStorageService.getAccountsKPI());
  };

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.monthlyPrice || !newPlan.annualPrice) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const plan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: newPlan.name,
      level: newPlan.level,
      monthlyPrice: parseFloat(newPlan.monthlyPrice),
      annualPrice: parseFloat(newPlan.annualPrice),
      features: newPlan.features.filter(f => f.trim() !== ''),
      appAccess: false
    };

    LocalStorageService.addSubscriptionPlan(plan);
    setNewPlan({ name: '', level: 'debutant', monthlyPrice: '', annualPrice: '', features: [''] });
    setShowCreatePlan(false);
    loadData();

    toast({
      title: "Plan créé",
      description: "Le plan d'abonnement a été créé avec succès"
    });
  };

  const handleAssignUser = () => {
    if (!assignForm.userId || !assignForm.planId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur et un plan",
        variant: "destructive"
      });
      return;
    }

    const success = LocalStorageService.assignUserToSubscription(
      assignForm.userId,
      assignForm.planId,
      assignForm.interval,
      assignForm.appAccess
    );

    if (success) {
      setAssignForm({ userId: '', planId: '', interval: 'mensuel', appAccess: false });
      setShowAssignUser(false);
      loadData();

      toast({
        title: "Abonnement assigné",
        description: "L'utilisateur a été assigné au plan avec succès"
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner l'abonnement",
        variant: "destructive"
      });
    }
  };

  const handleSetOverdue = (userId: string) => {
    LocalStorageService.setSubscriptionOverdue(userId);
    loadData();
    toast({
      title: "Compte mis en retard",
      description: "Le compte utilisateur a été désactivé pour retard de paiement"
    });
  };

  const handleCancelUser = (userId: string) => {
    LocalStorageService.cancelUserAccount(userId);
    loadData();
    toast({
      title: "Compte annulé",
      description: "Le compte utilisateur a été annulé",
      variant: "destructive"
    });
  };

  const handleReactivateUser = (userId: string) => {
    LocalStorageService.reactivateUserAccount(userId);
    loadData();
    toast({
      title: "Compte réactivé",
      description: "Le compte utilisateur a été réactivé"
    });
  };

  const addFeature = () => {
    setNewPlan({ ...newPlan, features: [...newPlan.features, ''] });
  };

  const updateFeature = (index: number, value: string) => {
    const features = [...newPlan.features];
    features[index] = value;
    setNewPlan({ ...newPlan, features });
  };

  const removeFeature = (index: number) => {
    const features = newPlan.features.filter((_, i) => i !== index);
    setNewPlan({ ...newPlan, features });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Désactivé</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion des Abonnements</h2>
        <p className="text-muted-foreground">Gérer les plans d'abonnement et les utilisateurs</p>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comptes Actifs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{kpi.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retards de Paiement</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{kpi.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comptes Annulés</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{kpi.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Plans d'Abonnement</TabsTrigger>
          <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
          <TabsTrigger value="overdue">Retards de Paiement</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Plans d'Abonnement</CardTitle>
                  <CardDescription>Gérer les plans disponibles</CardDescription>
                </div>
                <Button onClick={() => setShowCreatePlan(!showCreatePlan)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showCreatePlan && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Nouveau Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plan-name">Nom du Plan</Label>
                        <Input
                          id="plan-name"
                          value={newPlan.name}
                          onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Niveau</Label>
                        <Select value={newPlan.level} onValueChange={(value) => setNewPlan({ ...newPlan, level: value as SubscriptionType })}>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthly-price">Prix Mensuel (€)</Label>
                        <Input
                          id="monthly-price"
                          type="number"
                          value={newPlan.monthlyPrice}
                          onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="annual-price">Prix Annuel (€)</Label>
                        <Input
                          id="annual-price"
                          type="number"
                          value={newPlan.annualPrice}
                          onChange={(e) => setNewPlan({ ...newPlan, annualPrice: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Fonctionnalités</Label>
                      {newPlan.features.map((feature, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder="Fonctionnalité"
                          />
                          <Button variant="outline" size="sm" onClick={() => removeFeature(index)}>
                            Supprimer
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addFeature} className="mt-2">
                        Ajouter une fonctionnalité
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreatePlan}>Créer le Plan</Button>
                      <Button variant="outline" onClick={() => setShowCreatePlan(false)}>Annuler</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>Niveau: {plan.level}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{plan.monthlyPrice}€/mois</p>
                      <p className="text-lg text-muted-foreground">{plan.annualPrice}€/an</p>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-sm">• {feature}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestion des Utilisateurs</CardTitle>
                  <CardDescription>Assigner des abonnements aux utilisateurs</CardDescription>
                </div>
                <Button onClick={() => setShowAssignUser(!showAssignUser)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Assigner un Abonnement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAssignUser && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Assigner un Abonnement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Utilisateur</Label>
                        <Select value={assignForm.userId} onValueChange={(value) => setAssignForm({ ...assignForm, userId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un utilisateur" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.username} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Plan</Label>
                        <Select value={assignForm.planId} onValueChange={(value) => setAssignForm({ ...assignForm, planId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - {plan.monthlyPrice}€/mois
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Période de facturation</Label>
                      <RadioGroup value={assignForm.interval} onValueChange={(value) => setAssignForm({ ...assignForm, interval: value as PaymentInterval })}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mensuel" id="mensuel" />
                          <Label htmlFor="mensuel">Mensuel</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="annuel" id="annuel" />
                          <Label htmlFor="annuel">Annuel</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="app-access"
                        checked={assignForm.appAccess}
                        onCheckedChange={(checked) => setAssignForm({ ...assignForm, appAccess: checked === true })}
                      />
                      <Label htmlFor="app-access">Accès App</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAssignUser}>Assigner</Button>
                      <Button variant="outline" onClick={() => setShowAssignUser(false)}>Annuler</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {users.map((user) => {
                  const subscription = subscriptions.find(s => s.userId === user.id && (s.status === 'active' || s.status === 'overdue'));
                  const plan = subscription ? plans.find(p => p.id === subscription.planId) : null;

                  return (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{user.username}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {plan && subscription && (
                              <p className="text-sm">
                                Plan: {plan.name} - {subscription.interval}
                                {subscription.appAccess && " + App"}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(user.accountStatus)}
                            {user.accountStatus === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetOverdue(user.id)}
                              >
                                Marquer en retard
                              </Button>
                            )}
                            {user.accountStatus === 'disabled' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReactivateUser(user.id)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Réactiver
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      Annuler
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Êtes-vous sûr de vouloir annuler le compte de {user.username} ? Cette action est irréversible.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleCancelUser(user.id)}>
                                        Confirmer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Retards de Paiement</CardTitle>
              <CardDescription>Comptes désactivés et annulés</CardDescription>
            </CardHeader>
            <CardContent>
              {kpi && kpi.overdueUsers.length > 0 && (
                <>
                  <h3 className="font-medium mb-2">Comptes en retard de paiement ({kpi.overdue})</h3>
                  <div className="space-y-2 mb-6">
                    {kpi.overdueUsers.map((user: User) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{user.username}</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">Retard de paiement</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivateUser(user.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Réactiver
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    Annuler
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir annuler le compte de {user.username} ? Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelUser(user.id)}>
                                      Confirmer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {kpi && kpi.cancelledUsers.length > 0 && (
                <>
                  <h3 className="font-medium mb-2">Comptes annulés ({kpi.cancelled})</h3>
                  <div className="space-y-2">
                    {kpi.cancelledUsers.map((user: User) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{user.username}</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">Annulé</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {(!kpi || (kpi.overdue === 0 && kpi.cancelled === 0)) && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun compte en retard ou annulé
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}