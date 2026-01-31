'use client';

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import type { Subscription } from '@/types/database';

// ============================================================================
// Context Types
// ============================================================================

interface SubscriptionContextValue {
  subscription: Subscription | null;
  isTrialing: boolean;
  isTrialExpired: boolean;
  isActive: boolean;
  isLifetime: boolean;
  isReadOnly: boolean;
  trialDaysRemaining: number;
  trialEndsAt: Date | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface SubscriptionProviderProps {
  children: ReactNode;
  subscription: Subscription | null;
}

export function SubscriptionProvider({ children, subscription }: SubscriptionProviderProps) {
  const value = useMemo<SubscriptionContextValue>(() => {
    const plan = subscription?.plan || 'expired';
    const trialEndsAt = subscription?.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null;

    const now = new Date();
    const isTrialActive = plan === 'trial' && trialEndsAt !== null && trialEndsAt > now;
    const isTrialExpired =
      (plan === 'trial' && trialEndsAt !== null && trialEndsAt <= now) ||
      plan === 'expired';

    const isPro = plan === 'pro' && subscription?.status === 'active';
    const isLifetime = plan === 'lifetime';
    const isActive = isPro || isLifetime || isTrialActive;
    const isReadOnly = !isActive;

    let trialDaysRemaining = 0;
    if (isTrialActive && trialEndsAt) {
      trialDaysRemaining = Math.max(
        0,
        Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      subscription,
      isTrialing: isTrialActive,
      isTrialExpired,
      isActive,
      isLifetime,
      isReadOnly,
      trialDaysRemaining,
      trialEndsAt,
    };
  }, [subscription]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
