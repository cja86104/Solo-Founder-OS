import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Goal, GoalPerformance } from '@/types/analytics';

// =============================================================================
// GET - List Goals
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
    const includePerformance = searchParams.get('include') === 'performance';
    const period = searchParams.get('period') || '30d';

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

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('analytics_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      );
    }

    // If performance data requested, fetch conversions
    if (includePerformance && goals && goals.length > 0) {
      const performance = await fetchGoalPerformance(
        supabase,
        workspaceId,
        goals as any,
        period
      );
      return NextResponse.json({ goals, performance });
    }

    return NextResponse.json({ goals: goals || [] });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Goal
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspace_id,
      name,
      description,
      goal_type,
      target_value,
      target_operator,
      conversion_value,
    } = body;

    // Validation
    if (!workspace_id || !name || !goal_type || !target_value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify workspace access with write permission
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Create goal
    const { data: goal, error: createError } = await supabase
      .from('analytics_goals')
      .insert({
        workspace_id,
        name,
        description,
        goal_type,
        target_value,
        target_operator: target_operator || 'equals',
        conversion_value: conversion_value || 0,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating goal:', createError);
      return NextResponse.json(
        { error: 'Failed to create goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function fetchGoalPerformance(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  goals: Goal[],
  period: string
): Promise<GoalPerformance[]> {
  // Calculate date range
  const days = getPeriodDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  // Fetch conversions for current period
  const { data: currentConversions } = await supabase
    .from('analytics_conversions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('converted_at', startDate.toISOString())
    .lte('converted_at', endDate.toISOString());

  // Fetch conversions for previous period
  const { data: prevConversions } = await supabase
    .from('analytics_conversions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('converted_at', prevStartDate.toISOString())
    .lt('converted_at', startDate.toISOString());

  // Fetch total sessions for conversion rate calculation
  const { count: totalSessions } = await supabase
    .from('analytics_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  const conversions = currentConversions || [];
  const prevConvs = prevConversions || [];
  const sessions = totalSessions || 0;

  // Calculate performance for each goal
  return goals.map((goal) => {
    const goalConversions = conversions.filter((c) => c.goal_id === goal.id);
    const prevGoalConversions = prevConvs.filter((c) => c.goal_id === goal.id);

    const completions = goalConversions.length;
    const prevCompletions = prevGoalConversions.length;
    const totalValue = goalConversions.reduce(
      (sum, c) => sum + (c.conversion_value || 0),
      0
    );
    const conversionRate = sessions > 0 ? (completions / sessions) * 100 : 0;
    const change =
      prevCompletions > 0
        ? ((completions - prevCompletions) / prevCompletions) * 100
        : completions > 0
        ? 100
        : 0;

    return {
      goal,
      completions,
      conversion_rate: conversionRate,
      total_value: totalValue,
      change,
    };
  });
}

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
