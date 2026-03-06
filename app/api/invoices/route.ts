import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { InvoiceStatus } from '@/types/invoices';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        contact:contacts(id, name, email, company),
        project:projects(id, name, color)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Apply filters
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status as InvoiceStatus);
    }

    const contactId = searchParams.get('contact_id');
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const projectId = searchParams.get('project_id');
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) {
      query = query.gte('issue_date', dateFrom);
    }

    const dateTo = searchParams.get('date_to');
    if (dateTo) {
      query = query.lte('issue_date', dateTo);
    }

    const search = searchParams.get('search');
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,client_name.ilike.%${search}%,client_email.ilike.%${search}%`);
    }

    const limit = searchParams.get('limit');
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    // Get summary stats
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('status, total, amount_paid')
      .eq('workspace_id', workspaceId);

    const rows = (allInvoices || []) as Array<{ status: string | null; total: number | null; amount_paid: number | null }>;
    const summary = {
      total_count: rows.length,
      total_amount: rows.reduce((sum, inv) => sum + Number(inv.total || 0), 0),
      total_paid: rows.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0),
      draft_count: rows.filter(inv => inv.status === 'draft').length,
      sent_count: rows.filter(inv => inv.status === 'sent' || inv.status === 'viewed').length,
      paid_count: rows.filter(inv => inv.status === 'paid').length,
      overdue_count: rows.filter(inv => inv.status === 'overdue').length,
    };

    return NextResponse.json({ invoices: invoices || [], summary });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      workspace_id,
      contact_id,
      project_id,
      client_name,
      client_email,
      client_company,
      client_address,
      client_phone,
      client_tax_id,
      issue_date,
      due_date,
      currency,
      tax_rate,
      discount_amount,
      notes,
      terms,
      footer,
      logo_url,
      accent_color,
      reference,
      items,
    } = body;

    // Validate required fields
    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }
    if (!client_name) {
      return NextResponse.json({ error: 'client_name is required' }, { status: 400 });
    }
    if (!client_email) {
      return NextResponse.json({ error: 'client_email is required' }, { status: 400 });
    }
    if (!due_date) {
      return NextResponse.json({ error: 'due_date is required' }, { status: 400 });
    }

    // Verify membership with edit permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Generate invoice number using database function
    const { data: invoiceNumberResult, error: numberError } = await supabase
      .rpc('generate_invoice_number', { p_workspace_id: workspace_id });

    if (numberError) {
      console.error('Error generating invoice number:', numberError);
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    const invoiceNumber = invoiceNumberResult as string;

    // Calculate totals from items if provided
    let subtotal = 0;
    let taxAmount = 0;
    const taxRateValue = tax_rate || 0;

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const itemAmount = (item.quantity || 1) * (item.unit_price || 0);
        subtotal += itemAmount;
        if (item.is_taxable !== false) {
          taxAmount += itemAmount * taxRateValue / 100;
        }
      }
    }

    const discountValue = discount_amount || 0;
    const total = subtotal + taxAmount - discountValue;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        workspace_id,
        user_id: user.id,
        invoice_number: invoiceNumber,
        reference: reference || null,
        contact_id: contact_id || null,
        project_id: project_id || null,
        client_name,
        client_email,
        client_company: client_company || null,
        client_address: client_address || null,
        client_phone: client_phone || null,
        client_tax_id: client_tax_id || null,
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        due_date,
        currency: currency || 'USD',
        subtotal,
        tax_rate: taxRateValue,
        tax_amount: taxAmount,
        discount_amount: discountValue,
        total,
        notes: notes || null,
        terms: terms || null,
        footer: footer || null,
        logo_url: logo_url || null,
        accent_color: accent_color || '#6366f1',
        status: 'draft',
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const invoiceItems = items.map((item: {
        type?: string;
        description: string;
        quantity?: number;
        unit?: string;
        unit_price: number;
        is_taxable?: boolean;
        tax_rate?: number;
        task_id?: string;
        time_entry_id?: string;
        position?: number;
      }, index: number) => ({
        invoice_id: invoice.id,
        workspace_id,
        type: (item.type || 'service') as Database['public']['Enums']['invoice_item_type'],
        description: item.description,
        quantity: item.quantity || 1,
        unit: item.unit || 'unit',
        unit_price: item.unit_price,
        amount: (item.quantity || 1) * item.unit_price,
        is_taxable: item.is_taxable !== false,
        tax_rate: item.tax_rate || 0,
        task_id: item.task_id || null,
        time_entry_id: item.time_entry_id || null,
        position: item.position ?? index,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        // Don't fail the whole request, invoice is created
      }
    }

    // Log activity
    await supabase.from('invoice_activities').insert({
      invoice_id: invoice.id,
      workspace_id,
      user_id: user.id,
      action: 'created',
      description: `Invoice ${invoiceNumber} created`,
      to_status: 'draft',
    });

    // Fetch complete invoice with relations
    const { data: completeInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        contact:contacts(id, name, email, company),
        project:projects(id, name, color)
      `)
      .eq('id', invoice.id)
      .single();

    // Fetch items
    const { data: invoiceItemsData } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('position', { ascending: true });

    return NextResponse.json({
      invoice: { ...completeInvoice, items: invoiceItemsData || [] },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
