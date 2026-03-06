'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatMRR,
  getDaysUntilRenewal,
  type Subscription,
  type SubscriptionStatus,
  type Customer,
} from '@/types/command';
import { SubscriptionStatusBadge } from './customer-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  MoreHorizontal,
  CreditCard,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface SubscriptionListProps {
  subscriptions: Subscription[];
  customers?: Customer[];
  isLoading?: boolean;
  onViewSubscription?: (subscription: Subscription) => void;
  onViewInStripe?: (subscription: Subscription) => void;
  onRefresh?: () => void;
  pageSize?: number;
  className?: string;
}

export interface SubscriptionCardProps {
  subscription: Subscription;
  customer?: Customer;
  onViewInStripe?: () => void;
  className?: string;
}

export interface SubscriptionSummaryProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
  currency?: string;
  className?: string;
}

// =============================================================================
// Subscription Card (Compact View)
// =============================================================================

export function SubscriptionCard({
  subscription,
  customer,
  onViewInStripe,
  className,
}: SubscriptionCardProps) {
  const daysUntilRenewal = getDaysUntilRenewal(subscription.current_period_end);
  const isRenewingSoon = daysUntilRenewal !== null && daysUntilRenewal <= 7;
  const isPastDue = subscription.status === 'past_due';

  return (
    <Card className={cn(isPastDue && 'border-red-500/50', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Customer info */}
            {customer && (
              <p className="font-medium truncate">
                {customer.name || customer.email}
              </p>
            )}
            
            {/* Plan */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {subscription.plan_name || 'Unknown Plan'}
              </span>
              <SubscriptionStatusBadge status={subscription.status} size="sm" />
            </div>

            {/* MRR */}
            <p className="text-lg font-semibold mt-2">
              {formatMRR(subscription.mrr, subscription.currency)}
            </p>
          </div>

          {/* Right side */}
          <div className="text-right">
            {/* Renewal info */}
            {subscription.current_period_end && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'text-xs',
                        isRenewingSoon ? 'text-yellow-600' : 'text-muted-foreground'
                      )}
                    >
                      {isRenewingSoon && <Clock className="inline h-3 w-3 mr-1" />}
                      {daysUntilRenewal !== null
                        ? daysUntilRenewal <= 0
                          ? 'Renews today'
                          : `Renews in ${daysUntilRenewal}d`
                        : 'No renewal date'}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Next billing:{' '}
                      {format(new Date(subscription.current_period_end), 'PPP')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Actions */}
            {onViewInStripe && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={onViewInStripe}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Stripe
              </Button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {isPastDue && (
          <div className="mt-3 p-2 rounded bg-red-500/10 text-red-600 text-xs flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Payment past due - action required
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Subscription Summary Card
// =============================================================================

export function SubscriptionSummary({
  subscriptions,
  isLoading = false,
  currency = 'USD',
  className,
}: SubscriptionSummaryProps) {
  const stats = useMemo(() => {
    if (!subscriptions.length) return null;

    const statusCounts: Record<SubscriptionStatus, number> = {
      active: 0,
      past_due: 0,
      canceled: 0,
      incomplete: 0,
      incomplete_expired: 0,
      trialing: 0,
      unpaid: 0,
      paused: 0,
    };

    let totalMrr = 0;
    let trialingMrr = 0;

    subscriptions.forEach((sub) => {
      statusCounts[sub.status]++;
      totalMrr += sub.mrr;
      if (sub.status === 'trialing') {
        trialingMrr += sub.mrr;
      }
    });

    return {
      total: subscriptions.length,
      active: statusCounts.active,
      trialing: statusCounts.trialing,
      pastDue: statusCounts.past_due,
      canceled: statusCounts.canceled,
      paused: statusCounts.paused,
      totalMrr,
      trialingMrr,
      atRiskMrr: subscriptions
        .filter((s) => s.status === 'past_due' || s.status === 'unpaid')
        .reduce((sum, s) => sum + s.mrr, 0),
    };
  }, [subscriptions]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Overview
        </CardTitle>
        <CardDescription>
          {stats.total} total subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-600">{stats.trialing}</p>
            <p className="text-xs text-muted-foreground">Trialing</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-600">{stats.pastDue}</p>
            <p className="text-xs text-muted-foreground">Past Due</p>
          </div>
        </div>

        {/* MRR breakdown */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total MRR</span>
            <span className="font-semibold">{formatCurrency(stats.totalMrr, currency)}</span>
          </div>
          {stats.trialingMrr > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trialing MRR</span>
              <span className="text-blue-600">{formatCurrency(stats.trialingMrr, currency)}</span>
            </div>
          )}
          {stats.atRiskMrr > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">At-Risk MRR</span>
              <span className="text-red-600">{formatCurrency(stats.atRiskMrr, currency)}</span>
            </div>
          )}
        </div>

        {/* Warning */}
        {stats.pastDue > 0 && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-400">
                {stats.pastDue} subscription{stats.pastDue > 1 ? 's' : ''} need attention
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Subscription List Table
// =============================================================================

export function SubscriptionList({
  subscriptions,
  customers = [],
  isLoading = false,
  onViewSubscription,
  onViewInStripe,
  onRefresh,
  pageSize = 10,
  className,
}: SubscriptionListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Create customer lookup map
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => {
      if (c.stripe_customer_id) {
        map.set(c.stripe_customer_id, c);
      }
    });
    return map;
  }, [customers]);

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions;

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((sub) => {
        const customer = customerMap.get(sub.stripe_customer_id);
        return (
          sub.plan_name?.toLowerCase().includes(query) ||
          customer?.name?.toLowerCase().includes(query) ||
          customer?.email.toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((sub) => sub.status === statusFilter);
    }

    return result;
  }, [subscriptions, search, statusFilter, customerMap]);

  // Pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / pageSize);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: subscriptions.length };
    subscriptions.forEach((sub) => {
      counts[sub.status] = (counts[sub.status] || 0) + 1;
    });
    return counts;
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No subscriptions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sync with Stripe to import subscriptions.
            </p>
            {onRefresh && (
              <Button onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as SubscriptionStatus | 'all');
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="active">Active ({statusCounts.active || 0})</SelectItem>
            <SelectItem value="trialing">Trialing ({statusCounts.trialing || 0})</SelectItem>
            <SelectItem value="past_due">Past Due ({statusCounts.past_due || 0})</SelectItem>
            <SelectItem value="canceled">Canceled ({statusCounts.canceled || 0})</SelectItem>
            <SelectItem value="paused">Paused ({statusCounts.paused || 0})</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh */}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="ml-auto">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Renewal</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <CreditCard className="h-8 w-8 mb-2" />
                    <p>No subscriptions match your filters</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubscriptions.map((subscription) => {
                const customer = customerMap.get(subscription.stripe_customer_id);
                const daysUntilRenewal = getDaysUntilRenewal(subscription.current_period_end);

                return (
                  <TableRow
                    key={subscription.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      subscription.status === 'past_due' && 'bg-red-50/50 dark:bg-red-950/10'
                    )}
                    onClick={() => onViewSubscription?.(subscription)}
                  >
                    <TableCell>
                      {customer ? (
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {customer.name || 'No name'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {customer.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {subscription.plan_name || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={subscription.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(subscription.mrr, subscription.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {subscription.interval || 'month'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {daysUntilRenewal !== null ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={cn(
                                  'text-sm',
                                  daysUntilRenewal <= 3
                                    ? 'text-yellow-600 font-medium'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {daysUntilRenewal <= 0 ? 'Today' : `${daysUntilRenewal}d`}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {subscription.current_period_end &&
                                format(new Date(subscription.current_period_end), 'PPP')}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onViewSubscription?.(subscription)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {subscription.stripe_subscription_id && (
                            <DropdownMenuItem onClick={() => onViewInStripe?.(subscription)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View in Stripe
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredSubscriptions.length)} of{' '}
            {filteredSubscriptions.length} subscriptions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
