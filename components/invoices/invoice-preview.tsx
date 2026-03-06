'use client';

import { format } from 'date-fns';
import type { InvoiceWithRelations, InvoiceItem } from '@/types/invoices';
import { InvoiceStatusBadge, InvoicePaymentStatus } from './invoice-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Download,
  Pencil,
  Copy,
  ExternalLink,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface InvoicePreviewProps {
  invoice: InvoiceWithRelations;
  items: InvoiceItem[];
  onEdit?: () => void;
  onSend?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  onRecordPayment?: () => void;
  onViewPublic?: () => void;
  className?: string;
}

export function InvoicePreview({
  invoice,
  items,
  onEdit,
  onSend,
  onDownload,
  onDuplicate,
  onRecordPayment,
  onViewPublic,
  className,
}: InvoicePreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);
  const canEdit = invoice.status === 'draft';
  const canSend = invoice.status === 'draft';
  const canRecordPayment = !['paid', 'cancelled', 'refunded'].includes(invoice.status);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {canSend && onSend && (
          <Button size="sm" onClick={onSend}>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        )}
        {canRecordPayment && onRecordPayment && (
          <Button variant="outline" size="sm" onClick={onRecordPayment}>
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
        {onDuplicate && (
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
        )}
        {onViewPublic && invoice.public_token && (
          <Button variant="ghost" size="sm" onClick={onViewPublic}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Public Link
          </Button>
        )}
      </div>

      {/* Invoice Card */}
      <Card className="overflow-hidden">
        <div
          className="h-2"
          style={{ backgroundColor: invoice.accent_color || '#6366f1' }}
        />
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div>
              {invoice.logo_url ? (
                <Image
                  src={invoice.logo_url}
                  alt="Logo"
                  width={200}
                  height={48}
                  className="h-12 max-w-[200px] object-contain mb-4"
                  unoptimized
                />
              ) : (
                <h1
                  className="text-2xl font-bold mb-2"
                  style={{ color: invoice.accent_color || '#6366f1' }}
                >
                  INVOICE
                </h1>
              )}
              <div className="space-y-1 text-sm text-muted-foreground">
                {invoice.project && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      style={{ borderColor: invoice.project.color }}
                    >
                      {invoice.project.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-2">
                {invoice.invoice_number}
              </div>
              <InvoiceStatusBadge status={invoice.status} size="lg" />
              {invoice.reference && (
                <div className="text-sm text-muted-foreground mt-2">
                  Ref: {invoice.reference}
                </div>
              )}
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Bill To
              </h3>
              <div className="space-y-2">
                <div className="font-semibold text-lg">{invoice.client_name}</div>
                {invoice.client_company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {invoice.client_company}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {invoice.client_email}
                </div>
                {invoice.client_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {invoice.client_phone}
                  </div>
                )}
                {invoice.client_address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span className="whitespace-pre-wrap">{invoice.client_address}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="md:text-right">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Issue Date</div>
                  <div className="font-medium">
                    {format(new Date(invoice.issue_date), 'MMMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Due Date</div>
                  <div className="font-medium">
                    {format(new Date(invoice.due_date), 'MMMM d, yyyy')}
                  </div>
                </div>
                {invoice.paid_date && (
                  <div>
                    <div className="text-sm text-muted-foreground">Paid Date</div>
                    <div className="font-medium text-green-600">
                      {format(new Date(invoice.paid_date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr
                  className="text-sm font-semibold"
                  style={{ color: invoice.accent_color || '#6366f1' }}
                >
                  <th className="text-left pb-3">Description</th>
                  <th className="text-center pb-3 w-24">Qty</th>
                  <th className="text-right pb-3 w-32">Rate</th>
                  <th className="text-right pb-3 w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4">
                      <div className="font-medium">{item.description}</div>
                      {item.type !== 'service' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.type}
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 text-center text-muted-foreground">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-4 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(invoice.discount_amount)}
                  </span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">
                    Tax ({invoice.tax_rate}%)
                  </span>
                  <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between py-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Amount Paid</span>
                  <span className="font-medium">
                    -{formatCurrency(invoice.amount_paid)}
                  </span>
                </div>
              )}
              {balanceDue > 0 && (
                <>
                  <Separator />
                  <div
                    className="flex justify-between py-3 px-4 rounded-lg"
                    style={{ backgroundColor: `${invoice.accent_color || '#6366f1'}10` }}
                  >
                    <span className="font-bold">Balance Due</span>
                    <span
                      className="font-bold text-lg"
                      style={{ color: invoice.accent_color || '#6366f1' }}
                    >
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </>
              )}
              {balanceDue === 0 && invoice.total > 0 && (
                <div className="flex justify-center py-3 px-4 rounded-lg bg-green-50 text-green-700">
                  <span className="font-bold">PAID IN FULL</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <>
              <Separator className="my-8" />
              <div className="grid md:grid-cols-2 gap-8">
                {invoice.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Notes
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Terms & Conditions
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          {invoice.footer && (
            <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
              {invoice.footer}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status */}
      {canRecordPayment && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Payment Status</h3>
            <InvoicePaymentStatus
              total={invoice.total}
              amountPaid={invoice.amount_paid}
              currency={invoice.currency}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InvoicePreviewCompactProps {
  invoice: InvoiceWithRelations;
  onClick?: () => void;
  className?: string;
}

export function InvoicePreviewCompact({
  invoice,
  onClick,
  className,
}: InvoicePreviewCompactProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  return (
    <Card
      className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">{invoice.invoice_number}</div>
          <InvoiceStatusBadge status={invoice.status} size="sm" showIcon={false} />
        </div>
        <div className="text-sm text-muted-foreground mb-2">{invoice.client_name}</div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">{formatCurrency(invoice.total)}</div>
          <div className="text-sm text-muted-foreground">
            Due {format(new Date(invoice.due_date), 'MMM d')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
