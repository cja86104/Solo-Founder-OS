import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// =============================================================================
// GET /api/cron/automations — Process scheduled automation triggers
// Called by Vercel Cron (see vercel.json) or an external scheduler.
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not configured');
      return NextResponse.json({ error: 'Cron endpoint not configured' }, { status: 401 });
    }

    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();

    // Find schedules that are due, joined with their active automations
    const { data: dueSchedules, error: queryError } = await supabase
      .from('automation_schedules')
      .select(`
        id,
        automation_id,
        cron_expression,
        timezone,
        next_run_at,
        automations!inner ( id, workspace_id, name, status )
      `)
      .lte('next_run_at', now.toISOString())
      .eq('automations.status', 'active');

    if (queryError) {
      console.error('Cron query error:', queryError);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    const results = { processed: 0, triggered: 0, errors: [] as string[] };

    for (const schedule of dueSchedules || []) {
      results.processed++;
      const automation = schedule.automations as unknown as {
        id: string;
        workspace_id: string;
        name: string;
      };

      try {
        // Create a run record
        const { error: runError } = await supabase
          .from('automation_runs')
          .insert({
            automation_id: automation.id,
            workspace_id: automation.workspace_id,
            status: 'pending',
            trigger_type: 'scheduled',
            trigger_data: {
              scheduled_time: now.toISOString(),
              cron_expression: schedule.cron_expression,
            },
            started_at: now.toISOString(),
          });

        if (runError) {
          results.errors.push(`${automation.name}: ${runError.message}`);
          continue;
        }

        results.triggered++;

        // Advance next_run_at by a simple heuristic based on the cron expression.
        // A full cron parser (e.g. cron-parser npm) can be added later for accuracy.
        const nextRun = computeNextRun(schedule.cron_expression, now);

        await supabase
          .from('automation_schedules')
          .update({
            next_run_at: nextRun.toISOString(),
            last_run_at: now.toISOString(),
          })
          .eq('id', schedule.id);
      } catch (err) {
        results.errors.push(
          `${automation.name}: ${err instanceof Error ? err.message : 'Unknown'}`
        );
      }
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString(), ...results });
  } catch (error) {
    console.error('Cron automations error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Simplified next-run calculator. Handles common patterns; falls back to +1h.
// ---------------------------------------------------------------------------
function computeNextRun(cron: string, from: Date): Date {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    // Fallback: 1 hour from now
    return new Date(from.getTime() + 3_600_000);
  }

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

  // Every-minute pattern: * * * * *
  if (parts.every((p) => p === '*')) {
    return new Date(from.getTime() + 60_000);
  }

  // Fixed minute, every hour: N * * * *
  if (minute !== '*' && hour === '*' && dayOfMonth === '*' && dayOfWeek === '*') {
    return new Date(from.getTime() + 3_600_000);
  }

  // Fixed minute + hour (daily or weekly): N N * * *  or  N N * * D
  if (minute !== '*' && hour !== '*') {
    const interval = dayOfWeek !== '*' ? 7 * 24 * 3_600_000 : 24 * 3_600_000;
    return new Date(from.getTime() + interval);
  }

  // Default: 1 hour
  return new Date(from.getTime() + 3_600_000);
}
