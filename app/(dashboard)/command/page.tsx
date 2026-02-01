'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import type {
  Customer,
  Subscription,
  MRRHistory,
  MRRMetrics,
  StripeSyncLog,
  RevenueEvent,
  SyncType,
} from '@/types/command';
import {
  CommandCenterHeader,
  DateRangeSelector,
  QuickStats,
  ExtendedStats,
  GrowthIndicators,
  CustomerStats,
  MRRChart,
  MRRBreakdownChart,
  ChurnRateChart,
  ChurnGrowthComparison,
  AtRiskCustomersCard,
  CustomerTable,
  SubscriptionSummary,
  RevenueOverview,
  RevenueByPlan,
  RecentRevenueEvents,
  SyncStatus,
  SyncHistory,
} from '@/components/command';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Command,
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface DashboardData {
  metrics: MRRMetrics | null;
  history: MRRHistory[];
  customers: Customer[];
  subscriptions: Subscription[];
  revenueEvents: RevenueEvent[];
  syncLogs: StripeSyncLog[];
  lastSync: StripeSyncLog | null;
}

// =============================================================================
// Page Component
// =============================================================================

export default function CommandCenterPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [data, setData] = useState<DashboardData>({
    metrics: null,
    history: [],
    customers: [],
    subscriptions: [],
    revenueEvents: [],
    syncLogs: [],
    lastSync: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      // Fetch metrics
      const metricsRes = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&period=${dateRange}`
      );
      let metricsData = { metrics: null, history: [] };
      if (metricsRes.ok) {
        metricsData = await metricsRes.json();
      }

      // Fetch customers (from contacts with stripe data)
      const customersRes = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&include=customers`
      );
      let customersData: Customer[] = [];
      if (customersRes.ok) {
        const res = await customersRes.json();
        customersData = res.customers || [];
      }

      // Fetch subscriptions
      const subscriptionsRes = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&include=subscriptions`
      );
      let subscriptionsData: Subscription[] = [];
      if (subscriptionsRes.ok) {
        const res = await subscriptionsRes.json();
        subscriptionsData = res.subscriptions || [];
      }

      // Fetch revenue events
      const eventsRes = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&include=events&limit=10`
      );
      let eventsData: RevenueEvent[] = [];
      if (eventsRes.ok) {
        const res = await eventsRes.json();
        eventsData = res.events || [];
      }

      // Fetch sync logs
      const syncRes = await fetch(
        `/api/command/sync?workspace_id=${currentWorkspace.id}&limit=10`
      );
      let syncData: { logs: StripeSyncLog[]; lastSync: StripeSyncLog | null } = {
        logs: [],
        lastSync: null,
      };
      if (syncRes.ok) {
        const syncJson = await syncRes.json();
        syncData = {
          logs: syncJson.sync_history || [],
          lastSync:
            (syncJson.sync_history || []).find(
              (s: StripeSyncLog) => s.status === 'completed'
            ) ||
            (syncJson.sync_history || [])[0] ||
            null,
        };
      }

      setData({
        metrics: metricsData.metrics,
        history: metricsData.history || [],
        customers: customersData,
        subscriptions: subscriptionsData,
        revenueEvents: eventsData,
        syncLogs: syncData.logs || [],
        lastSync: syncData.lastSync,
      });
    } catch (error) {
      console.error('Error fetching command center data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle sync
  const handleSync = async (type: SyncType) => {
    if (!currentWorkspace) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/command/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          sync_type: type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      toast.success('Sync started successfully');
      
      // Refresh data after a delay
      setTimeout(() => {
        fetchData();
      }, 2000);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle settings
  const handleSettings = () => {
    router.push('/settings/integrations');
  };

  // View customer details
  const handleViewCustomer = (customer: Customer) => {
    router.push(`/contacts?id=${customer.id}`);
  };

  // Email customer
  const handleEmailCustomer = (customer: Customer) => {
    window.location.href = `mailto:${customer.email}`;
  };

  // View in Stripe
  const handleViewInStripe = (customer: Customer) => {
    if (customer.stripe_customer_id) {
      window.open(
        `https://dashboard.stripe.com/customers/${customer.stripe_customer_id}`,
        '_blank'
      );
    }
  };

  // At-risk customers
  const atRiskCustomers = data.customers.filter(
    (c) => c.status === 'at_risk' || c.churn_risk_score >= 50
  );

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Permission check
  if (!can('content.view')) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Command className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don&apos;t have permission to view the Command Center.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <CommandCenterHeader
        lastSync={data.lastSync}
        isSyncing={isSyncing}
        onSync={can('content.update') ? handleSync : undefined}
        onSettings={handleSettings}
      />

      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Customers
              {atRiskCustomers.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {atRiskCustomers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <Settings className="h-4 w-4" />
              Sync
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Quick Stats */}
          <QuickStats metrics={data.metrics} currency="USD" />

          {/* Extended Stats */}
          <ExtendedStats metrics={data.metrics} currency="USD" />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MRRChart
              data={data.history}
              showBreakdown={true}
              currency="USD"
            />
            <ChurnRateChart
              data={data.history}
              showTarget={true}
              targetRate={5}
            />
          </div>

          {/* Secondary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GrowthIndicators metrics={data.metrics} currency="USD" />
            <AtRiskCustomersCard
              customers={atRiskCustomers}
              maxDisplay={5}
              onViewCustomer={handleViewCustomer}
            />
            <SubscriptionSummary
              subscriptions={data.subscriptions}
              currency="USD"
            />
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6 mt-0">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CustomerStats customers={data.customers} className="lg:col-span-2" />
            <AtRiskCustomersCard
              customers={atRiskCustomers}
              maxDisplay={5}
              onViewCustomer={handleViewCustomer}
            />
          </div>

          {/* Customer Table */}
          <CustomerTable
            customers={data.customers}
            onViewCustomer={handleViewCustomer}
            onEmailCustomer={handleEmailCustomer}
            onViewInStripe={handleViewInStripe}
            onRefresh={fetchData}
            pageSize={15}
          />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-0">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevenueOverview
              metrics={data.metrics}
              currency="USD"
              className="lg:col-span-2"
            />
            <RevenueByPlan
              customers={data.customers}
              currency="USD"
            />
          </div>

          {/* MRR Breakdown */}
          <MRRBreakdownChart data={data.history} currency="USD" />

          {/* Churn vs Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChurnGrowthComparison data={data.history} currency="USD" />
            <RecentRevenueEvents
              events={data.revenueEvents}
              currency="USD"
              maxEvents={10}
            />
          </div>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SyncStatus
              lastSync={data.lastSync}
              isSyncing={isSyncing}
              onSync={can('content.update') ? handleSync : undefined}
            />
            <SyncHistory
              logs={data.syncLogs}
              maxDisplay={10}
            />
          </div>

          {/* Integration Settings Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integration Settings
              </CardTitle>
              <CardDescription>
                Configure your Stripe connection and sync preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSettings}>
                Open Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* At-Risk Alert Banner */}
      {atRiskCustomers.length > 0 && activeTab === 'overview' && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    {atRiskCustomers.length} customer{atRiskCustomers.length > 1 ? 's' : ''} at risk of churning
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Review and take action to prevent churn
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveTab('customers')}
              >
                View Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
