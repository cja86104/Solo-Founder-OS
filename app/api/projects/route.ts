import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { requireActiveSubscription } from '@/lib/supabase/subscription';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

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
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status);

    const { data: projects, error } = await query;
    if (error) throw error;

    // Compute per-project task stats
    const projectsWithStats = await Promise.all(
      (projects || []).map(async (project: ProjectRow) => {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('status, due_date')
          .eq('project_id', project.id);

        const now = new Date();
        const total_tasks = tasks?.length ?? 0;
        const completed_tasks = tasks?.filter((t) => t.status === 'done').length ?? 0;
        const in_progress_tasks = tasks?.filter((t) => t.status === 'in_progress').length ?? 0;
        const overdue_tasks = tasks?.filter(
          (t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < now
        ).length ?? 0;

        return {
          ...project,
          total_tasks,
          completed_tasks,
          in_progress_tasks,
          overdue_tasks,
          total_estimated_hours: 0,
          total_logged_hours: 0,
        };
      })
    );

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
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

    const { workspace_id, name, description, color, hourly_rate, budget, start_date, due_date } = body;

    if (!workspace_id || !name) {
      return NextResponse.json({ error: 'workspace_id and name are required' }, { status: 400 });
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

    // Subscription gate — block expired/non-paying users from write operations
    const subscriptionBlocked = await requireActiveSubscription(supabase, user.id);
    if (subscriptionBlocked) return subscriptionBlocked;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        workspace_id,
        user_id: user.id,
        name,
        description: description || null,
        color: color || '#6366f1',
        hourly_rate: hourly_rate || null,
        budget: budget || null,
        start_date: start_date || null,
        due_date: due_date || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
