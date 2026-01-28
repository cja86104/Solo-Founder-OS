import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ============================================================================
// GET /api/workspaces/[id]/invites - List pending invites
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Get pending invites (not expired, not accepted)
    const { data: invites, error: invitesError } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (invitesError) {
      throw invitesError;
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workspaces/[id]/invites - Create invitation
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { email, role, permissions } = body;

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is owner or admin
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Admins can't invite admins
    if (membership.role === 'admin' && role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot invite other admins' },
        { status: 403 }
      );
    }

    // Check if email is already a member
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const invitedUser = existingUser?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (invitedUser) {
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', invitedUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'This user is already a member of the workspace' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('workspace_invites')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Get workspace details for the email
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, slug')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Create invitation
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        role,
        permissions: permissions || {},
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Build invite URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    // Send email if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Solo Founder OS <noreply@solofounder.os>',
          to: email,
          subject: `You've been invited to join ${workspace.name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #000; font-size: 24px; margin: 0;">Solo Founder OS</h1>
                </div>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                  <h2 style="margin-top: 0;">You're invited!</h2>
                  <p>You've been invited to join <strong>${workspace.name}</strong> as a${role === 'admin' ? 'n' : ''} <strong>${role}</strong>.</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                      Accept Invitation
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px;">
                    This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </div>
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  Solo Founder OS - Your entire business. One dashboard.
                </p>
              </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('Error sending invite email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      invite,
      inviteUrl,
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/workspaces/[id]/invites/[inviteId] - Cancel invitation
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const inviteId = pathParts[pathParts.length - 1];

    if (inviteId === 'invites') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is owner or admin
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId)
      .eq('workspace_id', workspaceId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling invite:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
