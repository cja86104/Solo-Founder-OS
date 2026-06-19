import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// POST /api/workspaces/[id]/invites — Invite a member to the workspace
// =============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can invite members
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can invite members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = 'viewer', permissions = {} } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const validRoles = ['admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Prevent admins from creating admin-level invites
    if (membership.role === 'admin' && role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot invite other admins' },
        { status: 403 }
      );
    }

    // Check if the user is already a member of this workspace.
    // First look up the invitee's profile by email, then check for an
    // existing workspace membership for that user.
    const { data: inviteeProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (inviteeProfile) {
      const { data: alreadyMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', inviteeProfile.id)
        .single();

      if (alreadyMember) {
        return NextResponse.json(
          { error: 'This user is already a member of the workspace' },
          { status: 409 }
        );
      }
    }

    // Upsert invite — unique constraint on (workspace_id, email) handles duplicates
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .upsert(
        {
          workspace_id: workspaceId,
          email: email.trim().toLowerCase(),
          role,
          permissions,
          invited_by: user.id,
          // Reset expiry and token on re-invite
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        },
        { onConflict: 'workspace_id,email' }
      )
      .select()
      .single();

    if (inviteError) {
      console.error('Invite creation error:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation', detail: inviteError.message },
        { status: 500 }
      );
    }

    // Build invite URL for the caller to optionally display/copy
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const inviteUrl = `${appUrl}/workspaces/join?token=${invite.token}`;

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
      },
      inviteUrl,
    });
  } catch (error) {
    console.error('Invite POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// GET /api/workspaces/[id]/invites — List pending invites for the workspace
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only members can see pending invites
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const { data: invites, error } = await supabase
      .from('workspace_invites')
      .select('id, email, role, expires_at, created_at')
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Invites GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (error) {
    console.error('Invites GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
