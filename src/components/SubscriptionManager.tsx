import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Star, Zap } from "lucide-react";
import { LocalStorageService } from "@/lib/localStorage";
import { SubscriptionPlan, UserSubscription, PaymentInterval } from "@/types/fitness";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function SubscriptionManager() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [interval, setInterval] = useState<PaymentInterval>('mensuel');
  const [appAccess, setAppAccess] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const subscriptionPlans = LocalStorageService.getSubscriptionPlans();
    setPlans(subscriptionPlans);

    if (currentUser) {
      const userSub = LocalStorageService.getUserSubscription(currentUser.id);
      setCurrentSubscription(userSub);
      if (userSub) {
        setSelectedPlan(userSub.planId);
        setInterval(userSub.interval);
        setAppAccess(userSub.appAccess);
      }
    }
  }, [currentUser]);

  const getPrice = (plan: SubscriptionPlan) => {
    const basePrice = interval === 'mensuel' ? plan.monthlyPrice : plan.annualPrice;
    const appAccessFee = appAccess ? (interval === 'mensuel' ? 9.99 : 99.99) : 0;
    return basePrice + appAccessFee;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (interval === 'annuel') {
      const monthlyTotal = (plan.monthlyPrice + (appAccess ? 9.99 : 0)) * 12;
      const annualTotal = getPrice(plan);
      return monthlyTotal - annualTotal;
    }
    return 0;
  };

  const getPlanIcon = (level: string) => {
    switch (level) {
      case 'debutant': return <Star className="h-5 w-5" />;
      case 'medium': return <Zap className="h-5 w-5" />;
      case 'expert': return <Crown className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const handleSubscribe = () => {
    if (!currentUser || !selectedPlan) return;

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const endDate = new Date();
    if (interval === 'mensuel') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription: UserSubscription = {
      userId: currentUser.id,
      planId: selectedPlan,
      interval,
      appAccess,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      nextPaymentDate: endDate.toISOString(),
      status: 'active',
      paymentMethod: 'simulation_locale'
    };

    LocalStorageService.createSubscription(subscription);
    setCurrentSubscription(subscription);

    toast({
      title: "Abonnement activé !",
      description: `Votre abonnement ${plan.name} ${interval} a été activé avec succès.`,
    });
  };

  const handleCancelSubscription = () => {
    if (!currentUser) return;

    LocalStorageService.cancelSubscription(currentUser.id);
    setCurrentSubscription(null);

    toast({
      title: "Abonnement annulé",
      description: "Votre abonnement a été annulé avec succès.",
      variant: "destructive"
    });
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>Veuillez vous connecter pour gérer votre abonnement.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion des Abonnements</h2>
        <p className="text-muted-foreground">Choisissez le plan qui vous convient le mieux</p>
      </div>

      {currentSubscription && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Abonnement Actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {plans.find(p => p.id === currentSubscription.planId)?.name} - {currentSubscription.interval}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expire le: {new Date(currentSubscription.endDate).toLocaleDateString()}
                </p>
                {currentSubscription.appAccess && (
                  <Badge variant="secondary" className="mt-1">Accès App</Badge>
                )}
              </div>
              <Button variant="destructive" onClick={handleCancelSubscription}>
                Annuler l'abonnement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Période de facturation</Label>
          <RadioGroup value={interval} onValueChange={(value) => setInterval(value as PaymentInterval)} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mensuel" id="mensuel" />
              <Label htmlFor="mensuel">Mensuel</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="annuel" id="annuel" />
              <Label htmlFor="annuel">Annuel (2 mois gratuits)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="app-access" 
            checked={appAccess} 
            onCheckedChange={(checked) => setAppAccess(checked === true)}
          />
          <Label htmlFor="app-access" className="text-sm font-medium">
            Accès App mobile (+{interval === 'mensuel' ? '9.99€/mois' : '99.99€/an'})
          </Label>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const savings = getSavings(plan);
            const isSelected = selectedPlan === plan.id;
            const isCurrentPlan = currentSubscription?.planId === plan.id;

            return (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary border-primary' : ''
                } ${isCurrentPlan ? 'bg-primary/5' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {getPlanIcon(plan.level)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrentPlan && <Badge variant="default">Actuel</Badge>}
                  </div>
                  <CardDescription>
                    <div className="text-2xl font-bold text-foreground">
                      {price.toFixed(2)}€
                      <span className="text-sm font-normal text-muted-foreground">
                        /{interval === 'mensuel' ? 'mois' : 'an'}
                      </span>
                    </div>
                    {savings > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        Économisez {savings.toFixed(2)}€
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {appAccess && (
                      <li className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Accès application mobile</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!currentSubscription && (
          <div className="text-center">
            <Button 
              onClick={handleSubscribe} 
              disabled={!selectedPlan}
              size="lg"
              className="w-full md:w-auto"
            >
              S'abonner maintenant
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              * Simulation locale - Aucun paiement réel ne sera effectué
            </p>
          </div>
        )}
      </div>
    </div>
  );
}