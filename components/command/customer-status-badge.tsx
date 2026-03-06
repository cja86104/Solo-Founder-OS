'use client';

import { cn } from '@/lib/utils';
import {
  getCustomerStatusLabel,
  getSubscriptionStatusLabel,
  calculateChurnRiskLevel,
  type CustomerStatus,
  type SubscriptionStatus,
} from '@/types/command';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserPlus,
  Clock,
  PauseCircle,
  CreditCard,
  AlertCircle,
  Sparkles,
  Ban,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface CustomerStatusBadgeProps {
  status: CustomerStatus;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export interface ChurnRiskBadgeProps {
  score: number;
  size?: 'sm' | 'default' | 'lg';
  showScore?: boolean;
  className?: string;
}

// =============================================================================
// Customer Status Icons
// =============================================================================

const customerStatusIcons: Record<CustomerStatus, React.ElementType> = {
  active: CheckCircle2,
  churned: XCircle,
  at_risk: AlertTriangle,
  new: UserPlus,
};

// =============================================================================
// Subscription Status Icons
// =============================================================================

const subscriptionStatusIcons: Record<SubscriptionStatus, React.ElementType> = {
  active: CheckCircle2,
  past_due: AlertCircle,
  canceled: XCircle,
  incomplete: Clock,
  incomplete_expired: Ban,
  trialing: Sparkles,
  unpaid: CreditCard,
  paused: PauseCircle,
};

// =============================================================================
// Size Configurations
// =============================================================================

const sizeConfig = {
  sm: {
    badge: 'text-xs px-1.5 py-0.5',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },
  default: {
    badge: 'text-xs px-2 py-1',
    icon: 'h-3.5 w-3.5',
    gap: 'gap-1.5',
  },
  lg: {
    badge: 'text-sm px-2.5 py-1',
    icon: 'h-4 w-4',
    gap: 'gap-2',
  },
};

// =============================================================================
// Customer Status Badge
// =============================================================================

export function CustomerStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  showLabel = true,
  className,
}: CustomerStatusBadgeProps) {
  const Icon = customerStatusIcons[status];
  const label = getCustomerStatusLabel(status);
  const config = sizeConfig[size];

  const variants: Record<CustomerStatus, string> = {
    active: 'bg-green-500/10 text-green-700 border-green-500/20',
    churned: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    at_risk: 'bg-red-500/10 text-red-700 border-red-500/20',
    new: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        config.badge,
        config.gap,
        variants[status],
        className
      )}
    >
      {showIcon && <Icon className={config.icon} />}
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}

// =============================================================================
// Subscription Status Badge
// =============================================================================

export function SubscriptionStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  showLabel = true,
  className,
}: SubscriptionStatusBadgeProps) {
  const Icon = subscriptionStatusIcons[status];
  const label = getSubscriptionStatusLabel(status);
  const config = sizeConfig[size];

  const variants: Record<SubscriptionStatus, string> = {
    active: 'bg-green-500/10 text-green-700 border-green-500/20',
    past_due: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    canceled: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    incomplete: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    incomplete_expired: 'bg-red-500/10 text-red-700 border-red-500/20',
    trialing: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    unpaid: 'bg-red-500/10 text-red-700 border-red-500/20',
    paused: 'bg-gray-400/10 text-gray-600 border-gray-400/20',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'font-medium cursor-default',
              config.badge,
              config.gap,
              variants[status],
              className
            )}
          >
            {showIcon && <Icon className={config.icon} />}
            {showLabel && <span>{label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <SubscriptionStatusDescription status={status} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// Subscription Status Description
// =============================================================================

function SubscriptionStatusDescription({ status }: { status: SubscriptionStatus }) {
  const descriptions: Record<SubscriptionStatus, string> = {
    active: 'Subscription is active and billing normally.',
    past_due: 'Payment is overdue. Subscription may be canceled soon.',
    canceled: 'Subscription has been canceled.',
    incomplete: 'Initial payment failed. Awaiting successful payment.',
    incomplete_expired: 'Initial payment never completed. Subscription expired.',
    trialing: 'Customer is in a free trial period.',
    unpaid: 'Multiple payment attempts failed.',
    paused: 'Subscription is temporarily paused.',
  };

  return <p className="text-sm max-w-[200px]">{descriptions[status]}</p>;
}

// =============================================================================
// Churn Risk Badge
// =============================================================================

export function ChurnRiskBadge({
  score,
  size = 'default',
  showScore = true,
  className,
}: ChurnRiskBadgeProps) {
  const level = calculateChurnRiskLevel(score);
  const config = sizeConfig[size];

  const levelConfig: Record<
    'low' | 'medium' | 'high' | 'critical',
    { label: string; variant: string; icon: React.ElementType }
  > = {
    low: {
      label: 'Low Risk',
      variant: 'bg-green-500/10 text-green-700 border-green-500/20',
      icon: CheckCircle2,
    },
    medium: {
      label: 'Medium Risk',
      variant: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      icon: AlertCircle,
    },
    high: {
      label: 'High Risk',
      variant: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      icon: AlertTriangle,
    },
    critical: {
      label: 'Critical Risk',
      variant: 'bg-red-500/10 text-red-700 border-red-500/20',
      icon: XCircle,
    },
  };

  const { label, variant, icon: Icon } = levelConfig[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn('font-medium cursor-default', config.badge, config.gap, variant, className)}
          >
            <Icon className={config.icon} />
            {showScore ? <span>{score}%</span> : <span>{label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              Churn probability: {score}%
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// Combined Status Display
// =============================================================================

export interface CombinedStatusDisplayProps {
  customerStatus: CustomerStatus;
  subscriptionStatus?: SubscriptionStatus | null;
  churnRiskScore?: number;
  size?: 'sm' | 'default' | 'lg';
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export function CombinedStatusDisplay({
  customerStatus,
  subscriptionStatus,
  churnRiskScore,
  size = 'default',
  layout = 'horizontal',
  className,
}: CombinedStatusDisplayProps) {
  return (
    <div
      className={cn(
        'flex',
        layout === 'horizontal' ? 'flex-row items-center gap-2 flex-wrap' : 'flex-col gap-1.5',
        className
      )}
    >
      <CustomerStatusBadge status={customerStatus} size={size} />
      {subscriptionStatus && (
        <SubscriptionStatusBadge status={subscriptionStatus} size={size} />
      )}
      {churnRiskScore !== undefined && churnRiskScore >= 25 && (
        <ChurnRiskBadge score={churnRiskScore} size={size} />
      )}
    </div>
  );
}

// =============================================================================
// Status Dot (minimal indicator)
// =============================================================================

export interface StatusDotProps {
  status: CustomerStatus | SubscriptionStatus;
  type?: 'customer' | 'subscription';
  size?: 'sm' | 'default' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function StatusDot({
  status,
  type = 'customer',
  size = 'default',
  pulse = false,
  className,
}: StatusDotProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    default: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const getColor = () => {
    if (type === 'customer') {
      const colors: Record<CustomerStatus, string> = {
        active: 'bg-green-500',
        churned: 'bg-gray-500',
        at_risk: 'bg-red-500',
        new: 'bg-blue-500',
      };
      return colors[status as CustomerStatus] || 'bg-gray-500';
    } else {
      const colors: Record<SubscriptionStatus, string> = {
        active: 'bg-green-500',
        past_due: 'bg-yellow-500',
        canceled: 'bg-gray-500',
        incomplete: 'bg-orange-500',
        incomplete_expired: 'bg-red-500',
        trialing: 'bg-blue-500',
        unpaid: 'bg-red-500',
        paused: 'bg-gray-400',
      };
      return colors[status as SubscriptionStatus] || 'bg-gray-500';
    }
  };

  return (
    <span className={cn('relative inline-flex', className)}>
      <span className={cn('rounded-full', dotSizes[size], getColor())} />
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            dotSizes[size],
            getColor()
          )}
        />
      )}
    </span>
  );
}
