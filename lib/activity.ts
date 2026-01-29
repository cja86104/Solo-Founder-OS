import { createClient } from '@/lib/supabase/server';
import type { ActivityFilters, AuditLogFilters, CreateActivityInput, CreateAuditLogInput } from '@/types/activity';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export async function logActivity(
  supabase: SupabaseClient,
  input: CreateActivityInput
): Promise<{ activity: Record<string, unknown> | null; error: string | null }> {
  try {
    const { data, error } = await (supabase
      .from('activities') as any)
      .insert({
        workspace_id: input.workspace_id,
        user_id: input.actor_id || null,
        action: input.action,
        entity_type: input.resource_type,
        entity_id: input.resource_id || null,
        description: input.description || null,
        metadata: (input.metadata || {}) as any,
      })
      .select()
      .single();

    if (error) throw error;

    return { activity: data, error: null };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { activity: null, error: (error as Error).message };
  }
}

export async function getActivities(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: ActivityFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): Promise<{ activities: Record<string, unknown>[]; total: number; error: string | null }> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  let query = (supabase
    .from('activities') as any)
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.resource_type) {
    query = query.eq('entity_type', filters.resource_type);
  }

  if (filters.actor_id) {
    query = query.eq('user_id', filters.actor_id);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters.search) {
    query = query.ilike('description', `%${filters.search}%`);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching activities:', error);
    return { activities: [], total: 0, error: error.message };
  }

  return { activities: data || [], total: count || 0, error: null };
}

export async function getActivitySummary(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Record<string, unknown>> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: todayCount } = await (supabase
    .from('activities') as any)
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', startOfDay);

  const { count: weekCount } = await (supabase
    .from('activities') as any)
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', startOfWeek);

  const { data: recentActivities } = await (supabase
    .from('activities') as any)
    .select('id, action, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    total_today: todayCount || 0,
    total_week: weekCount || 0,
    recent: recentActivities || [],
  };
}

export async function getAuditLogs(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: AuditLogFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 50 }
): Promise<{ logs: Record<string, unknown>[]; total: number; error: string | null }> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  let query = (supabase
    .from('activities') as any)
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (filters.event_type) {
    query = query.eq('action', filters.event_type);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters.search) {
    query = query.ilike('description', `%${filters.search}%`);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    return { logs: [], total: 0, error: error.message };
  }

  return { logs: data || [], total: count || 0, error: null };
}

export async function logAuditEvent(
  supabase: SupabaseClient,
  input: CreateAuditLogInput
): Promise<void> {
  await (supabase
    .from('activities') as any)
    .insert({
      workspace_id: input.workspace_id || '',
      user_id: input.user_id || null,
      action: input.event_type,
      entity_type: input.resource_type || input.event_category,
      entity_id: input.resource_id || null,
      description: input.description,
      metadata: {
        ...input.metadata,
        timestamp: new Date().toISOString(),
        audit: true,
        severity: input.severity || 'info',
        user_email: input.user_email,
      },
    });
}
