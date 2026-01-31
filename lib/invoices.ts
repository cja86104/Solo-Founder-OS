// ============================================================================
// Founders Helm - Invoice Utilities
// Helper functions for invoice operations
// ============================================================================

import type {
  Invoice,
  InvoiceItem,
  InvoiceWithRelations,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  InvoiceStats,
  InvoiceSummary,
  InvoiceStatus,
} from '@/types/invoices';

// ============================================================================
// INVOICE NUMBER GENERATION
// ============================================================================

/**
 * Generate a client-side invoice number preview
 * The actual number should be generated server-side using the database function
 */
export function generateInvoiceNumberPreview(
  existingNumbers: string[],
  prefix: string = 'INV'
): string {
  const year = new Date().getFullYear();
  const basePrefix = `${prefix}-${year}-`;
  
  const existingNums = existingNumbers
    .filter(num => num.startsWith(basePrefix))
    .map(num => {
      const numPart = num.substring(basePrefix.length);
      return parseInt(numPart, 10) || 0;
    });
  
  const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
  const nextNum = maxNum + 1;
  
  return `${basePrefix}${nextNum.toString().padStart(4, '0')}`;
}

// ============================================================================
// INVOICE CALCULATIONS
// ============================================================================

/**
 * Prepare invoice items with calculated amounts
 */
export function prepareInvoiceItems(
  items: CreateInvoiceItemInput[]
): CreateInvoiceItemInput[] {
  return items.map((item, index) => ({
    ...item,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? 'unit',
    is_taxable: item.is_taxable ?? true,
    tax_rate: item.tax_rate ?? 0,
    position: item.position ?? index,
    type: item.type ?? 'service',
  }));
}

/**
 * Calculate totals for an invoice from items
 */
export function calculateInvoiceTotals(
  items: Array<{ quantity: number; unit_price: number; is_taxable?: boolean; amount?: number }>,
  taxRate: number = 0,
  discountAmount: number = 0
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => {
    const amount = item.amount ?? item.quantity * item.unit_price;
    return sum + amount;
  }, 0);
  
  const taxableSubtotal = items.reduce((sum, item) => {
    if (item.is_taxable === false) return sum;
    const amount = item.amount ?? item.quantity * item.unit_price;
    return sum + amount;
  }, 0);
  
  const taxAmount = Math.round(taxableSubtotal * taxRate) / 100;
  const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
  
  return { subtotal, taxAmount, total };
}

// ============================================================================
// INVOICE STATISTICS
// ============================================================================

/**
 * Calculate statistics from a list of invoices
 */
export function calculateInvoiceStats(invoices: Invoice[]): InvoiceStats {
  const byStatus: Record<InvoiceStatus, { count: number; amount: number }> = {
    draft: { count: 0, amount: 0 },
    sent: { count: 0, amount: 0 },
    viewed: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
  };
  
  let totalAmount = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  
  for (const invoice of invoices) {
    byStatus[invoice.status].count += 1;
    byStatus[invoice.status].amount += invoice.total;
    
    totalAmount += invoice.total;
    totalPaid += invoice.amount_paid;
    
    if (invoice.status !== 'paid' && invoice.status !== 'cancelled') {
      const outstanding = invoice.total - invoice.amount_paid;
      totalOutstanding += outstanding;
      
      if (invoice.status === 'overdue') {
        totalOverdue += outstanding;
      }
    }
  }
  
  return {
    total_invoices: invoices.length,
    total_amount: totalAmount,
    total_paid: totalPaid,
    total_outstanding: totalOutstanding,
    total_overdue: totalOverdue,
    by_status: byStatus,
  };
}

/**
 * Get invoice summary for dashboard display
 */
export function getInvoiceSummary(invoices: Invoice[]): InvoiceSummary {
  const summary: InvoiceSummary = {
    draft_count: 0,
    draft_amount: 0,
    sent_count: 0,
    sent_amount: 0,
    paid_count: 0,
    paid_amount: 0,
    overdue_count: 0,
    overdue_amount: 0,
  };
  
  for (const invoice of invoices) {
    switch (invoice.status) {
      case 'draft':
        summary.draft_count += 1;
        summary.draft_amount += invoice.total;
        break;
      case 'sent':
      case 'viewed':
        summary.sent_count += 1;
        summary.sent_amount += invoice.total - invoice.amount_paid;
        break;
      case 'paid':
        summary.paid_count += 1;
        summary.paid_amount += invoice.total;
        break;
      case 'overdue':
        summary.overdue_count += 1;
        summary.overdue_amount += invoice.total - invoice.amount_paid;
        break;
    }
  }
  
  return summary;
}

// ============================================================================
// INVOICE VALIDATION
// ============================================================================

export interface InvoiceValidationError {
  field: string;
  message: string;
}

/**
 * Validate invoice input before submission
 */
export function validateInvoiceInput(
  input: CreateInvoiceInput
): InvoiceValidationError[] {
  const errors: InvoiceValidationError[] = [];
  
  if (!input.client_name?.trim()) {
    errors.push({ field: 'client_name', message: 'Client name is required' });
  }
  
  if (!input.client_email?.trim()) {
    errors.push({ field: 'client_email', message: 'Client email is required' });
  } else if (!isValidEmail(input.client_email)) {
    errors.push({ field: 'client_email', message: 'Invalid email format' });
  }
  
  if (!input.due_date) {
    errors.push({ field: 'due_date', message: 'Due date is required' });
  } else {
    const dueDate = new Date(input.due_date);
    const issueDate = input.issue_date ? new Date(input.issue_date) : new Date();
    if (dueDate < issueDate) {
      errors.push({ field: 'due_date', message: 'Due date must be after issue date' });
    }
  }
  
  if (input.tax_rate !== undefined && (input.tax_rate < 0 || input.tax_rate > 100)) {
    errors.push({ field: 'tax_rate', message: 'Tax rate must be between 0 and 100' });
  }
  
  if (input.discount_amount !== undefined && input.discount_amount < 0) {
    errors.push({ field: 'discount_amount', message: 'Discount cannot be negative' });
  }
  
  if (input.items && input.items.length > 0) {
    input.items.forEach((item, index) => {
      if (!item.description?.trim()) {
        errors.push({
          field: `items[${index}].description`,
          message: `Item ${index + 1} description is required`,
        });
      }
      if (item.unit_price < 0) {
        errors.push({
          field: `items[${index}].unit_price`,
          message: `Item ${index + 1} price cannot be negative`,
        });
      }
      if (item.quantity !== undefined && item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: `Item ${index + 1} quantity must be greater than 0`,
        });
      }
    });
  }
  
  return errors;
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// INVOICE FORMATTING
// ============================================================================

/**
 * Format invoice for display
 */
export function formatInvoiceForDisplay(invoice: InvoiceWithRelations): {
  formattedTotal: string;
  formattedSubtotal: string;
  formattedTax: string;
  formattedDiscount: string;
  formattedPaid: string;
  formattedBalance: string;
  formattedIssueDate: string;
  formattedDueDate: string;
  isPaid: boolean;
  isOverdue: boolean;
  daysUntilDue: number;
} {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const balance = invoice.total - invoice.amount_paid;
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    formattedTotal: formatCurrency(invoice.total),
    formattedSubtotal: formatCurrency(invoice.subtotal),
    formattedTax: formatCurrency(invoice.tax_amount),
    formattedDiscount: formatCurrency(invoice.discount_amount),
    formattedPaid: formatCurrency(invoice.amount_paid),
    formattedBalance: formatCurrency(balance),
    formattedIssueDate: formatDate(invoice.issue_date),
    formattedDueDate: formatDate(invoice.due_date),
    isPaid: invoice.status === 'paid',
    isOverdue: invoice.status === 'overdue' || (daysUntilDue < 0 && invoice.status !== 'paid'),
    daysUntilDue,
  };
}

// ============================================================================
// INVOICE TEMPLATES
// ============================================================================

/**
 * Default terms text for new invoices
 */
export const DEFAULT_INVOICE_TERMS = `Payment is due within the specified due date. Late payments may be subject to interest charges.

Please include the invoice number in your payment reference.

Thank you for your business!`;

/**
 * Default footer text for new invoices
 */
export const DEFAULT_INVOICE_FOOTER = 'Thank you for your business!';

/**
 * Get default invoice settings
 */
export function getDefaultInvoiceSettings(): {
  currency: string;
  taxRate: number;
  terms: string;
  footer: string;
  accentColor: string;
} {
  return {
    currency: 'USD',
    taxRate: 0,
    terms: DEFAULT_INVOICE_TERMS,
    footer: DEFAULT_INVOICE_FOOTER,
    accentColor: '#6366f1',
  };
}

// ============================================================================
// INVOICE FILTERING AND SORTING
// ============================================================================

/**
 * Filter invoices by search query
 */
export function filterInvoicesBySearch(
  invoices: InvoiceWithRelations[],
  query: string
): InvoiceWithRelations[] {
  if (!query.trim()) return invoices;
  
  const lowerQuery = query.toLowerCase();
  
  return invoices.filter(invoice => {
    return (
      invoice.invoice_number.toLowerCase().includes(lowerQuery) ||
      invoice.client_name.toLowerCase().includes(lowerQuery) ||
      invoice.client_email.toLowerCase().includes(lowerQuery) ||
      (invoice.client_company?.toLowerCase().includes(lowerQuery) ?? false) ||
      (invoice.reference?.toLowerCase().includes(lowerQuery) ?? false) ||
      (invoice.project?.name.toLowerCase().includes(lowerQuery) ?? false)
    );
  });
}

/**
 * Sort invoices by various fields
 */
export function sortInvoices(
  invoices: InvoiceWithRelations[],
  sortBy: 'date' | 'due_date' | 'amount' | 'status' | 'number',
  sortOrder: 'asc' | 'desc' = 'desc'
): InvoiceWithRelations[] {
  const sorted = [...invoices].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
        break;
      case 'due_date':
        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        break;
      case 'amount':
        comparison = a.total - b.total;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'number':
        comparison = a.invoice_number.localeCompare(b.invoice_number);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

// ============================================================================
// INVOICE EXPORT
// ============================================================================

/**
 * Convert invoice to CSV row data
 */
export function invoiceToCSVRow(invoice: Invoice): Record<string, string | number> {
  return {
    invoice_number: invoice.invoice_number,
    status: invoice.status,
    client_name: invoice.client_name,
    client_email: invoice.client_email,
    client_company: invoice.client_company ?? '',
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    paid_date: invoice.paid_date ?? '',
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    discount_amount: invoice.discount_amount,
    total: invoice.total,
    amount_paid: invoice.amount_paid,
    balance_due: invoice.total - invoice.amount_paid,
    created_at: invoice.created_at,
  };
}

/**
 * Generate CSV string from invoices
 */
export function invoicesToCSV(invoices: Invoice[]): string {
  if (invoices.length === 0) return '';
  
  const rows = invoices.map(invoiceToCSVRow);
  const headers = Object.keys(rows[0]);
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];
  
  return csvLines.join('\n');
}

// ============================================================================
// PAYMENT HELPERS
// ============================================================================

/**
 * Calculate remaining balance after a payment
 */
export function calculateRemainingBalance(
  invoiceTotal: number,
  currentPaid: number,
  newPayment: number
): number {
  return Math.max(0, invoiceTotal - currentPaid - newPayment);
}

/**
 * Check if a payment would overpay the invoice
 */
export function isOverpayment(
  invoiceTotal: number,
  currentPaid: number,
  newPayment: number
): boolean {
  return currentPaid + newPayment > invoiceTotal;
}
