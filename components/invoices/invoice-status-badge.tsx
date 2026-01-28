'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/types/invoices';
import {
  FileText,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    icon: FileText,
  },
  sent: {
    label: 'Sent',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    icon: Send,
  },
  viewed: {
    label: 'Viewed',
    variant: 'default',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    icon: Eye,
  },
  paid: {
    label: 'Paid',
    variant: 'default',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
    icon: CheckCircle,
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-500 hover:bg-gray-50',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    variant: 'default',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    icon: RotateCcw,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  default: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function InvoiceStatusBadge({
  status,
  showIcon = true,
  size = 'default',
  className,
}: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium gap-1.5',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {config.label}
    </Badge>
  );
}

interface InvoiceStatusDotProps {
  status: InvoiceStatus;
  className?: string;
}

const dotColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-400',
  sent: 'bg-blue-500',
  viewed: 'bg-purple-500',
  paid: 'bg-green-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-gray-400',
  refunded: 'bg-amber-500',
};

export function InvoiceStatusDot({ status, className }: InvoiceStatusDotProps) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', dotColors[status], className)}
      title={statusConfig[status].label}
    />
  );
}

interface InvoicePaymentStatusProps {
  total: number;
  amountPaid: number;
  currency?: string;
  className?: string;
}

export function InvoicePaymentStatus({
  total,
  amountPaid,
  currency = 'USD',
  className,
}: InvoicePaymentStatusProps) {
  const balanceDue = Math.max(0, total - amountPaid);
  const percentPaid = total > 0 ? Math.round((amountPaid / total) * 100) : 0;
  const isPaid = balanceDue === 0 && total > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (isPaid) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium text-green-600">Paid in Full</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Balance Due</span>
        <span className="font-semibold">{formatCurrency(balanceDue)}</span>
      </div>
      {amountPaid > 0 && (
        <>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${percentPaid}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(amountPaid)} paid ({percentPaid}%)
          </div>
        </>
      )}
    </div>
  );
}
