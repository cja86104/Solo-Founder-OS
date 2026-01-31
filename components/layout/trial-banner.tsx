'use client';

import Link from 'next/link';
import { Clock, AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/lib/subscription-context';
import { Button } from '@/components/ui/button';

export function TrialBanner() {
  const { isTrialing, isTrialExpired, isActive, isLifetime, trialDaysRemaining } =
    useSubscription();

  // Hide for paid users
  if ((isActive && !isTrialing) || isLifetime) {
    return null;
  }

  if (isTrialExpired) {
    return (
      <div className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2.5 text-center text-sm flex items-center justify-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Your trial has expired — you are in <strong>read-only mode</strong>.
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-3 text-xs font-semibold"
          asChild
        >
          <Link href="/settings/billing">Upgrade Now</Link>
        </Button>
      </div>
    );
  }

  if (isTrialing) {
    return (
      <div className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 text-center text-sm flex items-center justify-center gap-3">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          <strong>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}</strong> left
          in your trial — you have <strong>full access</strong> to all features.
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-3 text-xs font-semibold"
          asChild
        >
          <Link href="/settings/billing">Upgrade Now</Link>
        </Button>
      </div>
    );
  }

  return null;
}
