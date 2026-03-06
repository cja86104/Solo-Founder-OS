'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import {
  formatCurrency,
  formatMRR,
  calculateChurnRiskLevel,
  type Customer,
  type Subscription,
  type RevenueEvent,
} from '@/types/command';
import {
  CustomerStatusBadge,
  SubscriptionStatusBadge,
  ChurnRiskBadge,
} from '@/components/command';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  User,
  AlertTriangle,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface CustomerDetailData {
  customer: Customer | null;
  subscriptions: Subscription[];
  revenueEvents: RevenueEvent[];
}

// =============================================================================
// Page Component
// =============================================================================

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  usePermissions();

  const [data, setData] = useState<CustomerDetailData>({
    customer: null,
    subscriptions: [],
    revenueEvents: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch customer data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace || !customerId) return;

    setIsLoading(true);
    try {
      // Fetch customer
      const customerRes = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&include=customers&customer_id=${customerId}`
      );
      let customerData: Customer | null = null;
      if (customerRes.ok) {
        const res = await customerRes.json();
        customerData = res.customer || null;
      }

      // Fetch subscriptions for this customer
      const subsRes = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&include=subscriptions&customer_id=${customerId}`
      );
      let subscriptionsData: Subscription[] = [];
      if (subsRes.ok) {
        const res = await subsRes.json();
        subscriptionsData = res.subscriptions || [];
      }

      // Fetch revenue events for this customer
      const eventsRes = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&include=events&customer_id=${customerId}&limit=20`
      );
      let eventsData: RevenueEvent[] = [];
      if (eventsRes.ok) {
        const res = await eventsRes.json();
        eventsData = res.events || [];
      }

      setData({
        customer: customerData,
        subscriptions: subscriptionsData,
        revenueEvents: eventsData,
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle email
  const handleEmail = () => {
    if (data.customer) {
      window.location.href = `mailto:${data.customer.email}`;
    }
  };

  // Handle view in Stripe
  const handleViewInStripe = () => {
    if (data.customer?.stripe_customer_id) {
      window.open(
        `https://dashboard.stripe.com/customers/${data.customer.stripe_customer_id}`,
        '_blank'
      );
    }
  };

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Not found
  if (!data.customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Customer Not Found</h3>
            <p className="text-muted-foreground">
              The customer you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, subscriptions, revenueEvents } = data;
  const riskLevel = calculateChurnRiskLevel(customer.churn_risk_score);
  const activeSubscription = subscriptions.find((s) => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {customer.name || customer.email}
              </h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          {customer.stripe_customer_id && (
            <Button variant="outline" onClick={handleViewInStripe}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Stripe
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{customer.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium flex items-center gap-1">
                  {customer.company ? (
                    <>
                      <Building2 className="h-3 w-3" />
                      {customer.company}
                    </>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer Since</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(customer.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{customer.plan_name || '-'}</p>
              </div>
            </div>

            <Separator />

            {/* Revenue Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-xl font-bold text-green-600">
                  {formatMRR(customer.mrr, customer.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ARR</p>
                <p className="text-xl font-bold">
                  {formatCurrency(customer.mrr * 12, customer.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lifetime Value</p>
                <p className="text-xl font-bold">
                  {formatCurrency(customer.lifetime_value, customer.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{customer.currency}</p>
              </div>
            </div>

            {/* Metadata */}
            {customer.metadata && Object.keys(customer.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Additional Data</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(customer.metadata).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground">{key}:</span>{' '}
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <ChurnRiskBadge score={customer.churn_risk_score} size="lg" />
              <p className="mt-2 text-2xl font-bold">{customer.churn_risk_score}%</p>
              <p className="text-sm text-muted-foreground">Churn Risk Score</p>
            </div>

            <Progress
              value={customer.churn_risk_score}
              className="h-3"
              indicatorClassName={
                riskLevel === 'critical'
                  ? 'bg-red-500'
                  : riskLevel === 'high'
                  ? 'bg-orange-500'
                  : riskLevel === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }
            />

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <CustomerStatusBadge status={customer.status} size="sm" />
              </div>
              {activeSubscription && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subscription</span>
                  <SubscriptionStatusBadge status={activeSubscription.status} size="sm" />
                </div>
              )}
            </div>

            {riskLevel === 'critical' || riskLevel === 'high' ? (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-700 dark:text-red-400">
                  ⚠️ This customer is at {riskLevel} risk of churning. Consider reaching out.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ This customer appears healthy
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscriptions
          </CardTitle>
          <CardDescription>
            {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No subscriptions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Current Period</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.plan_name || 'Unknown Plan'}
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={sub.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(sub.mrr, sub.currency)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {sub.interval || 'month'}
                    </TableCell>
                    <TableCell>
                      {sub.current_period_start && sub.current_period_end ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {format(new Date(sub.current_period_start), 'MMM d')} -{' '}
                              {format(new Date(sub.current_period_end), 'MMM d, yyyy')}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Renews{' '}
                                {formatDistanceToNow(new Date(sub.current_period_end), {
                                  addSuffix: true,
                                })}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(sub.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revenue History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Revenue History
          </CardTitle>
          <CardDescription>Recent MRR-impacting events</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueEvents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No revenue events found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueEvents.map((event) => {
                const isPositive = ['new', 'expansion', 'reactivation', 'payment'].includes(
                  event.event_type
                );
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {event.event_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatCurrency(Math.abs(event.amount), customer.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.event_date
                          ? format(new Date(event.event_date), 'MMM d, yyyy')
                          : '-'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
