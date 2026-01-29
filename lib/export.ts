import { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ExportFormat = 'json' | 'csv';
export type ExportableResource = 'contacts' | 'landing_pages' | 'vault' | 'vault_items' | 'activities' | 'all';

export interface ExportOptions {
  dateFrom?: string;
  dateTo?: string;
  includeMetadata?: boolean;
}

export interface ExportResult {
  data: string;
  filename: string;
  contentType: string;
  mimeType: string;
  recordCount: number;
}

function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val).replace(/"/g, '""');
      })
      .map((v) => `"${v}"`)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export async function exportContacts(
  supabase: SupabaseClient,
  workspaceId: string,
  format: ExportFormat,
  options?: ExportOptions
): Promise<ExportResult> {
  let query = (supabase
    .from('contacts') as any)
    .select('*')
    .eq('workspace_id', workspaceId);

  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom);
  }
  if (options?.dateTo) {
    query = query.lte('created_at', options.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  const exportData = (data || []).map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    phone: c.phone,
    company: c.company,
    job_title: c.job_title,
    source: c.source,
    status: c.status,
    tags: c.tags?.join(', ') || '',
    created_at: c.created_at,
    ...(options?.includeMetadata ? { metadata: JSON.stringify(c.metadata) } : {}),
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  const recordCount = exportData.length;

  if (format === 'csv') {
    return {
      data: toCSV(exportData),
      filename: `contacts-${timestamp}.csv`,
      contentType: 'text/csv',
      mimeType: 'text/csv',
      recordCount,
    };
  }

  return {
    data: JSON.stringify(exportData, null, 2),
    filename: `contacts-${timestamp}.json`,
    contentType: 'application/json',
    mimeType: 'application/json',
    recordCount,
  };
}

export async function exportLandingPages(
  supabase: SupabaseClient,
  workspaceId: string,
  format: ExportFormat
): Promise<ExportResult> {
  const { data, error } = await (supabase
    .from('landing_pages') as any)
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  const exportData = (data || []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    view_count: p.view_count,
    conversion_count: p.conversion_count,
    created_at: p.created_at,
    content: JSON.stringify(p.content),
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  const recordCount = exportData.length;

  if (format === 'csv') {
    return {
      data: toCSV(exportData),
      filename: `landing-pages-${timestamp}.csv`,
      contentType: 'text/csv',
      mimeType: 'text/csv',
      recordCount,
    };
  }

  return {
    data: JSON.stringify(exportData, null, 2),
    filename: `landing-pages-${timestamp}.json`,
    contentType: 'application/json',
    mimeType: 'application/json',
    recordCount,
  };
}

export async function exportVaultItems(
  supabase: SupabaseClient,
  workspaceId: string,
  format: ExportFormat
): Promise<ExportResult> {
  const { data, error } = await (supabase
    .from('vault_items') as any)
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  const exportData = (data || []).map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    type: v.type,
    language: v.language,
    tags: v.tags?.join(', ') || '',
    is_public: v.is_public,
    content: v.content,
    created_at: v.created_at,
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  const recordCount = exportData.length;

  if (format === 'csv') {
    return {
      data: toCSV(exportData),
      filename: `vault-items-${timestamp}.csv`,
      contentType: 'text/csv',
      mimeType: 'text/csv',
      recordCount,
    };
  }

  return {
    data: JSON.stringify(exportData, null, 2),
    filename: `vault-items-${timestamp}.json`,
    contentType: 'application/json',
    mimeType: 'application/json',
    recordCount,
  };
}

export async function exportActivities(
  supabase: SupabaseClient,
  workspaceId: string,
  format: ExportFormat,
  options?: ExportOptions
): Promise<ExportResult> {
  let query = (supabase
    .from('activities') as any)
    .select('*')
    .eq('workspace_id', workspaceId);

  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom);
  }
  if (options?.dateTo) {
    query = query.lte('created_at', options.dateTo);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  const exportData = (data || []).map((a) => ({
    id: a.id,
    action: a.action,
    entity_type: a.entity_type,
    entity_id: a.entity_id,
    description: a.description,
    created_at: a.created_at,
    ...(options?.includeMetadata ? { metadata: JSON.stringify(a.metadata) } : {}),
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  const recordCount = exportData.length;

  if (format === 'csv') {
    return {
      data: toCSV(exportData),
      filename: `activities-${timestamp}.csv`,
      contentType: 'text/csv',
      mimeType: 'text/csv',
      recordCount,
    };
  }

  return {
    data: JSON.stringify(exportData, null, 2),
    filename: `activities-${timestamp}.json`,
    contentType: 'application/json',
    mimeType: 'application/json',
    recordCount,
  };
}

export async function exportAllData(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ExportResult> {
  const [contacts, pages, vault, activities] = await Promise.all([
    (supabase.from('contacts') as any).select('*').eq('workspace_id', workspaceId),
    (supabase.from('landing_pages') as any).select('*').eq('workspace_id', workspaceId),
    (supabase
      .from('vault_items') as any)
      .select('*')
      .eq('workspace_id', workspaceId),
    (supabase.from('activities') as any).select('*').eq('workspace_id', workspaceId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    workspace_id: workspaceId,
    contacts: contacts.data || [],
    landing_pages: pages.data || [],
    vault_items: vault.data || [],
    activities: activities.data || [],
  };

  const timestamp = new Date().toISOString().split('T')[0];
  const recordCount = 
    (contacts.data?.length || 0) + 
    (pages.data?.length || 0) + 
    (vault.data?.length || 0) + 
    (activities.data?.length || 0);

  return {
    data: JSON.stringify(exportData, null, 2),
    filename: `full-export-${timestamp}.json`,
    contentType: 'application/json',
    mimeType: 'application/json',
    recordCount,
  };
}
