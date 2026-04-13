import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireActiveSubscription } from '@/lib/supabase/subscription';

// ============================================================================
// GET /api/feedback/widgets - List widgets
// ============================================================================

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
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Check membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const { data: widgets, error } = await supabase
      .from('feedback_widgets')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map 'domains' DB column to 'allowed_domains' for frontend
    const mapped = (widgets || []).map((w) => ({
      ...w,
      allowed_domains: w.domains || [],
    }));

    return NextResponse.json({ widgets: mapped });
  } catch (error) {
    console.error('Error fetching widgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widgets' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/feedback/widgets - Create widget
// ============================================================================

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
      name,
      slug,
      description,
      theme,
      primary_color,
      position,
      title,
      placeholder,
      success_message,
      allow_attachments,
      require_email,
      show_emoji_rating,
      categories,
      allowed_domains,
      domains,
    } = body;

    if (!workspace_id || !name) {
      return NextResponse.json(
        { error: 'workspace_id and name are required' },
        { status: 400 }
      );
    }

    // Check membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Subscription gate — block expired/non-paying users from write operations
    const subscriptionBlocked = await requireActiveSubscription(supabase, user.id);
    if (subscriptionBlocked) return subscriptionBlocked;

    const { data: widget, error } = await supabase
      .from('feedback_widgets')
      .insert({
        workspace_id,
        user_id: user.id,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30),
        description: description || null,
        theme: theme || 'auto',
        primary_color: primary_color || '#6366f1',
        position: position || 'bottom-right',
        title: title || 'Send us feedback',
        placeholder: placeholder || "What's on your mind?",
        success_message: success_message || 'Thank you for your feedback!',
        allow_attachments: allow_attachments ?? false,
        require_email: require_email ?? false,
        show_emoji_rating: show_emoji_rating ?? true,
        categories: categories || ['bug', 'feature', 'question', 'other'],
        domains: allowed_domains || domains || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ widget }, { status: 201 });
  } catch (error) {
    console.error('Error creating widget:', error);
    return NextResponse.json(
      { error: 'Failed to create widget' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/feedback/widgets - Update widget
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { widget_id, ...fields } = body;

    if (!widget_id) {
      return NextResponse.json(
        { error: 'widget_id is required' },
        { status: 400 }
      );
    }

    // Get widget to check workspace
    const { data: existing } = await supabase
      .from('feedback_widgets')
      .select('workspace_id')
      .eq('id', widget_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Check membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existing.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Subscription gate — block expired/non-paying users from write operations
    const subscriptionBlocked = await requireActiveSubscription(supabase, user.id);
    if (subscriptionBlocked) return subscriptionBlocked;

    // Build update from all allowed fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'slug', 'description', 'theme', 'primary_color', 'position',
      'title', 'placeholder', 'success_message', 'allow_attachments',
      'require_email', 'show_emoji_rating', 'categories', 'is_active',
    ];
    for (const field of allowedFields) {
      if (fields[field] !== undefined) updateData[field] = fields[field];
    }
    // Map allowed_domains -> domains
    if (fields.allowed_domains !== undefined) updateData.domains = fields.allowed_domains;
    if (fields.domains !== undefined) updateData.domains = fields.domains;

    const { data: widget, error } = await supabase
      .from('feedback_widgets')
      .update(updateData)
      .eq('id', widget_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ widget });
  } catch (error) {
    console.error('Error updating widget:', error);
    return NextResponse.json(
      { error: 'Failed to update widget' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/feedback/widgets - Delete widget
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const widgetId = searchParams.get('widget_id');
    if (!widgetId) {
      return NextResponse.json(
        { error: 'widget_id is required' },
        { status: 400 }
      );
    }

    // Get widget to check workspace
    const { data: existing } = await supabase
      .from('feedback_widgets')
      .select('workspace_id')
      .eq('id', widgetId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Check membership - only admins/owners can delete
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', existing.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await supabase
      .from('feedback_widgets')
      .delete()
      .eq('id', widgetId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    return NextResponse.json(
      { error: 'Failed to delete widget' },
      { status: 500 }
    );
  }
}
