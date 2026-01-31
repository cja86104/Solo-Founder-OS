'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Loader2,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_LIMITS, formatLimit } from '@/types/workspace';
import { useSubscription } from '@/lib/subscription-context';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    description: 'For growing businesses',
    features: [
      'Unlimited Landing Pages',
      '10,000 Contacts',
      '100,000 Page Views/mo',
      'Unlimited Vault Items',
      '5 Team Members',
      'Priority Support',
      'Custom Domain',
      'Advanced Analytics',
    ],
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 299,
    priceNote: 'one-time',
    description: 'Pay once, use forever',
    features: [
      'Everything in Pro',
      'Unlimited Team Members',
      'Unlimited Everything',
      'Priority Support Forever',
      'All Future Updates',
    ],
  },
];

export default function BillingSettingsPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { canManageBilling } = usePermissions();
  const { isTrialing, isTrialExpired, trialDaysRemaining } = useSubscription();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const currentPlan = currentWorkspace?.plan || 'expired';
  const limits = currentWorkspace?.plan_limits || PLAN_LIMITS.expired;

  const handleUpgrade = async (planId: string) => {
    setIsLoading(planId);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace?.id,
          plan: planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast.error('Failed to start checkout');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading('manage');
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to access billing portal');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast.error('Failed to access billing portal');
    } finally {
      setIsLoading(null);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No workspace selected</p>
        </CardContent>
      </Card>
    );
  }

  if (!canManageBilling) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only workspace owners can manage billing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your workspace is on the {currentPlan} plan
              </CardDescription>
            </div>
            <Badge
              variant={currentPlan === 'trial' || currentPlan === 'expired' ? 'secondary' : 'default'}
              className="text-lg px-4 py-1"
            >
              {currentPlan === 'lifetime' && <Crown className="h-4 w-4 mr-1" />}
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Landing Pages</span>
                <span>0 / {formatLimit(limits.landing_pages)}</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Contacts</span>
                <span>0 / {formatLimit(limits.contacts)}</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vault Items</span>
                <span>0 / {formatLimit(limits.vault_items)}</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Team Members</span>
                <span>1 / {formatLimit(limits.team_members + 1)}</span>
              </div>
              <Progress value={100 / (limits.team_members + 1)} className="h-2" />
            </div>
          </div>
        </CardContent>
        {/* Trial status message */}
        {isTrialing && (
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              <strong>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}</strong> remaining in your free trial.
              You have full access to all features.
            </p>
          </CardFooter>
        )}
        {isTrialExpired && (
          <CardFooter>
            <p className="text-sm text-destructive">
              Your trial has expired. You are in read-only mode. Upgrade below to regain full access.
            </p>
          </CardFooter>
        )}
        {(currentPlan === 'pro' || currentPlan === 'lifetime') && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoading === 'manage'}
            >
              {isLoading === 'manage' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Manage Billing
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {currentPlan === 'trial' || currentPlan === 'expired' ? 'Upgrade Your Plan' : 'Available Plans'}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isDowngrade = currentPlan === 'lifetime';

            return (
              <Card
                key={plan.id}
                className={
                  plan.popular
                    ? 'border-primary shadow-lg relative'
                    : isCurrent
                    ? 'border-green-500'
                    : ''
                }
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.id === 'lifetime' && <Crown className="h-5 w-5 text-amber-500" />}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.priceNote ? (
                      <span className="text-muted-foreground">/{plan.priceNote}</span>
                    ) : plan.price > 0 ? (
                      <span className="text-muted-foreground">/month</span>
                    ) : null}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button variant="outline" disabled className="w-full">
                      {currentPlan === 'lifetime' ? 'Lifetime Access' : 'Downgrade'}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isLoading === plan.id}
                    >
                      {isLoading === plan.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {plan.id === 'lifetime' ? 'Buy Lifetime' : 'Upgrade'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
