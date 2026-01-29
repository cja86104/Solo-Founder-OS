import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';

// =============================================================================
// POST /api/webhooks/[key] — Receive external webhook and trigger automation
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = await createClient();

    // Look up webhook config
    const { data: webhook, error: whError } = await (supabase
      .from('automation_webhooks') as any)
      .select(`
        id,
        automation_id,
        workspace_id,
        secret_key,
        require_signature,
        allowed_ips
      `)
      .eq('webhook_key', key)
      .single();

    if (whError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Verify the automation is active
    const { data: automation } = await (supabase
      .from('automations') as any)
      .select('id, workspace_id, name, status')
      .eq('id', webhook.automation_id)
      .single();

    if (!automation || automation.status !== 'active') {
      return NextResponse.json(
        { error: 'Automation is not active' },
        { status: 400 }
      );
    }

    // IP allowlist check
    if (webhook.allowed_ips && webhook.allowed_ips.length > 0) {
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip');

      if (!clientIp || !webhook.allowed_ips.includes(clientIp)) {
        return NextResponse.json({ error: 'IP not allowed' }, { status: 403 });
      }
    }

    // Read body as text for signature verification
    const bodyText = await request.text();
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      parsedBody = bodyText;
    }

    // Signature verification
    if (webhook.require_signature) {
      const signature = request.headers.get('x-webhook-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const expected = createHmac('sha256', webhook.secret_key)
        .update(bodyText)
        .digest('hex');

      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Collect headers and query params for trigger data
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => {
      headers[k] = v;
    });

    const query: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((v, k) => {
      query[k] = v;
    });

    // Create automation run
    const { data: run, error: runError } = await (supabase
      .from('automation_runs') as any)
      .insert({
        automation_id: automation.id,
        workspace_id: automation.workspace_id,
        status: 'pending',
        trigger_type: 'webhook',
        trigger_data: { headers, body: parsedBody, query } as any,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error('Webhook run creation error:', runError);
      return NextResponse.json(
        { error: 'Failed to create run' },
        { status: 500 }
      );
    }

    // Log the trigger
    await (supabase.from('automation_run_logs') as any).insert({
      run_id: run.id,
      level: 'info',
      message: 'Webhook received — automation run queued',
      details: {
        webhook_key: key,
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
      },
    });

    return NextResponse.json(
      { success: true, run_id: run.id, message: 'Webhook received and automation queued' },
      { status: 202 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/webhooks/[key] — Verify webhook endpoint exists
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const supabase = await createClient();

  const { data: webhook, error } = await (supabase
    .from('automation_webhooks') as any)
    .select('automation_id')
    .eq('webhook_key', key)
    .single();

  if (error || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  const { data: automation } = await (supabase
    .from('automations') as any)
    .select('name, status')
    .eq('id', webhook.automation_id)
    .single();

  return NextResponse.json({
    message: 'Webhook endpoint is active',
    automation: automation?.name,
    status: automation?.status,
    instructions: {
      method: 'POST',
      content_type: 'application/json',
      signature_header: 'x-webhook-signature (HMAC-SHA256 of request body)',
    },
  });
}
