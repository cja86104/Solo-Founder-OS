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

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    let query = supabase
      .from('tasks')
      .select(`*, project:projects(id, name, color)`)
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    const projectId = searchParams.get('project_id');
    if (projectId) query = query.eq('project_id', projectId);

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as any);

    const assigneeId = searchParams.get('assignee_id');
    if (assigneeId) query = query.eq('assignee_id', assigneeId);

    const { data: tasks, error } = await query;
    if (error) throw error;

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
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

    const { workspace_id, project_id, title, description, status, priority, due_date, assignee_id, estimated_hours, tags } = body;

    if (!workspace_id || !title) {
      return NextResponse.json({ error: 'workspace_id and title are required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id,
        project_id: project_id || null,
        user_id: user.id,
        title,
        description: description || null,
        status: status || 'todo',
        priority: priority || 'medium',
        due_date: due_date || null,
        assignee_id: assignee_id || null,
        estimated_hours: estimated_hours || null,
        tags: tags || [],
      })
      .select(`*, project:projects(id, name, color)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
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

    const { task_id, ...updateData } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('workspace_id')
      .eq('id', task_id)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', task.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'due_date', 'assignee_id', 'estimated_hours', 'position', 'tags', 'completed_at'];
    const filtered: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filtered[field] = updateData[field];
      }
    }

    if (updateData.status === 'done' && !updateData.completed_at) {
      filtered.completed_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from('tasks')
      .update(filtered)
      .eq('id', task_id)
      .select(`*, project:projects(id, name, color)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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

    const taskId = searchParams.get('task_id');
    if (!taskId) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('workspace_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', task.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
