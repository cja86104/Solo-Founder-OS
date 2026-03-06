import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exportContacts,
  exportLandingPages,
  exportVaultItems,
  exportActivities,
  exportAllData,
  ExportFormat,
  ExportableResource,
} from '@/lib/export';
import { logAuditEvent } from '@/lib/activity';

// ============================================================================
// POST /api/export - Export workspace data
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      workspace_id,
      resource,
      format = 'json',
      date_from,
      date_to,
    } = body as {
      workspace_id: string;
      resource: ExportableResource;
      format: ExportFormat;
      date_from?: string;
      date_to?: string;
    };

    if (!workspace_id || !resource) {
      return NextResponse.json(
        { error: 'workspace_id and resource are required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership - only owners and admins can export
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can export data' },
        { status: 403 }
      );
    }

    let result;
    const options = { dateFrom: date_from, dateTo: date_to };

    switch (resource) {
      case 'contacts':
        result = await exportContacts(supabase, workspace_id, format, options);
        break;
      case 'landing_pages':
        result = await exportLandingPages(supabase, workspace_id, format);
        break;
      case 'vault_items':
        result = await exportVaultItems(supabase, workspace_id, format);
        break;
      case 'activities':
        result = await exportActivities(supabase, workspace_id, format, options);
        break;
      case 'all':
        result = await exportAllData(supabase, workspace_id);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid resource type' },
          { status: 400 }
        );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      workspace_id,
      user_id: user.id,
      user_email: user.email || '',
      event_type: 'data_export',
      event_category: 'data_access',
      description: `Exported ${resource} data (${result.recordCount} records)`,
      metadata: {
        resource,
        format,
        record_count: result.recordCount,
      },
    });

    // Return the export data
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-Record-Count': result.recordCount.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
