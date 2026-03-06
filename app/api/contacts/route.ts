import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildContactQuery, ContactFilters } from '@/lib/contacts';
import { ContactSortOptions, ContactStatus, ContactSource } from '@/types/contacts';

// ============================================================================
// GET /api/contacts - List contacts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace ID from query or header
    const workspaceId = searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Parse filters
    const filters: ContactFilters = {};
    if (searchParams.get('search')) filters.search = searchParams.get('search')!;
    if (searchParams.get('status')) filters.status = searchParams.get('status') as ContactStatus;
    if (searchParams.get('source')) filters.source = searchParams.get('source') as ContactSource;
    if (searchParams.get('tags')) filters.tags = searchParams.get('tags')!.split(',');

    // Parse sort
    const sort: ContactSortOptions = {
      field: (searchParams.get('sort') as ContactSortOptions['field']) || 'created_at',
      direction: (searchParams.get('order') as ContactSortOptions['direction']) || 'desc',
    };

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // Build query
    let query = buildContactQuery(supabase, workspaceId, filters, sort);
    query = query.range(offset, offset + pageSize - 1);

    const { data: contacts, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      contacts: contacts || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/contacts - Create contact
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { workspace_id, email, name, phone, company, job_title, source, tags, metadata } = body;

    // Validate required fields
    if (!workspace_id || !email) {
      return NextResponse.json(
        { error: 'workspace_id and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership with edit permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id,
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        job_title: job_title?.trim() || null,
        source: source || 'manual',
        tags: tags || [],
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A contact with this email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/contacts - Bulk update contacts
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { workspace_id, contact_ids, action, data } = body;

    if (!workspace_id || !contact_ids || !action) {
      return NextResponse.json(
        { error: 'workspace_id, contact_ids, and action are required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let result;

    switch (action) {
      case 'add_tags': {
        // Get current contacts
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, tags')
          .in('id', contact_ids);

        // Update each with merged tags
        for (const contact of contacts || []) {
          const newTags = [...new Set([...(contact.tags || []), ...(data.tags || [])])];
          await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('id', contact.id);
        }
        result = { updated: contact_ids.length };
        break;
      }

      case 'remove_tags': {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, tags')
          .in('id', contact_ids);

        for (const contact of contacts || []) {
          const newTags = (contact.tags || []).filter(
            (t: string) => !(data.tags || []).includes(t)
          );
          await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('id', contact.id);
        }
        result = { updated: contact_ids.length };
        break;
      }

      case 'update_status': {
        const { error } = await supabase
          .from('contacts')
          .update({ status: data.status })
          .in('id', contact_ids);

        if (error) throw error;
        result = { updated: contact_ids.length };
        break;
      }

      case 'delete': {
        // Only owners and admins can delete
        if (membership.role !== 'owner' && membership.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only owners and admins can delete contacts' },
            { status: 403 }
          );
        }

        const { error } = await supabase
          .from('contacts')
          .delete()
          .in('id', contact_ids);

        if (error) throw error;
        result = { deleted: contact_ids.length };
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating contacts:', error);
    return NextResponse.json(
      { error: 'Failed to update contacts' },
      { status: 500 }
    );
  }
}
