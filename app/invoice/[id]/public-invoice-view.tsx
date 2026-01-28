'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Printer,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  is_taxable: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  reference: string | null;
  client_name: string;
  client_email: string;
  client_company: string | null;
  client_address: string | null;
  client_phone: string | null;
  client_tax_id: string | null;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  status: string;
  notes: string | null;
  terms: string | null;
  footer: string | null;
  logo_url: string | null;
  accent_color: string;
  project?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Workspace {
  name: string;
  logo_url: string | null;
}

interface PublicInvoiceViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  workspace: Workspace | null;
}

export function PublicInvoiceView({ invoice, items, workspace }: PublicInvoiceViewProps) {
  const accentColor = invoice.accent_color || '#6366f1';
  const logoUrl = invoice.logo_url || workspace?.logo_url;
  const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.open(`/api/invoices/${invoice.id}/pdf?token=${new URLSearchParams(window.location.search).get('token')}`, '_blank');
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      draft: {
        label: 'Draft',
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-gray-100 text-gray-700',
      },
      sent: {
        label: 'Awaiting Payment',
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-blue-100 text-blue-700',
      },
      viewed: {
        label: 'Awaiting Payment',
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-purple-100 text-purple-700',
      },
      paid: {
        label: 'Paid',
        icon: <CheckCircle className="h-4 w-4" />,
        className: 'bg-green-100 text-green-700',
      },
      overdue: {
        label: 'Overdue',
        icon: <AlertCircle className="h-4 w-4" />,
        className: 'bg-red-100 text-red-700',
      },
      cancelled: {
        label: 'Cancelled',
        icon: null,
        className: 'bg-gray-100 text-gray-500',
      },
      refunded: {
        label: 'Refunded',
        icon: null,
        className: 'bg-amber-100 text-amber-700',
      },
    };

    const config = statusConfig[invoice.status] || statusConfig.sent;

    return (
      <Badge className={`${config.className} gap-1.5 text-sm px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
      {/* Actions - Hidden on print */}
      <div className="max-w-4xl mx-auto px-4 mb-6 print:hidden">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="max-w-4xl mx-auto shadow-lg print:shadow-none print:border-none">
        <div
          className="h-2 print:h-1"
          style={{ backgroundColor: accentColor }}
        />
        <CardContent className="p-8 md:p-12 print:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="h-14 max-w-[220px] object-contain mb-4"
                />
              ) : (
                <h1
                  className="text-3xl font-bold mb-2"
                  style={{ color: accentColor }}
                >
                  {workspace?.name || 'INVOICE'}
                </h1>
              )}
            </div>
            <div className="text-right">
              <div
                className="text-4xl font-bold mb-3"
                style={{ color: accentColor }}
              >
                {invoice.invoice_number}
              </div>
              {getStatusBadge()}
              {invoice.reference && (
                <div className="text-sm text-muted-foreground mt-3">
                  Reference: {invoice.reference}
                </div>
              )}
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Bill To
              </h3>
              <div className="space-y-2">
                <div className="font-semibold text-xl">{invoice.client_name}</div>
                {invoice.client_company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    {invoice.client_company}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  {invoice.client_email}
                </div>
                {invoice.client_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {invoice.client_phone}
                  </div>
                )}
                {invoice.client_address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{invoice.client_address}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="md:text-right">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Issue Date
                  </div>
                  <div className="font-medium text-lg">
                    {format(new Date(invoice.issue_date), 'MMMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </div>
                  <div className="font-medium text-lg">
                    {format(new Date(invoice.due_date), 'MMMM d, yyyy')}
                  </div>
                </div>
                {invoice.paid_date && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Paid Date
                    </div>
                    <div className="font-medium text-lg text-green-600">
                      {format(new Date(invoice.paid_date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Line Items */}
          <div className="mb-10 overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr
                  className="text-sm font-semibold border-b-2"
                  style={{ borderColor: accentColor }}
                >
                  <th className="text-left pb-4" style={{ color: accentColor }}>
                    Description
                  </th>
                  <th className="text-center pb-4 w-28" style={{ color: accentColor }}>
                    Quantity
                  </th>
                  <th className="text-right pb-4 w-32" style={{ color: accentColor }}>
                    Rate
                  </th>
                  <th className="text-right pb-4 w-32" style={{ color: accentColor }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4">
                      <div className="font-medium">{item.description}</div>
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
          <div className="flex justify-end mb-10">
            <div className="w-full max-w-sm space-y-3">
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
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-xl">{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Amount Paid</span>
                  <span className="font-medium">-{formatCurrency(invoice.amount_paid)}</span>
                </div>
              )}
              {balanceDue > 0 && (
                <>
                  <Separator />
                  <div
                    className="flex justify-between py-4 px-5 rounded-lg"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <span className="font-bold text-lg">Balance Due</span>
                    <span
                      className="font-bold text-2xl"
                      style={{ color: accentColor }}
                    >
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </>
              )}
              {balanceDue === 0 && invoice.total > 0 && (
                <div className="flex justify-center py-4 px-5 rounded-lg bg-green-50 text-green-700">
                  <span className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    PAID IN FULL
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <>
              <Separator className="mb-8" />
              <div className="grid md:grid-cols-2 gap-8">
                {invoice.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Notes
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
            <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
              {invoice.footer}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 text-center text-xs text-muted-foreground">
        Generated on {format(new Date(), 'MMMM d, yyyy')}
      </div>
    </div>
  );
}
