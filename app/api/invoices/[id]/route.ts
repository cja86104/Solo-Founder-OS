import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { InvoiceStatus, PaymentMethod } from '@/types/invoices';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const publicToken = searchParams.get('token');

    // If public token provided, allow public access
    if (publicToken) {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          contact:contacts(id, name, email, company),
          project:projects(id, name, color)
        `)
        .eq('id', id)
        .eq('public_token', publicToken)
        .single();

      if (error || !invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Update view tracking
      await supabase
        .from('invoices')
        .update({
          view_count: (invoice.view_count || 0) + 1,
          viewed_at: invoice.viewed_at || new Date().toISOString(),
          status: invoice.status === 'sent' ? 'viewed' : invoice.status,
        })
        .eq('id', id);

      // Fetch items
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('position', { ascending: true });

      return NextResponse.json({
        invoice: { ...invoice, items: items || [] },
        public: true,
      });
    }

    // Authenticated access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        contact:contacts(id, name, email, company),
        project:projects(id, name, color),
        user:profiles(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invoice.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Fetch items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true });

    // Fetch payments
    const { data: payments } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false });

    // Fetch activities
    const { data: activities } = await supabase
      .from('invoice_activities')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
      .eq('invoice_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      invoice: {
        ...invoice,
        items: items || [],
        payments: payments || [],
        activities: activities || [],
      },
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing invoice
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('workspace_id, status, invoice_number, sent_at')
      .eq('id', id)
      .single();

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existingInvoice.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'reference',
      'contact_id',
      'project_id',
      'client_name',
      'client_email',
      'client_company',
      'client_address',
      'client_phone',
      'client_tax_id',
      'issue_date',
      'due_date',
      'currency',
      'tax_rate',
      'discount_amount',
      'notes',
      'terms',
      'footer',
      'logo_url',
      'accent_color',
      'status',
      'payment_method',
      'payment_reference',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle status changes
    const newStatus = body.status as InvoiceStatus | undefined;
    const oldStatus = existingInvoice.status;

    if (newStatus && newStatus !== oldStatus) {
      if (newStatus === 'sent' && !existingInvoice.sent_at) {
        updateData.sent_at = new Date().toISOString();
      }
      if (newStatus === 'paid') {
        updateData.paid_date = updateData.paid_date || new Date().toISOString().split('T')[0];
      }
    }

    updateData.updated_at = new Date().toISOString();

    // Update invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        contact:contacts(id, name, email, company),
        project:projects(id, name, color)
      `)
      .single();

    if (error) throw error;

    // Handle items update if provided
    if (body.items && Array.isArray(body.items)) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      // Insert new items
      if (body.items.length > 0) {
        const invoiceItems = body.items.map((item: {
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
          invoice_id: id,
          workspace_id: existingInvoice.workspace_id,
          type: item.type || 'service',
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

        await supabase.from('invoice_items').insert(invoiceItems);
      }

      // Recalculate totals
      const { data: items } = await supabase
        .from('invoice_items')
        .select('amount, is_taxable')
        .eq('invoice_id', id);

      if (items) {
        const subtotal = items.reduce((sum: number, item) => sum + Number(item.amount), 0);
        const taxableAmount = items
          .filter((item) => item.is_taxable)
          .reduce((sum: number, item) => sum + Number(item.amount), 0);
        const taxAmount = taxableAmount * (Number(invoice.tax_rate) / 100);
        const total = subtotal + taxAmount - Number(invoice.discount_amount);

        await supabase
          .from('invoices')
          .update({ subtotal, tax_amount: taxAmount, total })
          .eq('id', id);
      }
    }

    // Log activity if status changed
    if (newStatus && newStatus !== oldStatus) {
      await supabase.from('invoice_activities').insert({
        invoice_id: id,
        workspace_id: existingInvoice.workspace_id,
        user_id: user.id,
        action: 'status_changed',
        description: `Status changed from ${oldStatus} to ${newStatus}`,
        from_status: oldStatus,
        to_status: newStatus,
      });
    }

    // Fetch updated invoice with items
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        contact:contacts(id, name, email, company),
        project:projects(id, name, color)
      `)
      .eq('id', id)
      .single();

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true });

    return NextResponse.json({
      invoice: { ...updatedInvoice, items: items || [] },
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('workspace_id, invoice_number, status')
      .eq('id', id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only allow deleting draft or cancelled invoices
    if (!['draft', 'cancelled'].includes(invoice.status || '')) {
      return NextResponse.json({
        error: 'Can only delete draft or cancelled invoices',
      }, { status: 400 });
    }

    // Verify admin/owner permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invoice.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete invoice (cascade will handle items, payments, activities)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

// Record a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, payment_method, payment_date, reference, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    if (!payment_method) {
      return NextResponse.json({ error: 'payment_method is required' }, { status: 400 });
    }

    // Get invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('workspace_id, invoice_number, total, amount_paid, currency')
      .eq('id', id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invoice.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: id,
        workspace_id: invoice.workspace_id,
        user_id: user.id,
        amount,
        currency: invoice.currency,
        payment_method: payment_method as PaymentMethod,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        reference: reference || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Log activity
    await supabase.from('invoice_activities').insert({
      invoice_id: id,
      workspace_id: invoice.workspace_id,
      user_id: user.id,
      action: 'payment_received',
      description: `Payment of ${invoice.currency} ${amount} received`,
      metadata: { payment_id: payment.id, amount, payment_method },
    });

    // Fetch updated invoice
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        contact:contacts(id, name, email, company),
        project:projects(id, name, color)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({ invoice: updatedInvoice, payment });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
