"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import {
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ExternalLink,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  view_count: number | null;
  conversion_count: number | null;
  created_at: string | null;
  published_at: string | null;
}

interface AnalyticsEvent {
  id: string;
  page_id: string;
  event_type: string;
  created_at: string | null;
  landing_pages?: unknown;
}

interface LeadCount {
  page_id: string;
}

interface AnalyticsContentProps {
  pages: Page[];
  analyticsEvents: AnalyticsEvent[];
  leadCounts: LeadCount[];
}

export function AnalyticsContent({
  pages,
  analyticsEvents,
  leadCounts,
}: AnalyticsContentProps) {
  const [dateRange, setDateRange] = useState("30");
  const [selectedPage, setSelectedPage] = useState<string>("all");

  const daysAgo = parseInt(dateRange);
  const startDate = subDays(new Date(), daysAgo);

  const filteredEvents = useMemo(() => {
    return analyticsEvents.filter((event) => {
      const eventDate = new Date(event.created_at!);
      const matchesDate = eventDate >= startDate;
      const matchesPage = selectedPage === "all" || event.page_id === selectedPage;
      return matchesDate && matchesPage;
    });
  }, [analyticsEvents, startDate, selectedPage]);

  const stats = useMemo(() => {
    const pageViews = filteredEvents.filter((e) => e.event_type === "page_view").length;
    const conversions = filteredEvents.filter((e) => e.event_type === "conversion").length;
    const conversionRate = pageViews > 0 ? (conversions / pageViews) * 100 : 0;

    // Calculate previous period for comparison
    const previousStart = subDays(startDate, daysAgo);
    const previousEvents = analyticsEvents.filter((event) => {
      const eventDate = new Date(event.created_at!);
      const matchesDate = eventDate >= previousStart && eventDate < startDate;
      const matchesPage = selectedPage === "all" || event.page_id === selectedPage;
      return matchesDate && matchesPage;
    });

    const previousPageViews = previousEvents.filter((e) => e.event_type === "page_view").length;
    const previousConversions = previousEvents.filter((e) => e.event_type === "conversion").length;

    const viewsChange = previousPageViews > 0
      ? ((pageViews - previousPageViews) / previousPageViews) * 100
      : 0;
    const conversionsChange = previousConversions > 0
      ? ((conversions - previousConversions) / previousConversions) * 100
      : 0;

    return {
      pageViews,
      conversions,
      conversionRate,
      viewsChange,
      conversionsChange,
      totalLeads: leadCounts.filter(
        (l) => selectedPage === "all" || l.page_id === selectedPage
      ).length,
      activePages: pages.filter((p) => p.status === "published").length,
    };
  }, [filteredEvents, analyticsEvents, startDate, daysAgo, selectedPage, leadCounts, pages]);

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: new Date() });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.created_at!);
        return eventDate >= dayStart && eventDate < dayEnd;
      });

      return {
        date: format(day, "MMM d"),
        views: dayEvents.filter((e) => e.event_type === "page_view").length,
        conversions: dayEvents.filter((e) => e.event_type === "conversion").length,
      };
    });
  }, [filteredEvents, startDate]);

  const pageStats = useMemo(() => {
    return pages.map((page) => {
      const pageEvents = filteredEvents.filter((e) => e.page_id === page.id);
      const views = pageEvents.filter((e) => e.event_type === "page_view").length;
      const conversions = pageEvents.filter((e) => e.event_type === "conversion").length;
      const leads = leadCounts.filter((l) => l.page_id === page.id).length;

      return {
        ...page,
        recentViews: views,
        recentConversions: conversions,
        totalLeads: leads,
        conversionRate: views > 0 ? (conversions / views) * 100 : 0,
      };
    });
  }, [pages, filteredEvents, leadCounts]);

  const maxViews = Math.max(...chartData.map((d) => d.views), 1);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPage} onValueChange={setSelectedPage}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Page Views"
          value={stats.pageViews.toLocaleString()}
          change={stats.viewsChange}
          icon={Eye}
        />
        <StatsCard
          title="Conversions"
          value={stats.conversions.toLocaleString()}
          change={stats.conversionsChange}
          icon={MousePointerClick}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Leads"
          value={stats.totalLeads.toLocaleString()}
          icon={Users}
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Traffic Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span>Page Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Conversions</span>
                </div>
              </div>
              <div className="h-[200px] flex items-end gap-1">
                {chartData.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col gap-0.5" style={{ height: "160px" }}>
                      <div
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{
                          height: `${(day.views / maxViews) * 100}%`,
                          minHeight: day.views > 0 ? "4px" : "0",
                        }}
                        title={`${day.views} views`}
                      />
                      {day.conversions > 0 && (
                        <div
                          className="w-full bg-green-500 rounded-b"
                          style={{
                            height: `${(day.conversions / maxViews) * 100}%`,
                            minHeight: "4px",
                          }}
                          title={`${day.conversions} conversions`}
                        />
                      )}
                    </div>
                    {index % Math.ceil(chartData.length / 7) === 0 && (
                      <span className="text-xs text-muted-foreground">{day.date}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No data for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pageStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No landing pages yet.</p>
              <Link href="/landing/new">
                <Button className="mt-4">Create Your First Page</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageStats.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{page.title}</p>
                        <p className="text-sm text-muted-foreground">/{page.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          page.status === "published"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }
                      >
                        {page.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {page.recentViews.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {page.recentConversions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {page.conversionRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">{page.totalLeads}</TableCell>
                    <TableCell>
                      <Link href={`/landing/${page.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && change !== 0 && (
          <p
            className={`text-xs flex items-center gap-1 ${
              change > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {change > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change).toFixed(1)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
