'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDistanceToNow, format, parseISO, isValid } from 'date-fns';
import {
  getPeriodLabel,
  formatNumber,
  formatPercentage,
  type AnalyticsPeriod,
} from '@/types/analytics';
// Consolidated import for analytics
import type { InsightsResponse } from '@/types/insights';
import { AnalyticsMetricCard } from '@/components/analytics';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  LineChart,
  DollarSign,
  Users,
  CheckCircle2,
  Target,
  TrendingUp,
  FileText,
  FolderKanban,
  MessageSquare,
  Activity,
  RefreshCw,
  BarChart3,
  Globe,
  Zap,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Constants
// =============================================================================

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-600 bg-red-100',
  high: 'text-orange-600 bg-orange-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-green-600 bg-green-100',
};

// =============================================================================
// Custom Tooltip
// =============================================================================

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
  prefix?: string;
}

function ChartTooltip({ active, payload, label, prefix = '' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[140px]">
      <p className="text-sm font-medium mb-1">
        {label && isValid(parseISO(label)) ? format(parseISO(label), 'MMM d, yyyy') : label}
      </p>
      {payload.map((entry, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-xs font-medium">
            {prefix}{formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default function InsightsPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  const [data, setData] = useState<InsightsResponse>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  // Fetch insights
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/insights?workspace_id=${currentWorkspace.id}&period=${period}&include=all`
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Permission check
  if (!can('analytics.view')) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overview, revenue, growth, productivity, activity } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LineChart className="h-6 w-6" />
            Insights
          </h1>
          <p className="text-muted-foreground">
            Your business at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsMetricCard
          title="Total Revenue"
          value={overview?.total_revenue || 0}
          change={overview?.total_revenue_change}
          changeLabel="vs previous period"
          type="currency"
          icon={DollarSign}
        />
        <AnalyticsMetricCard
          title="Active Deals"
          value={overview?.active_deals_value || 0}
          type="currency"
          icon={Target}
          description={`${overview?.active_deals_count || 0} open deals`}
        />
        <AnalyticsMetricCard
          title="Total Contacts"
          value={overview?.total_contacts || 0}
          change={overview?.total_contacts_change}
          changeLabel="vs previous period"
          icon={Users}
        />
        <AnalyticsMetricCard
          title="Tasks Completed"
          value={overview?.tasks_completed || 0}
          change={overview?.tasks_completed_change}
          changeLabel="vs previous period"
          icon={CheckCircle2}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="growth" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Growth
          </TabsTrigger>
          <TabsTrigger value="productivity" className="gap-2">
            <Zap className="h-4 w-4" />
            Productivity
          </TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* Overview Tab */}
        {/* ================================================================= */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Paid invoice revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {(overview?.revenue_trend?.length || 0) === 0 ? (
                <EmptyState icon={DollarSign} message="No revenue data yet" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview?.revenue_trend}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false}
                        tickFormatter={(v) => isValid(parseISO(v)) ? format(parseISO(v), 'MMM d') : v} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false}
                        tickFormatter={(v) => `$${formatNumber(v, true)}`} />
                      <Tooltip content={<ChartTooltip prefix="$" />} />
                      <Area type="monotone" dataKey="value" name="Revenue" stroke="hsl(var(--chart-1))" fill="url(#revGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest actions across your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                {(activity?.recent?.length || 0) === 0 ? (
                  <EmptyState icon={Activity} message="No recent activity" />
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {activity?.recent?.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <span className="font-medium capitalize">{item.action}</span>{' '}
                              <span className="text-muted-foreground">{item.entity_type}</span>
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
                <CardDescription>Key numbers from across your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <AnalyticsMetricCard
                    title="Open Deals"
                    value={overview?.active_deals_count || 0}
                    icon={Target}
                    compact
                  />
                  <AnalyticsMetricCard
                    title="Invoices Paid"
                    value={revenue?.paid_count || 0}
                    icon={DollarSign}
                    compact
                  />
                  <AnalyticsMetricCard
                    title="Projects Active"
                    value={productivity?.projects_active || 0}
                    icon={FolderKanban}
                    compact
                  />
                  <AnalyticsMetricCard
                    title="Feedback Items"
                    value={productivity?.feedback_total || 0}
                    icon={MessageSquare}
                    compact
                  />
                  <AnalyticsMetricCard
                    title="Total Leads"
                    value={growth?.total_leads || 0}
                    icon={Users}
                    compact
                  />
                  <AnalyticsMetricCard
                    title="Tasks Overdue"
                    value={productivity?.tasks_overdue || 0}
                    icon={AlertTriangle}
                    compact
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* Revenue Tab */}
        {/* ================================================================= */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          {/* Revenue Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsMetricCard title="Total Invoiced" value={revenue?.total_invoiced || 0} type="currency" icon={FileText} />
            <AnalyticsMetricCard title="Total Paid" value={revenue?.total_paid || 0} type="currency" icon={DollarSign} />
            <AnalyticsMetricCard title="Outstanding" value={revenue?.total_outstanding || 0} type="currency" icon={Clock} />
            <AnalyticsMetricCard title="Overdue" value={revenue?.total_overdue || 0} type="currency" icon={AlertTriangle} />
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(revenue?.revenue_trend?.length || 0) === 0 ? (
                <EmptyState icon={DollarSign} message="No paid invoices yet. Revenue will appear here as invoices are paid." />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenue?.revenue_trend}>
                      <defs>
                        <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false}
                        tickFormatter={(v) => isValid(parseISO(v)) ? format(parseISO(v), 'MMM d') : v} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false}
                        tickFormatter={(v) => `$${formatNumber(v, true)}`} />
                      <Tooltip content={<ChartTooltip prefix="$" />} />
                      <Area type="monotone" dataKey="value" name="Revenue" stroke="hsl(var(--chart-1))" fill="url(#revGrad2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deal Pipeline + Invoice Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deal Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Deal Pipeline
                </CardTitle>
                <CardDescription>Open deals by stage</CardDescription>
              </CardHeader>
              <CardContent>
                {(revenue?.deal_pipeline?.length || 0) === 0 ? (
                  <EmptyState icon={Target} message="No pipeline stages configured yet" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stage</TableHead>
                        <TableHead className="text-right">Deals</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenue?.deal_pipeline?.filter((s) => !s.is_lost).map((stage) => (
                        <TableRow key={stage.stage_name}>
                          <TableCell className="font-medium">{stage.stage_name}</TableCell>
                          <TableCell className="text-right">{stage.deal_count}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ${formatNumber(stage.total_value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Status
                </CardTitle>
                <CardDescription>{revenue?.invoice_count || 0} total invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {(revenue?.invoice_status_breakdown?.length || 0) === 0 ? (
                  <EmptyState icon={FileText} message="No invoices created yet" />
                ) : (
                  <div className="space-y-4">
                    {revenue?.invoice_status_breakdown?.map((item) => {
                      const total = revenue?.invoice_count || 1;
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={item.status} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={item.status === 'paid' ? 'default' : item.status === 'overdue' ? 'destructive' : 'secondary'}>
                                {item.status}
                              </Badge>
                            </div>
                            <span className="text-sm font-medium">{item.count} ({pct}%)</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* Growth Tab */}
        {/* ================================================================= */}
        <TabsContent value="growth" className="space-y-6 mt-6">
          {/* Growth Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsMetricCard title="Total Contacts" value={growth?.total_contacts || 0} icon={Users} />
            <AnalyticsMetricCard title="New This Period" value={growth?.new_contacts || 0} icon={Users} />
            <AnalyticsMetricCard title="Total Leads" value={growth?.total_leads || 0} icon={Globe} />
            <AnalyticsMetricCard title="Conversion Rate" value={growth?.avg_conversion_rate || 0} type="percentage" icon={TrendingUp} />
          </div>

          {/* Contact Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Growth
              </CardTitle>
              <CardDescription>New contacts added over time</CardDescription>
            </CardHeader>
            <CardContent>
              {(growth?.contact_growth?.length || 0) === 0 ? (
                <EmptyState icon={Users} message="No contacts yet. They will appear here as you add them." />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growth?.contact_growth}>
                      <defs>
                        <linearGradient id="contactGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false}
                        tickFormatter={(v) => isValid(parseISO(v)) ? format(parseISO(v), 'MMM d') : v} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="value" name="Contacts" stroke="hsl(var(--chart-2))" fill="url(#contactGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Sources + Landing Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Lead Sources
                </CardTitle>
                <CardDescription>Where your contacts come from</CardDescription>
              </CardHeader>
              <CardContent>
                {(growth?.lead_sources?.length || 0) === 0 ? (
                  <EmptyState icon={Globe} message="No contact source data yet" />
                ) : (
                  <div className="space-y-4">
                    {growth?.lead_sources?.map((source) => (
                      <div key={source.source} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{source.source.replace('_', ' ')}</span>
                          <span className="text-sm text-muted-foreground">
                            {source.count} ({source.percentage}%)
                          </span>
                        </div>
                        <Progress value={source.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Landing Page Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Landing Pages
                </CardTitle>
                <CardDescription>Page performance</CardDescription>
              </CardHeader>
              <CardContent>
                {(growth?.landing_pages?.length || 0) === 0 ? (
                  <EmptyState icon={FileText} message="No landing pages created yet" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {growth?.landing_pages?.slice(0, 8).map((page) => (
                        <TableRow key={page.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate max-w-[150px]">{page.title}</span>
                              <Badge variant="outline" className="text-xs">{page.status}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(page.view_count)}</TableCell>
                          <TableCell className="text-right">{formatNumber(page.conversion_count)}</TableCell>
                          <TableCell className="text-right font-medium">{formatPercentage(page.conversion_rate, 1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Published
              </CardTitle>
              <CardDescription>Publishing activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              {(growth?.content_trend?.length || 0) === 0 ? (
                <EmptyState icon={FileText} message="No published content yet" />
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growth?.content_trend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false}
                        tickFormatter={(v) => isValid(parseISO(v)) ? format(parseISO(v), 'MMM d') : v} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Posts" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* Productivity Tab */}
        {/* ================================================================= */}
        <TabsContent value="productivity" className="space-y-6 mt-6">
          {/* Productivity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsMetricCard title="Tasks Done" value={productivity?.tasks_done || 0} icon={CheckCircle2} />
            <AnalyticsMetricCard title="In Progress" value={productivity?.tasks_in_progress || 0} icon={Activity} />
            <AnalyticsMetricCard title="Projects Active" value={productivity?.projects_active || 0} icon={FolderKanban} />
            <AnalyticsMetricCard title="Feedback Items" value={productivity?.feedback_total || 0} icon={MessageSquare} />
          </div>

          {/* Task Status + Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Task Overview
                </CardTitle>
                <CardDescription>{productivity?.tasks_total || 0} total tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {(productivity?.tasks_total || 0) === 0 ? (
                  <EmptyState icon={CheckCircle2} message="No tasks created yet" />
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: 'To Do', value: productivity?.tasks_todo || 0, color: 'hsl(var(--chart-4))' },
                      { label: 'In Progress', value: productivity?.tasks_in_progress || 0, color: 'hsl(var(--chart-2))' },
                      { label: 'Done', value: productivity?.tasks_done || 0, color: 'hsl(var(--chart-1))' },
                      { label: 'Overdue', value: productivity?.tasks_overdue || 0, color: 'hsl(0, 70%, 50%)' },
                    ].map((item) => {
                      const pct = (productivity?.tasks_total || 0) > 0
                        ? Math.round((item.value / (productivity?.tasks_total || 1)) * 100)
                        : 0;
                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="text-sm text-muted-foreground">{item.value} ({pct}%)</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks by Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Tasks by Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(productivity?.tasks_by_priority?.length || 0) === 0 ? (
                  <EmptyState icon={AlertTriangle} message="No tasks yet" />
                ) : (
                  <div className="space-y-3">
                    {['urgent', 'high', 'medium', 'low'].map((priority) => {
                      const item = productivity?.tasks_by_priority?.find((p) => p.priority === priority);
                      const count = item?.count || 0;
                      if (count === 0) return null;
                      return (
                        <div key={priority} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <Badge className={PRIORITY_COLORS[priority] || ''} variant="outline">
                              {priority}
                            </Badge>
                          </div>
                          <span className="text-lg font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Status + Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-3xl font-bold">{productivity?.projects_active || 0}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-3xl font-bold">{productivity?.projects_completed || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-3xl font-bold">{productivity?.projects_on_hold || 0}</p>
                    <p className="text-sm text-muted-foreground">On Hold</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Feedback
                </CardTitle>
                <CardDescription>{productivity?.feedback_total || 0} total submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {(productivity?.feedback_total || 0) === 0 ? (
                  <EmptyState icon={MessageSquare} message="No feedback received yet" />
                ) : (
                  <div className="space-y-4">
                    {(productivity?.feedback_by_type || []).map((item) => (
                      <div key={item.status} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <Badge variant="outline" className="capitalize">{item.status}</Badge>
                        <span className="text-lg font-semibold">{item.count}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xl font-bold">{productivity?.feedback_new || 0}</p>
                        <p className="text-xs text-muted-foreground">New</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">{productivity?.feedback_in_progress || 0}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">{productivity?.feedback_completed || 0}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Period Label */}
      <div className="text-center text-sm text-muted-foreground">
        Showing data for {getPeriodLabel(period).toLowerCase()}
      </div>
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
