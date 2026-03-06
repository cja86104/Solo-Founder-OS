import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicInvoiceView } from './public-invoice-view';
import type { Database } from '@/types/database';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

interface InvoiceContact {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface InvoiceProject {
  id: string;
  name: string;
  color: string;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  client_address: string | null;
  client_phone: string | null;
  client_tax_id: string | null;
  workspace_id: string;
  view_count: number | null;
  viewed_at: string | null;
  status: string | null;
  reference: string | null;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  currency: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total: number;
  amount_paid: number | null;
  notes: string | null;
  terms: string | null;
  footer: string | null;
  logo_url: string | null;
  accent_color: string | null;
  contact: InvoiceContact | null;
  project: InvoiceProject | null;
}

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

interface WorkspaceInfo {
  name: string;
  logo_url: string | null;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    return { title: 'Invoice Not Found' };
  }

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number, client_name')
    .eq('id', id)
    .eq('public_token', token)
    .single<{ invoice_number: string; client_name: string }>();

  if (!invoice) {
    return { title: 'Invoice Not Found' };
  }

  return {
    title: `Invoice ${invoice.invoice_number}`,
    description: `Invoice for ${invoice.client_name}`,
  };
}

export default async function PublicInvoicePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch invoice with public token
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      contact:contacts(id, name, email, company),
      project:projects(id, name, color)
    `)
    .eq('id', id)
    .eq('public_token', token)
    .single<InvoiceRow>();

  if (error || !invoice) {
    notFound();
  }

  // Fetch invoice items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('position', { ascending: true })
    .returns<InvoiceItem[]>();

  // Fetch workspace for branding
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, logo_url')
    .eq('id', invoice.workspace_id)
    .single<WorkspaceInfo>();

  // Update view tracking (don't await, fire and forget)
  // Note: Using type assertion due to Supabase client type inference limitations
  const updateData: Database["public"]["Tables"]["invoices"]["Update"] = {
    view_count: (invoice.view_count || 0) + 1,
    viewed_at: invoice.viewed_at || new Date().toISOString(),
    ...(invoice.status === 'sent' ? { status: 'viewed' as const } : {}),
  };
  supabase
    .from('invoices')
    .update(updateData as unknown as never)
    .eq('id', id)
    .then(() => {});

  // Normalize invoice data with defaults for nullable fields
  const normalizedInvoice = {
    ...invoice,
    tax_rate: invoice.tax_rate ?? 0,
    tax_amount: invoice.tax_amount ?? 0,
    discount_amount: invoice.discount_amount ?? 0,
    amount_paid: invoice.amount_paid ?? 0,
    accent_color: invoice.accent_color ?? '#6366f1',
    status: invoice.status ?? 'draft',
  };

  return (
    <PublicInvoiceView
      invoice={normalizedInvoice}
      items={items || []}
      workspace={workspace}
    />
  );
}
