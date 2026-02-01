'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plug,
  ExternalLink,
  RefreshCw,
  Shield,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SyncType } from '@/types/command';

export default function IntegrationsSettingsPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { canManageSettings } = usePermissions();
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/stripe/webhook`
      : '/api/stripe/webhook';

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success('Webhook URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleQuickSync = async () => {
    if (!currentWorkspace) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/command/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          sync_type: 'incremental' as SyncType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      toast.success('Sync started successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
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

  if (!canManageSettings) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only workspace owners and admins can manage integrations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isStripeConnected = !!currentWorkspace.stripe_customer_id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plug className="h-8 w-8" />
          Integrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage connected services and sync preferences
        </p>
      </div>

      {/* Stripe Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stripe Connection</CardTitle>
              <CardDescription>
                Connect your Stripe account to sync customer and revenue data
              </CardDescription>
            </div>
            <Badge variant={isStripeConnected ? 'default' : 'secondary'}>
              {isStripeConnected ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isStripeConnected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Customer ID:</span>
                <code className="bg-muted px-2 py-0.5 rounded text-sm">
                  {currentWorkspace.stripe_customer_id}
                </code>
              </div>
              {currentWorkspace.stripe_subscription_id && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Subscription ID:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-sm">
                    {currentWorkspace.stripe_subscription_id}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No Stripe customer is linked to this workspace. A connection is
              created automatically when you subscribe to a paid plan.
            </p>
          )}
        </CardContent>
        {isStripeConnected && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `https://dashboard.stripe.com/customers/${currentWorkspace.stripe_customer_id}`,
                  '_blank'
                )
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Stripe Dashboard
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Ensure your Stripe dashboard is configured to send events to this
            endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
              {webhookUrl}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopyWebhookUrl}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add this URL as a webhook endpoint in your{' '}
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Stripe Webhook settings
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* Sync Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Preferences</CardTitle>
          <CardDescription>
            Trigger a data sync or visit the Command Center for full sync
            controls
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleQuickSync}
            disabled={isSyncing || !isStripeConnected}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Quick Sync
          </Button>
          <Button variant="outline" onClick={() => router.push('/command')}>
            Open Command Center
          </Button>
        </CardContent>
        {!isStripeConnected && (
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Sync is unavailable until a Stripe connection is established.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
