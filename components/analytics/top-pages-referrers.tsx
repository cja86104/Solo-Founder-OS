'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  formatNumber,
  formatDuration,
  formatPercentage,
  type TopPage,
  type TopReferrer,
  type TopCampaign,
} from '@/types/analytics';
import { Button } from '@/components/ui/button';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  Globe,
  Users,
  Clock,
  ChevronRight,
  Search,
  Share2,
  Mail,
  Megaphone,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface TopPagesListProps {
  pages: TopPage[];
  isLoading?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export interface TopReferrersListProps {
  referrers: TopReferrer[];
  isLoading?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  currency?: string;
  className?: string;
}

export interface TopCampaignsListProps {
  campaigns: TopCampaign[];
  isLoading?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  currency?: string;
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getSourceIcon(source: string): React.ElementType {
  const lowercased = source.toLowerCase();
  if (lowercased.includes('google') || lowercased.includes('search')) return Search;
  if (lowercased.includes('facebook') || lowercased.includes('twitter') || lowercased.includes('linkedin') || lowercased.includes('social')) return Share2;
  if (lowercased.includes('email') || lowercased.includes('newsletter')) return Mail;
  if (lowercased.includes('campaign') || lowercased.includes('ad')) return Megaphone;
  if (lowercased === 'direct') return Users;
  return Globe;
}

function getSourceColor(source: string): string {
  const lowercased = source.toLowerCase();
  if (lowercased.includes('google')) return 'text-blue-500';
  if (lowercased.includes('facebook')) return 'text-blue-600';
  if (lowercased.includes('twitter')) return 'text-sky-500';
  if (lowercased.includes('linkedin')) return 'text-blue-700';
  if (lowercased === 'direct') return 'text-green-500';
  if (lowercased.includes('email')) return 'text-orange-500';
  return 'text-muted-foreground';
}

// =============================================================================
// Top Pages List
// =============================================================================

export function TopPagesList({
  pages,
  isLoading = false,
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  className,
}: TopPagesListProps) {
  const displayPages = useMemo(() => {
    return pages.slice(0, maxItems);
  }, [pages, maxItems]);

  const maxViews = useMemo(() => {
    return Math.max(...pages.map((p) => p.views), 1);
  }, [pages]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pages.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Top Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No page data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Top Pages
          </CardTitle>
          <CardDescription>Most visited pages</CardDescription>
        </div>
        {showViewAll && pages.length > maxItems && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayPages.map((page, index) => (
            <div key={page.path} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <span className="text-sm text-muted-foreground w-5 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium truncate cursor-default">
                            {page.title || page.path}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{page.path}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatNumber(page.unique_views)} unique
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(page.avg_duration)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{formatNumber(page.views)}</p>
                  <p className="text-xs text-muted-foreground">views</p>
                </div>
              </div>
              <Progress
                value={(page.views / maxViews) * 100}
                className="h-1.5"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Top Referrers List
// =============================================================================

export function TopReferrersList({
  referrers,
  isLoading = false,
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  className,
}: TopReferrersListProps) {
  const displayReferrers = useMemo(() => {
    return referrers.slice(0, maxItems);
  }, [referrers, maxItems]);

  const maxVisitors = useMemo(() => {
    return Math.max(...referrers.map((r) => r.visitors), 1);
  }, [referrers]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (referrers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No referrer data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Referrers
          </CardTitle>
          <CardDescription>Where your visitors come from</CardDescription>
        </div>
        {showViewAll && referrers.length > maxItems && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayReferrers.map((referrer) => {
            const Icon = getSourceIcon(referrer.source);
            const colorClass = getSourceColor(referrer.source);

            return (
              <div key={referrer.source} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn('p-2 rounded-full bg-muted', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{referrer.source}</p>
                      {referrer.medium && (
                        <p className="text-xs text-muted-foreground truncate">
                          {referrer.medium}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">
                      {formatNumber(referrer.visitors)}
                    </p>
                    <p className="text-xs text-muted-foreground">visitors</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(referrer.visitors / maxVisitors) * 100}
                    className="h-1.5 flex-1"
                  />
                  {referrer.conversion_rate > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {formatPercentage(referrer.conversion_rate, 1)} conv
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Top Campaigns List
// =============================================================================

export function TopCampaignsList({
  campaigns,
  isLoading = false,
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  currency = 'USD',
  className,
}: TopCampaignsListProps) {
  const displayCampaigns = useMemo(() => {
    return campaigns.slice(0, maxItems);
  }, [campaigns, maxItems]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Top Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No campaign data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Top Campaigns
          </CardTitle>
          <CardDescription>UTM campaign performance</CardDescription>
        </div>
        {showViewAll && campaigns.length > maxItems && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Visitors</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayCampaigns.map((campaign) => (
              <TableRow key={campaign.name}>
                <TableCell>
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.source} / {campaign.medium}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(campaign.visitors)}
                </TableCell>
                <TableCell className="text-right">
                  <div>
                    <p>{campaign.conversions}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(campaign.conversion_rate, 1)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency,
                    minimumFractionDigits: 0,
                  }).format(campaign.conversion_value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
