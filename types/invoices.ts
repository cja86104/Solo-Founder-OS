// ============================================================================
// Founders Helm - Invoice Types
// Invoices, Invoice Items, Payments, and Activities
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type InvoiceItemType = 'service' | 'product' | 'expense' | 'discount' | 'tax';
export type PaymentMethod = 'stripe' | 'paypal' | 'bank_transfer' | 'cash' | 'check' | 'other';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Invoice {
  id: string;
  workspace_id: string;
  user_id: string;
  
  // Invoice identification
  invoice_number: string;
  reference: string | null;
  
  // Client information
  contact_id: string | null;
  client_name: string;
  client_email: string;
  client_company: string | null;
  client_address: string | null;
  client_phone: string | null;
  client_tax_id: string | null;
  
  // Project link
  project_id: string | null;
  
  // Dates
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  
  // Financial
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  
  // Status and tracking
  status: InvoiceStatus;
  sent_at: string | null;
  viewed_at: string | null;
  view_count: number;
  
  // Payment
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  
  // Content
  notes: string | null;
  terms: string | null;
  footer: string | null;
  
  // Branding
  logo_url: string | null;
  accent_color: string;
  
  // Public access
  public_token: string;
  
  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  workspace_id: string;
  
  // Item details
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  
  // Tax handling
  is_taxable: boolean;
  tax_rate: number;
  
  // Optional links
  task_id: string | null;
  time_entry_id: string | null;
  
  // Ordering
  position: number;
  
  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  workspace_id: string;
  user_id: string;
  
  // Payment details
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  reference: string | null;
  
  // Dates
  payment_date: string;
  
  // Notes
  notes: string | null;
  
  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface InvoiceActivity {
  id: string;
  invoice_id: string;
  workspace_id: string;
  user_id: string | null;
  
  // Activity details
  action: string;
  description: string | null;
  
  // Status changes
  from_status: InvoiceStatus | null;
  to_status: InvoiceStatus | null;
  
  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// EXTENDED INTERFACES (with relations)
// ============================================================================

export interface InvoiceWithRelations extends Invoice {
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  activities?: InvoiceActivity[];
  contact?: {
    id: string;
    name: string | null;
    email: string;
    company: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
    color: string;
  } | null;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface InvoiceItemWithRelations extends InvoiceItem {
  task?: {
    id: string;
    title: string;
  } | null;
  time_entry?: {
    id: string;
    description: string | null;
    duration_minutes: number | null;
  } | null;
}

export interface InvoicePaymentWithRelations extends InvoicePayment {
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface InvoiceActivityWithRelations extends InvoiceActivity {
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateInvoiceInput {
  // Client (either contact_id or manual client info)
  contact_id?: string;
  client_name: string;
  client_email: string;
  client_company?: string;
  client_address?: string;
  client_phone?: string;
  client_tax_id?: string;
  
  // Project link
  project_id?: string;
  
  // Dates
  issue_date?: string;
  due_date: string;
  
  // Financial
  currency?: string;
  tax_rate?: number;
  discount_amount?: number;
  
  // Content
  notes?: string;
  terms?: string;
  footer?: string;
  
  // Branding
  logo_url?: string;
  accent_color?: string;
  
  // Items
  items?: CreateInvoiceItemInput[];
  
  // Reference
  reference?: string;
}

export interface UpdateInvoiceInput extends Partial<Omit<CreateInvoiceInput, 'items'>> {
  status?: InvoiceStatus;
  payment_method?: PaymentMethod;
  payment_reference?: string;
}

export interface CreateInvoiceItemInput {
  type?: InvoiceItemType;
  description: string;
  quantity?: number;
  unit?: string;
  unit_price: number;
  is_taxable?: boolean;
  tax_rate?: number;
  task_id?: string;
  time_entry_id?: string;
  position?: number;
}

export interface UpdateInvoiceItemInput extends Partial<CreateInvoiceItemInput> {
  id?: string;
}

export interface CreatePaymentInput {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  reference?: string;
  notes?: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  contact_id?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  min_amount?: number;
  max_amount?: number;
  is_overdue?: boolean;
}

// ============================================================================
// STATS TYPES
// ============================================================================

export interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  by_status: Record<InvoiceStatus, { count: number; amount: number }>;
}

export interface InvoiceSummary {
  draft_count: number;
  draft_amount: number;
  sent_count: number;
  sent_amount: number;
  paid_count: number;
  paid_amount: number;
  overdue_count: number;
  overdue_amount: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'bg-gray-500',
    sent: 'bg-blue-500',
    viewed: 'bg-purple-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500',
    cancelled: 'bg-gray-400',
    refunded: 'bg-amber-500',
  };
  return colors[status];
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status];
}

export function getInvoiceStatusTextColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'text-gray-600',
    sent: 'text-blue-600',
    viewed: 'text-purple-600',
    paid: 'text-green-600',
    overdue: 'text-red-600',
    cancelled: 'text-gray-500',
    refunded: 'text-amber-600',
  };
  return colors[status];
}

export function getItemTypeLabel(type: InvoiceItemType): string {
  const labels: Record<InvoiceItemType, string> = {
    service: 'Service',
    product: 'Product',
    expense: 'Expense',
    discount: 'Discount',
    tax: 'Tax',
  };
  return labels[type];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    check: 'Check',
    other: 'Other',
  };
  return labels[method];
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
  const icons: Record<PaymentMethod, string> = {
    stripe: 'credit-card',
    paypal: 'wallet',
    bank_transfer: 'building-2',
    cash: 'banknote',
    check: 'file-text',
    other: 'circle-dot',
  };
  return icons[method];
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateItemAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calculateInvoiceSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function calculateInvoiceTax(items: InvoiceItem[], taxRate: number): number {
  const taxableAmount = items
    .filter(item => item.is_taxable)
    .reduce((sum, item) => sum + item.amount, 0);
  return Math.round(taxableAmount * taxRate) / 100;
}

export function calculateInvoiceTotal(
  subtotal: number,
  taxAmount: number,
  discountAmount: number
): number {
  return Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
}

export function getInvoiceBalanceDue(invoice: Invoice): number {
  return Math.max(0, invoice.total - invoice.amount_paid);
}

export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export function getDaysUntilDue(invoice: Invoice): number {
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysOverdue(invoice: Invoice): number {
  const days = getDaysUntilDue(invoice);
  return days < 0 ? Math.abs(days) : 0;
}

export function getInvoiceProgress(invoice: Invoice): number {
  if (invoice.total === 0) return 0;
  return Math.min(100, Math.round((invoice.amount_paid / invoice.total) * 100));
}
