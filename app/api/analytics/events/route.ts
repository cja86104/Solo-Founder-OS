import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AnalyticsEvent } from '@/types/analytics';

// =============================================================================
// GET - Query Events
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const eventName = searchParams.get('event_name');
    const category = searchParams.get('category');
    const period = searchParams.get('period') || '30d';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Calculate date range
    const days = getPeriodDays(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventName) {
      query = query.eq('event_name', eventName);
    }

    if (category) {
      query = query.eq('event_category', category);
    }

    const { data: events, count, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Fetch event summary (counts by event name)
    const { data: summary } = await supabase
      .from('analytics_events')
      .select('event_name, event_category')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    const eventCounts = new Map<string, { count: number; category: string }>();
    (summary || []).forEach((e) => {
      const existing = eventCounts.get(e.event_name);
      if (existing) {
        existing.count++;
      } else {
        eventCounts.set(e.event_name, { count: 1, category: e.event_category });
      }
    });

    const eventSummary = Array.from(eventCounts.entries())
      .map(([name, data]) => ({
        event_name: name,
        event_category: data.category,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      events: events || [],
      total: count || 0,
      summary: eventSummary,
    });
  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Track Event
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Note: Event tracking can be anonymous (from frontend SDK)
    // We'll use a different auth approach for this endpoint
    
    const body = await request.json();
    const {
      workspace_id,
      session_id,
      visitor_id,
      event_name,
      event_category,
      event_value,
      properties,
      page_path,
    } = body;

    // Validation
    if (!workspace_id || !event_name) {
      return NextResponse.json(
        { error: 'workspace_id and event_name are required' },
        { status: 400 }
      );
    }

    // Verify workspace exists and has analytics enabled
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, settings')
      .eq('id', workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: 'Invalid workspace' },
        { status: 400 }
      );
    }

    // Create event
    const { data: event, error: createError } = await supabase
      .from('analytics_events')
      .insert({
        workspace_id,
        session_id: session_id || null,
        visitor_id: visitor_id || generateVisitorId(),
        event_name,
        event_category: event_category || 'general',
        event_value: event_value || null,
        properties: properties || {},
        page_path: page_path || '/',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating event:', createError);
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    // Check if this event triggers any goal completions
    await checkGoalCompletions(supabase, workspace_id, event as any);

    return NextResponse.json({ success: true, event_id: event.id });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getPeriodDays(period: string): number {
  const days: Record<string, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '12m': 365,
  };
  return days[period] || 30;
}

function generateVisitorId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

async function checkGoalCompletions(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  event: AnalyticsEvent
) {
  try {
    // Fetch active event-based goals
    const { data: goals } = await supabase
      .from('analytics_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('goal_type', 'event')
      .eq('is_active', true);

    if (!goals || goals.length === 0) return;

    for (const goal of goals) {
      let matches = false;

      switch (goal.target_operator) {
        case 'equals':
          matches = event.event_name === goal.target_value;
          break;
        case 'contains':
          matches = event.event_name.includes(goal.target_value);
          break;
        default:
          matches = event.event_name === goal.target_value;
      }

      if (matches) {
        // Check if not already converted in this session
        const { data: existing } = await supabase
          .from('analytics_conversions')
          .select('id')
          .eq('goal_id', goal.id)
          .eq('session_id', event.session_id)
          .single();

        if (!existing) {
          // Record conversion
          await supabase.from('analytics_conversions').insert({
            workspace_id: workspaceId,
            goal_id: goal.id,
            session_id: event.session_id,
            visitor_id: event.visitor_id,
            conversion_value: goal.conversion_value,
          });

          // Update session as converted
          if (event.session_id) {
            await supabase
              .from('analytics_sessions')
              .update({
                converted: true,
                conversion_value: goal.conversion_value,
              })
              .eq('id', event.session_id);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking goal completions:', error);
  }
}
