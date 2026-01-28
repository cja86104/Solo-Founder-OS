import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicInvoiceView } from './public-invoice-view';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  workspace_id: string;
  view_count: number | null;
  viewed_at: string | null;
  status: string | null;
  [key: string]: unknown;
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
    .single() as { data: { invoice_number: string; client_name: string } | null };

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
    .single() as { data: InvoiceRow | null; error: unknown };

  if (error || !invoice) {
    notFound();
  }

  // Fetch invoice items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('position', { ascending: true }) as { data: unknown[] | null };

  // Fetch workspace for branding
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, logo_url')
    .eq('id', invoice.workspace_id)
    .single() as { data: { name: string; logo_url: string | null } | null };

  // Update view tracking (don't await, fire and forget)
  supabase
    .from('invoices')
    .update({
      view_count: (invoice.view_count || 0) + 1,
      viewed_at: invoice.viewed_at || new Date().toISOString(),
      status: invoice.status === 'sent' ? 'viewed' : invoice.status,
    } as never)
    .eq('id', id)
    .then(() => {});

  return (
    <PublicInvoiceView
      invoice={invoice as never}
      items={(items || []) as never[]}
      workspace={workspace as never}
    />
  );
}
