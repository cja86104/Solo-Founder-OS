'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import type { InvoiceWithRelations } from '@/types/invoices';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  Copy,
  FileDown,
  Trash2,
  Plus,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceListProps {
  invoices: InvoiceWithRelations[];
  summary?: {
    total_count: number;
    total_amount: number;
    total_paid: number;
    draft_count: number;
    sent_count: number;
    paid_count: number;
    overdue_count: number;
  };
  isLoading?: boolean;
  onView?: (invoice: InvoiceWithRelations) => void;
  onEdit?: (invoice: InvoiceWithRelations) => void;
  onSend?: (invoice: InvoiceWithRelations) => void;
  onDuplicate?: (invoice: InvoiceWithRelations) => void;
  onDownload?: (invoice: InvoiceWithRelations) => void;
  onDelete?: (invoice: InvoiceWithRelations) => void;
  onCreateNew?: () => void;
}

export function InvoiceList({
  invoices,
  summary,
  isLoading = false,
  onView,
  onEdit,
  onSend,
  onDuplicate,
  onDownload,
  onDelete,
  onCreateNew,
}: InvoiceListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      !search ||
      invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.client_email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <InvoiceListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Draft"
            value={summary.draft_count}
            icon={FileText}
            color="text-gray-600"
            bgColor="bg-gray-50"
          />
          <SummaryCard
            title="Outstanding"
            value={summary.sent_count}
            icon={Clock}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <SummaryCard
            title="Paid"
            value={summary.paid_count}
            icon={DollarSign}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <SummaryCard
            title="Overdue"
            value={summary.overdue_count}
            icon={AlertCircle}
            color="text-red-600"
            bgColor="bg-red-50"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        )}
      </div>

      {/* Invoice Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState onCreateNew={onCreateNew} hasFilters={!!search || statusFilter !== 'all'} />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div
                      className="font-medium text-primary hover:underline cursor-pointer"
                      onClick={() => onView?.(invoice)}
                    >
                      {invoice.invoice_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.client_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.client_email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </div>
                    {invoice.amount_paid > 0 && invoice.amount_paid < invoice.total && (
                      <div className="text-xs text-green-600">
                        {formatCurrency(invoice.amount_paid, invoice.currency)} paid
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <DueDateCell invoice={invoice} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(invoice)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => onEdit?.(invoice)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => onSend?.(invoice)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDuplicate?.(invoice)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload?.(invoice)}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        {['draft', 'cancelled'].includes(invoice.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete?.(invoice)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function SummaryCard({ title, value, icon: Icon, color, bgColor }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', bgColor)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DueDateCellProps {
  invoice: InvoiceWithRelations;
}

function DueDateCell({ invoice }: DueDateCellProps) {
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0 && invoice.status !== 'paid';
  const isDueSoon = diffDays >= 0 && diffDays <= 7 && invoice.status !== 'paid';

  return (
    <div>
      <div className={cn('font-medium', isOverdue && 'text-red-600')}>
        {format(new Date(invoice.due_date), 'MMM d, yyyy')}
      </div>
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <div
          className={cn(
            'text-xs',
            isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-muted-foreground'
          )}
        >
          {isOverdue
            ? `${Math.abs(diffDays)} days overdue`
            : diffDays === 0
            ? 'Due today'
            : diffDays === 1
            ? 'Due tomorrow'
            : `Due in ${diffDays} days`}
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  onCreateNew?: () => void;
  hasFilters: boolean;
}

function EmptyState({ onCreateNew, hasFilters }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {hasFilters ? 'No invoices found' : 'No invoices yet'}
        </h3>
        <p className="text-muted-foreground text-center mb-4 max-w-sm">
          {hasFilters
            ? 'Try adjusting your search or filters to find what you\'re looking for.'
            : 'Create your first invoice to start billing your clients.'}
        </p>
        {!hasFilters && onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="border rounded-lg p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
