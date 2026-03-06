'use client';

import { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatMRR,
  type Customer,
  type CustomerStatus,
} from '@/types/command';
import {
  CustomerStatusBadge,
  SubscriptionStatusBadge,
  ChurnRiskBadge,
  StatusDot,
} from './customer-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  ExternalLink,
  AlertTriangle,
  Users,
  Download,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface CustomerTableProps {
  customers: Customer[];
  isLoading?: boolean;
  onSelectCustomer?: (customer: Customer) => void;
  onViewCustomer?: (customer: Customer) => void;
  onEmailCustomer?: (customer: Customer) => void;
  onViewInStripe?: (customer: Customer) => void;
  onRefresh?: () => void;
  onSync?: () => void;
  onExport?: () => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pageSize?: number;
  className?: string;
}

type SortField = 'name' | 'email' | 'mrr' | 'status' | 'subscription_status' | 'churn_risk' | 'created_at' | 'ltv';
type SortDirection = 'asc' | 'desc';

// =============================================================================
// Helper Functions
// =============================================================================

function sortCustomers(
  customers: Customer[],
  field: SortField,
  direction: SortDirection
): Customer[] {
  return [...customers].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (field) {
      case 'name':
        aValue = (a.name || a.email).toLowerCase();
        bValue = (b.name || b.email).toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'mrr':
        aValue = a.mrr;
        bValue = b.mrr;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'subscription_status':
        aValue = a.subscription_status || '';
        bValue = b.subscription_status || '';
        break;
      case 'churn_risk':
        aValue = a.churn_risk_score;
        bValue = b.churn_risk_score;
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'ltv':
        aValue = a.lifetime_value;
        bValue = b.lifetime_value;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// =============================================================================
// Sort Header Component
// =============================================================================

interface SortHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

function SortHeader({ label, field, currentSort, direction, onSort }: SortHeaderProps) {
  const isActive = currentSort === field;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

// =============================================================================
// Customer Row Component
// =============================================================================

interface CustomerRowProps {
  customer: Customer;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onView?: () => void;
  onEmail?: () => void;
  onViewInStripe?: () => void;
}

function CustomerRow({
  customer,
  selectable,
  isSelected,
  onSelect,
  onView,
  onEmail,
  onViewInStripe,
}: CustomerRowProps) {
  const isAtRisk = customer.status === 'at_risk' || customer.churn_risk_score >= 50;

  return (
    <TableRow
      className={cn(
        'cursor-pointer hover:bg-muted/50',
        isAtRisk && 'bg-red-50/50 dark:bg-red-950/10'
      )}
      onClick={onView}
    >
      {selectable && (
        <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </TableCell>
      )}

      <TableCell>
        <div className="flex items-center gap-3">
          <StatusDot status={customer.status} pulse={customer.status === 'at_risk'} />
          <div className="min-w-0">
            <p className="font-medium truncate">
              {customer.name || 'No name'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {customer.email}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        {customer.company ? (
          <span className="text-sm">{customer.company}</span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell>
        <CustomerStatusBadge status={customer.status} size="sm" />
      </TableCell>

      <TableCell>
        {customer.subscription_status ? (
          <SubscriptionStatusBadge status={customer.subscription_status} size="sm" />
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-semibold">
                {formatCurrency(customer.mrr, customer.currency)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>MRR: {formatMRR(customer.mrr, customer.currency)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(customer.lifetime_value, customer.currency)}
        </span>
      </TableCell>

      <TableCell>
        <ChurnRiskBadge score={customer.churn_risk_score} size="sm" />
      </TableCell>

      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {format(new Date(customer.created_at), 'PPpp')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
            <DropdownMenuItem onClick={onView}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            {customer.stripe_customer_id && (
              <DropdownMenuItem onClick={onViewInStripe}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Stripe
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// Main CustomerTable Component
// =============================================================================

export function CustomerTable({
  customers,
  isLoading = false,
  onSelectCustomer: _onSelectCustomer,
  onViewCustomer,
  onEmailCustomer,
  onViewInStripe,
  onRefresh,
  onSync,
  onExport,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  pageSize = 10,
  className,
}: CustomerTableProps) {
  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('mrr');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.company?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Sort
    result = sortCustomers(result, sortField, sortDirection);

    return result;
  }, [customers, search, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(paginatedCustomers.map((c) => c.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedIds, id]);
    } else {
      onSelectionChange?.(selectedIds.filter((i) => i !== id));
    }
  };

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: customers.length,
      active: customers.filter((c) => c.status === 'active').length,
      new: customers.filter((c) => c.status === 'new').length,
      at_risk: customers.filter((c) => c.status === 'at_risk').length,
      churned: customers.filter((c) => c.status === 'churned').length,
    };
  }, [customers]);

  // Loading state
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

  // Empty state
  if (customers.length === 0) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sync your Stripe account to import customers.
          </p>
          {(onSync || onRefresh) && (
            <Button onClick={onSync || onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Customers
            </Button>
          )}
        </div>
      </div>
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
            placeholder="Search customers..."
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
            setStatusFilter(v as CustomerStatus | 'all');
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
            <SelectItem value="new">New ({statusCounts.new})</SelectItem>
            <SelectItem value="at_risk">At Risk ({statusCounts.at_risk})</SelectItem>
            <SelectItem value="churned">Churned ({statusCounts.churned})</SelectItem>
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {selectedIds.length > 0 && (
            <Badge variant="secondary">{selectedIds.length} selected</Badge>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      paginatedCustomers.length > 0 &&
                      paginatedCustomers.every((c) => selectedIds.includes(c.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>
                <SortHeader
                  label="Customer"
                  field="name"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>
                <SortHeader
                  label="Status"
                  field="status"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>
                <SortHeader
                  label="MRR"
                  field="mrr"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="LTV"
                  field="ltv"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Risk"
                  field="churn_risk"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Created"
                  field="created_at"
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={selectable ? 10 : 9}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mb-2" />
                    <p>No customers match your filters</p>
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
              paginatedCustomers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  selectable={selectable}
                  isSelected={selectedIds.includes(customer.id)}
                  onSelect={(checked) => handleSelectOne(customer.id, checked)}
                  onView={() => onViewCustomer?.(customer)}
                  onEmail={() => onEmailCustomer?.(customer)}
                  onViewInStripe={() => onViewInStripe?.(customer)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredCustomers.length)} of{' '}
            {filteredCustomers.length} customers
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
