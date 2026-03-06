'use client';

import { useState } from 'react';
import { ActivityWithActor, ActivityCategory, getCategoryLabel } from '@/types/activity';
import { ActivityItem } from '@/components/activity/activity-item';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Filter, ChevronDown, Activity } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================================================
// Activity Feed Props
// ============================================================================

interface ActivityFeedProps {
  workspaceId: string;
  activities?: ActivityWithActor[];
  isLoading?: boolean;
  error?: string | null;
  showFilters?: boolean;
  showRefresh?: boolean;
  maxHeight?: string;
  variant?: 'default' | 'compact' | 'detailed';
  groupByDate?: boolean;
  emptyMessage?: string;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

// ============================================================================
// Activity Feed Component
// ============================================================================

export function ActivityFeed({
  workspaceId: _workspaceId,
  activities = [],
  isLoading = false,
  error = null,
  showFilters = true,
  showRefresh = true,
  maxHeight = '600px',
  variant = 'default',
  groupByDate = true,
  emptyMessage = 'No activity yet',
  onRefresh,
  onLoadMore,
  hasMore = false,
  className,
}: ActivityFeedProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter activities
  const filteredActivities =
    categoryFilter === 'all'
      ? activities
      : activities.filter((a) => a.category === categoryFilter);

  // Group activities by date
  const groupedActivities = groupByDate
    ? groupActivitiesByDate(filteredActivities)
    : null;

  const categories: ActivityCategory[] = [
    'general',
    'contacts',
    'landing_pages',
    'code_vault',
    'crm',
    'content',
    'feedback',
    'projects',
    'settings',
  ];

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-destructive">{error}</p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {(showFilters || showRefresh) && (
        <div className="flex items-center justify-between">
          {showFilters && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {showRefresh && onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
              />
            </Button>
          )}
        </div>
      )}

      {/* Activity List */}
      <ScrollArea style={{ maxHeight }} className="pr-4">
        {isLoading && activities.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : groupByDate && groupedActivities ? (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, dateActivities]) => (
              <div key={date}>
                <div className="sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {date}
                  </h3>
                </div>
                <div className="divide-y">
                  {dateActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      variant={variant}
                      showCategory={categoryFilter === 'all'}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {filteredActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                variant={variant}
                showCategory={categoryFilter === 'all'}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && onLoadMore && (
          <div className="text-center py-4">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              Load More
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupActivitiesByDate(
  activities: ActivityWithActor[]
): Record<string, ActivityWithActor[]> {
  const groups: Record<string, ActivityWithActor[]> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.created_at);
    const label = getDateLabel(date);

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(activity);
  });

  return groups;
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE'); // Day name
  return format(date, 'MMMM d, yyyy');
}

// ============================================================================
// Mini Activity Feed (for dashboards/sidebars)
// ============================================================================

interface MiniActivityFeedProps {
  activities: ActivityWithActor[];
  limit?: number;
  onViewAll?: () => void;
  className?: string;
}

export function MiniActivityFeed({
  activities,
  limit = 5,
  onViewAll,
  className,
}: MiniActivityFeedProps) {
  const displayActivities = activities.slice(0, limit);

  return (
    <div className={className}>
      {displayActivities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent activity
        </p>
      ) : (
        <>
          <div className="divide-y">
            {displayActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                variant="compact"
                showCategory={false}
              />
            ))}
          </div>
          {activities.length > limit && onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="w-full mt-2"
            >
              View All Activity
            </Button>
          )}
        </>
      )}
    </div>
  );
}
