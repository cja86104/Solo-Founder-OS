import { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type Contact = { [key: string]: unknown };

export interface ContactFilters {
  status?: string;
  source?: string;
  tags?: string[];
  search?: string;
}

export interface ContactSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ContactStats {
  total: number;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  recent_count: number;
  top_tags: Array<{ tag: string; count: number }>;
}

export function buildContactQuery(
  supabase: SupabaseClient,
  workspaceId: string,
  filters?: ContactFilters,
  sort?: ContactSort
) {
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.status) {
    query = query.eq('status', filters.status as any);
  }

  if (filters?.source) {
    query = query.eq('source', filters.source as any);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
    );
  }

  if (sort) {
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  return query;
}

export async function getContactStats(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ContactStats> {
  // Get all contacts for this workspace
  const { data: contacts } = await supabase
    .from('contacts')
    .select('status, source, tags, created_at')
    .eq('workspace_id', workspaceId);

  const total = contacts?.length || 0;

  // Count by status
  const by_status: Record<string, number> = {};
  contacts?.forEach((c) => {
    const status = c.status || 'unknown';
    by_status[status] = (by_status[status] || 0) + 1;
  });

  // Count by source
  const by_source: Record<string, number> = {};
  contacts?.forEach((c) => {
    if (c.source) {
      by_source[c.source] = (by_source[c.source] || 0) + 1;
    }
  });

  // Count recent (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent_count =
    contacts?.filter((c) => c.created_at && c.created_at > weekAgo).length || 0;

  // Count tags
  const tagCounts: Record<string, number> = {};
  contacts?.forEach((c) => {
    c.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const top_tags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total,
    by_status,
    by_source,
    recent_count,
    top_tags,
  };
}
