import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    let query = (supabase
      .from('time_entries') as any)
      .select(`*, project:projects(id, name, color), task:tasks(id, title)`)
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false });

    const projectId = searchParams.get('project_id');
    if (projectId) query = query.eq('project_id', projectId);

    const userId = searchParams.get('user_id');
    if (userId) query = query.eq('user_id', userId);

    const { data: entries, error } = await query;
    if (error) throw error;

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
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

    const { workspace_id, project_id, task_id, description, started_at, ended_at, duration_minutes, is_billable } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: entry, error } = await (supabase
      .from('time_entries') as any)
      .insert({
        workspace_id,
        user_id: user.id,
        project_id: project_id || null,
        task_id: task_id || null,
        description: description || null,
        started_at: started_at || new Date().toISOString(),
        ended_at: ended_at || null,
        duration_minutes: duration_minutes || null,
        is_billable: is_billable !== false,
        is_running: !ended_at,
      })
      .select(`*, project:projects(id, name, color), task:tasks(id, title)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entry_id, ...updateData } = body;

    if (!entry_id) {
      return NextResponse.json({ error: 'entry_id is required' }, { status: 400 });
    }

    const { data: entry } = await (supabase
      .from('time_entries') as any)
      .select('workspace_id, user_id, started_at')
      .eq('id', entry_id)
      .single();

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Only owner can edit their own entries, or admins can edit any
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', entry.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    if (entry.user_id !== user.id && !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Can only edit your own entries' }, { status: 403 });
    }

    const allowedFields = ['project_id', 'task_id', 'description', 'started_at', 'ended_at', 'duration_minutes', 'is_billable', 'is_running'];
    const filtered: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filtered[field] = updateData[field];
      }
    }

    // If stopping a timer
    if (updateData.ended_at && !updateData.duration_minutes) {
      const started = new Date(entry.started_at || updateData.started_at);
      const ended = new Date(updateData.ended_at);
      filtered.duration_minutes = Math.round((ended.getTime() - started.getTime()) / 60000);
      filtered.is_running = false;
    }

    const { data: updated, error } = await (supabase
      .from('time_entries') as any)
      .update(filtered)
      .eq('id', entry_id)
      .select(`*, project:projects(id, name, color), task:tasks(id, title)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: updated });
  } catch (error) {
    console.error('Error updating time entry:', error);
    return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entryId = searchParams.get('entry_id');
    if (!entryId) {
      return NextResponse.json({ error: 'entry_id is required' }, { status: 400 });
    }

    const { data: entry } = await (supabase
      .from('time_entries') as any)
      .select('workspace_id, user_id')
      .eq('id', entryId)
      .single();

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', entry.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    if (entry.user_id !== user.id && !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Can only delete your own entries' }, { status: 403 });
    }

    const { error } = await (supabase.from('time_entries') as any).delete().eq('id', entryId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 });
  }
}
