import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/contacts/[id] - Get single contact
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contact with workspace check
    const { data: contact, error } = await (supabase
      .from('contacts') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Check workspace membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', contact.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Get notes
    const { data: notes } = await (supabase
      .from('contact_notes') as any)
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('contact_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    return NextResponse.json({
      contact,
      notes: notes || [],
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/contacts/[id] - Update contact
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contact to check workspace
    const { data: existingContact } = await (supabase
      .from('contacts') as any)
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Check workspace membership with edit permissions
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', existingContact.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) updateData.name = body.name?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.company !== undefined) updateData.company = body.company?.trim() || null;
    if (body.job_title !== undefined) updateData.job_title = body.job_title?.trim() || null;
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.custom_fields !== undefined) updateData.custom_fields = body.custom_fields;

    // Update contact
    const { data: contact, error } = await (supabase
      .from('contacts') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/contacts/[id] - Delete contact
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contact to check workspace
    const { data: contact } = await (supabase
      .from('contacts') as any)
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Check workspace membership - only owners and admins can delete
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', contact.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can delete contacts' },
        { status: 403 }
      );
    }

    // Delete contact
    const { error } = await (supabase
      .from('contacts') as any)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
