import { createClient } from '@/lib/supabase/server';
import { Constants } from '@/types/database';
import { parseEnum } from '@/lib/validation/parse-enum';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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
  active: number;
  unsubscribed: number;
  bySource: Record<string, number>;
  byTag: { tag: string; count: number }[];
  recentlyAdded: number;
  recentlyActive: number;
}

export function buildContactQuery(
  supabase: SupabaseClient,
  workspaceId: string,
  filters?: ContactFilters,
  sort?: ContactSort
) {
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  // Validate enum-typed filters against the DB enum at this boundary so
  // callers can pass raw querystring values without unsafe casting. Invalid
  // values are treated as "no filter" (matches behaviour of an absent param).
  const status = parseEnum(filters?.status, Constants.public.Enums.contact_status);
  if (status) {
    query = query.eq('status', status);
  }

  const source = parseEnum(filters?.source, Constants.public.Enums.contact_source);
  if (source) {
    query = query.eq('source', source);
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
    .select('status, source, tags, created_at, last_contacted_at')
    .eq('workspace_id', workspaceId);

  const total = contacts?.length || 0;

  // Count by status
  const byStatus: Record<string, number> = {};
  contacts?.forEach((c) => {
    const status = c.status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  const active = byStatus['active'] || 0;
  const unsubscribed = byStatus['unsubscribed'] || 0;

  // Count by source
  const bySource: Record<string, number> = {};
  contacts?.forEach((c) => {
    if (c.source) {
      bySource[c.source] = (bySource[c.source] || 0) + 1;
    }
  });

  // Count recently added (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentlyAdded =
    contacts?.filter((c) => c.created_at && c.created_at > weekAgo).length || 0;

  // Count recently active (last 30 days) - use last_contacted_at or created_at
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentlyActive =
    contacts?.filter((c) => {
      const lastActivity = c.last_contacted_at || c.created_at;
      return lastActivity && lastActivity > monthAgo;
    }).length || 0;

  // Count tags
  const tagCounts: Record<string, number> = {};
  contacts?.forEach((c) => {
    const tags = c.tags as string[] | null;
    tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const byTag = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total,
    active,
    unsubscribed,
    bySource,
    byTag,
    recentlyAdded,
    recentlyActive,
  };
}
