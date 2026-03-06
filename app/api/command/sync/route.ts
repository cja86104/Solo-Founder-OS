import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  syncStripeData,
  syncStripeCustomers,
  syncStripeSubscriptions,
} from '@/lib/stripe/sync';
import type { SyncType } from '@/types/command';

// ============================================================================
// POST /api/command/sync - Trigger Stripe sync
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, sync_type = 'full' } = body as {
      workspace_id: string;
      sync_type?: SyncType;
    };

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify user has admin access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin access required to sync data' },
        { status: 403 }
      );
    }

    // Check for recent sync to prevent spam (if table exists)
    const { data: recentSync, error: syncCheckError } = await supabase
      .from('stripe_sync_log')
      .select('started_at')
      .eq('workspace_id', workspace_id)
      .eq('status', 'started')
      .gte('started_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .single();

    // Only enforce rate limit if table exists and has recent sync
    if (!syncCheckError && recentSync) {
      return NextResponse.json(
        { error: 'A sync is already in progress. Please wait 5 minutes.' },
        { status: 429 }
      );
    }

    // Run sync based on type
    const options = {
      workspaceId: workspace_id,
      userId: user.id,
      syncType: sync_type,
    };

    let result;
    switch (sync_type) {
      case 'customers':
        result = await syncStripeCustomers(options);
        break;
      case 'subscriptions':
        result = await syncStripeSubscriptions(options);
        break;
      case 'full':
      default:
        result = await syncStripeData(options);
        break;
    }

    return NextResponse.json({
      success: result.success,
      sync_id: result.sync_id,
      records_synced: result.records_synced,
      records_created: result.records_created,
      records_updated: result.records_updated,
      records_failed: result.records_failed,
      duration_ms: result.duration_ms,
      errors: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Stripe data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/command/sync - Get sync history
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get sync history
    const { data: syncHistory, error } = await supabase
      .from('stripe_sync_log')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Table might not exist yet - return empty history
      console.error('Get sync history error (table may not exist):', error);
      return NextResponse.json({
        sync_history: [],
        last_synced_at: null,
        total_syncs: 0,
      });
    }

    // Get last successful sync
    const lastSuccessful = syncHistory?.find((s: { status: string }) => s.status === 'completed');

    return NextResponse.json({
      sync_history: syncHistory || [],
      last_synced_at: lastSuccessful?.completed_at || null,
      total_syncs: syncHistory?.length || 0,
    });
  } catch (error) {
    console.error('Get sync history error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync history' },
      { status: 500 }
    );
  }
}
