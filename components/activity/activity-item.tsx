'use client';

import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Briefcase,
  MessageSquare,
  Clock,
  CheckCircle,
  PlusCircle,
  Edit,
  Trash,
  Eye,
  Mail,
  Phone,
  Calendar,
  Star,
  Tag,
  Settings,
  Shield,
  LogIn,
  LogOut,
  UserPlus,
  FolderPlus,
  Send,
  Archive,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import type { Activity } from '@/types/activity';

export type ActivityVariant = 'default' | 'compact' | 'detailed';

interface ActivityItemProps {
  activity: Activity;
  variant?: ActivityVariant;
  showUser?: boolean;
  showCategory?: boolean;
  className?: string;
}

// Map activity types to icons
const typeIcons: Record<string, LucideIcon> = {
  contact: Users,
  deal: Briefcase,
  content: FileText,
  feedback: MessageSquare,
  project: FolderPlus,
  task: CheckCircle,
  time_entry: Clock,
  vault: Archive,
  landing_page: FileText,
  workspace: Settings,
  member: UserPlus,
  auth: Shield,
  audit: Eye,
};

// Map actions to icons
const actionIcons: Record<string, LucideIcon> = {
  created: PlusCircle,
  updated: Edit,
  deleted: Trash,
  viewed: Eye,
  completed: CheckCircle,
  sent: Send,
  received: Mail,
  called: Phone,
  scheduled: Calendar,
  starred: Star,
  tagged: Tag,
  archived: Archive,
  restored: RefreshCw,
  login: LogIn,
  logout: LogOut,
  invited: UserPlus,
};

// Map types to colors
const typeColors: Record<string, string> = {
  contact: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  deal: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  content: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  feedback: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  project: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  task: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  time_entry: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  vault: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  landing_page: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  workspace: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  member: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  auth: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  audit: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function getActivityIcon(type: string, action: string): LucideIcon {
  // First try action-specific icon
  if (actionIcons[action]) {
    return actionIcons[action];
  }
  // Fall back to type icon
  return typeIcons[type] || FileText;
}

function formatActivityMessage(activity: Activity): string {
  const { type, action, entity_type } = activity;
  
  // Build a human-readable message
  const actionVerb = action.replace(/_/g, ' ');
  const entityName = entity_type?.replace(/_/g, ' ') || type;
  
  return `${actionVerb} ${entityName}`;
}

export function ActivityItem({
  activity,
  variant = 'default',
  showUser = true,
  className,
}: ActivityItemProps) {
  const Icon = getActivityIcon(activity.type, activity.action);
  const colorClass = typeColors[activity.type] || typeColors.audit;
  const message = activity.description || formatActivityMessage(activity);
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

  // Get user info from metadata if available
  const userInfo = activity.metadata as { user_name?: string; user_avatar?: string } | null;
  const userName = userInfo?.user_name || 'Unknown User';
  const userAvatar = userInfo?.user_avatar;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 py-1', className)}>
        <div className={cn('p-1 rounded', colorClass)}>
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-sm truncate flex-1">{message}</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('flex gap-4 p-4 border rounded-lg', className)}>
        {showUser && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {showUser && <span className="font-medium">{userName}</span>}
            <Badge variant="secondary" className={cn('text-xs', colorClass)}>
              <Icon className="h-3 w-3 mr-1" />
              {activity.type}
            </Badge>
          </div>
          <p className="text-sm">{message}</p>
          {activity.entity_id && (
            <p className="text-xs text-muted-foreground">
              {activity.entity_type}: {activity.entity_id}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-start gap-3 py-3', className)}>
      <div className={cn('p-2 rounded-full', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {showUser && (
            <>
              <Avatar className="h-5 w-5">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-xs">{userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{userName}</span>
            </>
          )}
          <span className="text-sm text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm mt-1">{message}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
        )}
      </div>
    </div>
  );
}

// List component for rendering multiple activities
interface ActivityListProps {
  activities: Activity[];
  variant?: ActivityVariant;
  showUser?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ActivityList({
  activities,
  variant = 'default',
  showUser = true,
  emptyMessage = 'No activity yet',
  className,
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('divide-y', className)}>
      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          variant={variant}
          showUser={showUser}
        />
      ))}
    </div>
  );
}
