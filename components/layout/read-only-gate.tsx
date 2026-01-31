'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, Crown } from 'lucide-react';
import { useSubscription } from '@/lib/subscription-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================================================
// useReadOnly hook
// ============================================================================

export function useReadOnly() {
  const { isReadOnly } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const guardAction = useCallback(
    (callback: () => void) => {
      if (isReadOnly) {
        setShowUpgrade(true);
      } else {
        callback();
      }
    },
    [isReadOnly]
  );

  return {
    isReadOnly,
    showUpgrade,
    setShowUpgrade,
    guardAction,
  };
}

// ============================================================================
// UpgradeDialog component
// ============================================================================

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center">
            Upgrade to Continue
          </DialogTitle>
          <DialogDescription className="text-center">
            Your trial has expired. Upgrade to Pro or Lifetime to create and
            edit content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Pro Plan</p>
              <p className="text-xs text-muted-foreground">$29/month — full access</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Crown className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Lifetime Plan</p>
              <p className="text-xs text-muted-foreground">$299 one-time — forever access</p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" asChild>
            <Link href="/settings/billing">View Plans & Upgrade</Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
