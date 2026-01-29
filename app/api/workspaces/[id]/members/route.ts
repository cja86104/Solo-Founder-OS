import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/workspaces/[id]/members - List workspace members
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

    // Check if user is a member of this workspace
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Get all members with profile info
    const { data: members, error: membersError } = await (supabase
      .from('workspace_members') as any)
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        permissions,
        joined_at,
        created_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (membersError) {
      throw membersError;
    }

    // Get emails from auth.users (need to do separately)
    const userIds = members?.map(m => m.user_id) || [];
    
    // For each member, get their email
    const membersWithEmail = await Promise.all(
      (members || []).map(async (member) => {
        // Get user email from auth
        const { data: { user: memberUser } } = await supabase.auth.admin.getUserById(member.user_id);
        
        return {
          ...member,
          full_name: (member.profiles as any)?.full_name || null,
          avatar_url: (member.profiles as any)?.avatar_url || null,
          email: memberUser?.email || 'Unknown',
        };
      })
    );

    return NextResponse.json({ members: membersWithEmail });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/workspaces/[id]/members/[userId] - Update member role
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const targetUserId = pathParts[pathParts.length - 1];

    // If this is the members route (not a specific user), return method not allowed
    if (targetUserId === 'members') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { role, permissions } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's role
    const { data: currentMember } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!currentMember) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Only owners and admins can modify members
    if (currentMember.role !== 'owner' && currentMember.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get target member's role
    const { data: targetMember } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't modify owners
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot modify workspace owner' }, { status: 403 });
    }

    // Admins can only modify editors and viewers
    if (currentMember.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot modify other admins' }, { status: 403 });
    }

    // Update member
    const updateData: Record<string, any> = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;

    const { error: updateError } = await (supabase
      .from('workspace_members') as any)
      .update(updateData)
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/workspaces/[id]/members/[userId] - Remove member
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const targetUserId = pathParts[pathParts.length - 1];

    if (targetUserId === 'members') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's role
    const { data: currentMember } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!currentMember) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const isSelf = user.id === targetUserId;

    // Get target member
    const { data: targetMember } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Owners can't leave (must transfer ownership first)
    if (isSelf && targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Owners cannot leave. Transfer ownership first.' },
        { status: 403 }
      );
    }

    // Check permissions
    if (!isSelf) {
      // Only owners can remove other members
      if (currentMember.role !== 'owner') {
        // Admins can remove editors and viewers
        if (currentMember.role === 'admin') {
          if (targetMember.role === 'owner' || targetMember.role === 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
      }
    }

    // Remove member
    const { error: deleteError } = await (supabase
      .from('workspace_members') as any)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
