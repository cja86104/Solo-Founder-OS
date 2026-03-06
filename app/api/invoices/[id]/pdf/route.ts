import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const publicToken = searchParams.get('token');
    const format = searchParams.get('format') || 'html'; // html or json

    let invoice;

    // Check for public access via token
    if (publicToken) {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          contact:contacts(id, name, email, company),
          project:projects(id, name, color)
        `)
        .eq('id', id)
        .eq('public_token', publicToken)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      invoice = data;
    } else {
      // Authenticated access
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          contact:contacts(id, name, email, company),
          project:projects(id, name, color)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Verify membership
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', data.workspace_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      }

      invoice = data;
    }

    // Fetch invoice items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true });

    // Fetch workspace for branding
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, logo_url, settings')
      .eq('id', invoice.workspace_id)
      .single();

    const invoiceData = {
      ...invoice,
      items: items || [],
      workspace,
    };

    // Return JSON format for client-side PDF generation
    if (format === 'json') {
      return NextResponse.json({ invoice: invoiceData });
    }

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoiceData as unknown as InvoiceData);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
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

interface InvoiceData {
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
  items: InvoiceItem[];
  workspace: {
    name: string;
    logo_url: string | null;
    settings: Record<string, unknown>;
  } | null;
}

function generateInvoiceHTML(invoice: InvoiceData): string {
  const accentColor = invoice.accent_color || '#6366f1';
  const logoUrl = invoice.logo_url || invoice.workspace?.logo_url;
  const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#6b7280',
      sent: '#3b82f6',
      viewed: '#8b5cf6',
      paid: '#22c55e',
      overdue: '#ef4444',
      cancelled: '#6b7280',
      refunded: '#f59e0b',
    };
    const color = colors[status] || '#6b7280';
    return `<span style="background-color: ${color}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${status}</span>`;
  };

  const itemsHTML = invoice.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.description)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${escapeHtml(item.unit)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(invoice.invoice_number)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background: #ffffff;
      padding: 40px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${accentColor};
    }
    .logo {
      max-height: 60px;
      max-width: 200px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 32px;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 8px;
    }
    .invoice-number {
      font-size: 14px;
      color: #6b7280;
    }
    .details-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .details-block {
      flex: 1;
    }
    .details-block h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .details-block p {
      font-size: 14px;
      margin-bottom: 4px;
    }
    .details-block .name {
      font-weight: 600;
      font-size: 16px;
    }
    .dates-block {
      text-align: right;
    }
    .date-row {
      display: flex;
      justify-content: flex-end;
      gap: 20px;
      margin-bottom: 8px;
    }
    .date-label {
      color: #6b7280;
      font-size: 14px;
    }
    .date-value {
      font-weight: 600;
      font-size: 14px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background-color: ${accentColor};
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    .items-table th:nth-child(2),
    .items-table th:nth-child(3),
    .items-table th:nth-child(4) {
      text-align: right;
    }
    .items-table th:nth-child(2) {
      text-align: center;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-block {
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-row.grand-total {
      border-bottom: none;
      border-top: 2px solid ${accentColor};
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
    }
    .total-row.balance-due {
      background-color: ${accentColor}10;
      padding: 12px;
      border-radius: 8px;
      margin-top: 8px;
    }
    .total-label {
      color: #6b7280;
    }
    .total-value {
      font-weight: 600;
    }
    .grand-total .total-label,
    .grand-total .total-value {
      color: ${accentColor};
    }
    .notes-section {
      margin-bottom: 30px;
    }
    .notes-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .notes-section p {
      font-size: 14px;
      white-space: pre-wrap;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .print-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: ${accentColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .print-button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="logo">` : `<div style="font-size: 24px; font-weight: 700; color: ${accentColor};">${escapeHtml(invoice.workspace?.name || 'Company')}</div>`}
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-number">${escapeHtml(invoice.invoice_number)}</div>
        <div style="margin-top: 8px;">${getStatusBadge(invoice.status)}</div>
      </div>
    </div>

    <div class="details-section">
      <div class="details-block">
        <h3>Bill To</h3>
        <p class="name">${escapeHtml(invoice.client_name)}</p>
        ${invoice.client_company ? `<p>${escapeHtml(invoice.client_company)}</p>` : ''}
        <p>${escapeHtml(invoice.client_email)}</p>
        ${invoice.client_phone ? `<p>${escapeHtml(invoice.client_phone)}</p>` : ''}
        ${invoice.client_address ? `<p>${escapeHtml(invoice.client_address)}</p>` : ''}
        ${invoice.client_tax_id ? `<p>Tax ID: ${escapeHtml(invoice.client_tax_id)}</p>` : ''}
      </div>
      <div class="details-block dates-block">
        <div class="date-row">
          <span class="date-label">Issue Date:</span>
          <span class="date-value">${formatDate(invoice.issue_date)}</span>
        </div>
        <div class="date-row">
          <span class="date-label">Due Date:</span>
          <span class="date-value">${formatDate(invoice.due_date)}</span>
        </div>
        ${invoice.paid_date ? `
        <div class="date-row">
          <span class="date-label">Paid Date:</span>
          <span class="date-value">${formatDate(invoice.paid_date)}</span>
        </div>
        ` : ''}
        ${invoice.reference ? `
        <div class="date-row">
          <span class="date-label">Reference:</span>
          <span class="date-value">${escapeHtml(invoice.reference)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="totals-block">
        <div class="total-row">
          <span class="total-label">Subtotal</span>
          <span class="total-value">${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${invoice.discount_amount > 0 ? `
        <div class="total-row">
          <span class="total-label">Discount</span>
          <span class="total-value">-${formatCurrency(invoice.discount_amount)}</span>
        </div>
        ` : ''}
        ${invoice.tax_amount > 0 ? `
        <div class="total-row">
          <span class="total-label">Tax (${invoice.tax_rate}%)</span>
          <span class="total-value">${formatCurrency(invoice.tax_amount)}</span>
        </div>
        ` : ''}
        <div class="total-row grand-total">
          <span class="total-label">Total</span>
          <span class="total-value">${formatCurrency(invoice.total)}</span>
        </div>
        ${invoice.amount_paid > 0 ? `
        <div class="total-row">
          <span class="total-label">Amount Paid</span>
          <span class="total-value">-${formatCurrency(invoice.amount_paid)}</span>
        </div>
        ` : ''}
        ${balanceDue > 0 ? `
        <div class="total-row balance-due">
          <span class="total-label" style="font-weight: 700;">Balance Due</span>
          <span class="total-value" style="font-weight: 700; color: ${accentColor};">${formatCurrency(balanceDue)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    ${invoice.notes ? `
    <div class="notes-section">
      <h3>Notes</h3>
      <p>${escapeHtml(invoice.notes)}</p>
    </div>
    ` : ''}

    ${invoice.terms ? `
    <div class="notes-section">
      <h3>Terms & Conditions</h3>
      <p>${escapeHtml(invoice.terms)}</p>
    </div>
    ` : ''}

    ${invoice.footer ? `
    <div class="footer">
      ${escapeHtml(invoice.footer)}
    </div>
    ` : ''}
  </div>

  <button class="print-button no-print" onclick="window.print()">
    Print / Save as PDF
  </button>
</body>
</html>`;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
