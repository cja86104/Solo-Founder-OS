'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  AutomationStatus,
  AutomationRunStatus,
} from '@/types/automations';
import {
  Circle,
  Pause,
  FileEdit,
  Archive,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';

// =============================================================================
// Automation Status Badge
// =============================================================================

interface AutomationStatusBadgeProps {
  status: AutomationStatus;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  AutomationStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
    icon: React.ElementType;
    iconColor: string;
  }
> = {
  active: {
    label: 'Active',
    variant: 'success',
    icon: Circle,
    iconColor: 'text-green-500',
  },
  paused: {
    label: 'Paused',
    variant: 'warning',
    icon: Pause,
    iconColor: 'text-yellow-500',
  },
  draft: {
    label: 'Draft',
    variant: 'secondary',
    icon: FileEdit,
    iconColor: 'text-muted-foreground',
  },
  archived: {
    label: 'Archived',
    variant: 'outline',
    icon: Archive,
    iconColor: 'text-muted-foreground',
  },
};

export function AutomationStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className,
}: AutomationStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    default: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], 'gap-1', className)}
    >
      {showIcon && (
        <Icon
          className={cn(iconSizes[size], config.iconColor)}
          fill={status === 'active' ? 'currentColor' : 'none'}
        />
      )}
      {config.label}
    </Badge>
  );
}

// =============================================================================
// Run Status Badge
// =============================================================================

interface RunStatusBadgeProps {
  status: AutomationRunStatus;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const runStatusConfig: Record<
  AutomationRunStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
    icon: React.ElementType;
    animate?: boolean;
  }
> = {
  pending: {
    label: 'Pending',
    variant: 'secondary',
    icon: Clock,
  },
  running: {
    label: 'Running',
    variant: 'info',
    icon: Loader2,
    animate: true,
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    variant: 'destructive',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'warning',
    icon: Ban,
  },
};

export function RunStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className,
}: RunStatusBadgeProps) {
  const config = runStatusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    default: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], 'gap-1', className)}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            config.animate && 'animate-spin'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

// =============================================================================
// Trigger Type Badge
// =============================================================================

interface TriggerTypeBadgeProps {
  triggerType: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const triggerLabels: Record<string, string> = {
  new_contact: 'New Contact',
  contact_updated: 'Contact Updated',
  contact_tagged: 'Contact Tagged',
  deal_created: 'Deal Created',
  deal_stage_changed: 'Stage Changed',
  deal_won: 'Deal Won',
  deal_lost: 'Deal Lost',
  form_submitted: 'Form Submitted',
  feedback_received: 'Feedback',
  task_completed: 'Task Done',
  task_created: 'Task Created',
  scheduled: 'Scheduled',
  webhook: 'Webhook',
  manual: 'Manual',
};

export function TriggerTypeBadge({
  triggerType,
  size = 'default',
  className,
}: TriggerTypeBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge
      variant="outline"
      className={cn(sizeClasses[size], className)}
    >
      {triggerLabels[triggerType] || triggerType}
    </Badge>
  );
}
