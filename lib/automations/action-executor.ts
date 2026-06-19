import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@/types/db-helpers';
import { Resend } from 'resend';
import { replaceVariables, replaceVariablesInObject } from './variables';
import type {
  ActionConfigSendEmail,
  ActionConfigCreateTask,
  ActionConfigUpdateContact,
  ActionConfigAddTag,
  ActionConfigRemoveTag,
  ActionConfigMoveDeal,
  ActionConfigCreateDeal,
  ActionConfigUpdateDeal,
  ActionConfigWebhook,
  ActionConfigDelay,
  ActionConfigCondition,
} from '@/types/automations';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Execute a single automation action with real integrations.
 * Throws 'CONDITION_NOT_MET' to signal the caller to stop executing further actions.
 */
export async function executeAction(
  supabase: SupabaseClient,
  actionType: string,
  actionConfig: Record<string, unknown>,
  triggerData: Record<string, unknown>
): Promise<void> {
  const config = replaceVariablesInObject(actionConfig, triggerData);

  switch (actionType) {
    case 'send_email':
      return executeSendEmail(config as unknown as ActionConfigSendEmail);
    case 'create_task':
      return executeCreateTask(supabase, config as unknown as ActionConfigCreateTask, triggerData);
    case 'update_contact':
      return executeUpdateContact(supabase, config as unknown as ActionConfigUpdateContact, triggerData);
    case 'add_tag':
      return executeAddTag(supabase, config as unknown as ActionConfigAddTag, triggerData);
    case 'remove_tag':
      return executeRemoveTag(supabase, config as unknown as ActionConfigRemoveTag, triggerData);
    case 'move_deal':
      return executeMoveDeal(supabase, config as unknown as ActionConfigMoveDeal, triggerData);
    case 'create_deal':
      return executeCreateDeal(supabase, config as unknown as ActionConfigCreateDeal, triggerData);
    case 'update_deal':
      return executeUpdateDeal(supabase, config as unknown as ActionConfigUpdateDeal, triggerData);
    case 'webhook':
      return executeWebhook(config as unknown as ActionConfigWebhook, triggerData);
    case 'delay':
      return executeDelay(config as unknown as ActionConfigDelay);
    case 'condition':
      return executeCondition(config as unknown as ActionConfigCondition, triggerData);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

// ---------------------------------------------------------------------------
// send_email
// ---------------------------------------------------------------------------
async function executeSendEmail(config: ActionConfigSendEmail): Promise<void> {
  if (!resend) {
    throw new Error('Email service not configured (RESEND_API_KEY missing)');
  }

  // The 'to' field is already resolved via variable replacement for 'custom' type
  const to =
    config.to === 'custom' ? config.custom_email! : (config.to as string);

  if (!to) throw new Error('No recipient email address resolved');

  const { error } = await resend.emails.send({
    from: 'Founders Helm <noreply@foundershelm.com>',
    to,
    subject: config.subject,
    html: config.body,
    replyTo: config.reply_to,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

// ---------------------------------------------------------------------------
// create_task
// ---------------------------------------------------------------------------
async function executeCreateTask(
  supabase: SupabaseClient,
  config: ActionConfigCreateTask,
  triggerData: Record<string, unknown>
): Promise<void> {
  const workspaceId = triggerData.workspace_id as string;
  if (!workspaceId) throw new Error('No workspace_id in trigger data');

  let dueDate: string | null = null;
  if (config.due_in_days) {
    const d = new Date();
    d.setDate(d.getDate() + config.due_in_days);
    dueDate = d.toISOString();
  }

  const { error } = await supabase.from('tasks').insert({
    workspace_id: workspaceId,
    user_id: config.assignee_id || '',
    project_id: config.project_id || null,
    title: config.title,
    description: config.description || null,
    priority: config.priority,
    due_date: dueDate,
    assignee_id: config.assignee_id || null,
    status: 'todo',
  });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// update_contact
// ---------------------------------------------------------------------------
async function executeUpdateContact(
  supabase: SupabaseClient,
  config: ActionConfigUpdateContact,
  triggerData: Record<string, unknown>
): Promise<void> {
  const contactId = triggerData.contact_id as string;
  if (!contactId) throw new Error('No contact_id in trigger data');

  const { error } = await supabase
    .from('contacts')
    .update(config.fields as TablesUpdate<'contacts'>)
    .eq('id', contactId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// add_tag / remove_tag
// ---------------------------------------------------------------------------
async function executeAddTag(
  supabase: SupabaseClient,
  config: ActionConfigAddTag,
  triggerData: Record<string, unknown>
): Promise<void> {
  const contactId = triggerData.contact_id as string;
  if (!contactId) throw new Error('No contact_id in trigger data');

  const { data: contact, error: fetchError } = await supabase
    .from('contacts')
    .select('tags')
    .eq('id', contactId)
    .single();

  if (fetchError) throw fetchError;

  const current = (contact?.tags || []) as string[];
  const merged = [...new Set([...current, ...config.tags])];

  const { error } = await supabase
    .from('contacts')
    .update({ tags: merged })
    .eq('id', contactId);

  if (error) throw error;
}

async function executeRemoveTag(
  supabase: SupabaseClient,
  config: ActionConfigRemoveTag,
  triggerData: Record<string, unknown>
): Promise<void> {
  const contactId = triggerData.contact_id as string;
  if (!contactId) throw new Error('No contact_id in trigger data');

  const { data: contact, error: fetchError } = await supabase
    .from('contacts')
    .select('tags')
    .eq('id', contactId)
    .single();

  if (fetchError) throw fetchError;

  const current = (contact?.tags || []) as string[];
  const filtered = current.filter((t) => !config.tags.includes(t));

  const { error } = await supabase
    .from('contacts')
    .update({ tags: filtered })
    .eq('id', contactId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// move_deal / create_deal / update_deal
// ---------------------------------------------------------------------------
async function executeMoveDeal(
  supabase: SupabaseClient,
  config: ActionConfigMoveDeal,
  triggerData: Record<string, unknown>
): Promise<void> {
  const dealId = triggerData.deal_id as string;
  if (!dealId) throw new Error('No deal_id in trigger data');

  const { error } = await supabase
    .from('deals')
    .update({ stage_id: config.stage_id })
    .eq('id', dealId);

  if (error) throw error;
}

async function executeCreateDeal(
  supabase: SupabaseClient,
  config: ActionConfigCreateDeal,
  triggerData: Record<string, unknown>
): Promise<void> {
  const workspaceId = triggerData.workspace_id as string;
  if (!workspaceId) throw new Error('No workspace_id in trigger data');

  const contactId = config.contact_field
    ? (triggerData[config.contact_field] as string)
    : (triggerData.contact_id as string | undefined);

  const { error } = await supabase.from('deals').insert({
    workspace_id: workspaceId,
    name: config.name,
    stage_id: config.stage_id,
    value: config.value || 0,
    contact_id: contactId || null,
  });

  if (error) throw error;
}

async function executeUpdateDeal(
  supabase: SupabaseClient,
  config: ActionConfigUpdateDeal,
  triggerData: Record<string, unknown>
): Promise<void> {
  const dealId = triggerData.deal_id as string;
  if (!dealId) throw new Error('No deal_id in trigger data');

  const { error } = await supabase
    .from('deals')
    .update(config.fields as TablesUpdate<'deals'>)
    .eq('id', dealId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// webhook
// ---------------------------------------------------------------------------
async function executeWebhook(
  config: ActionConfigWebhook,
  triggerData: Record<string, unknown>
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Founders-Helm-Automations/1.0',
    ...config.headers,
  };

  const body = config.body_template
    ? replaceVariables(config.body_template, triggerData)
    : JSON.stringify(triggerData);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    (config.timeout_seconds || 30) * 1000
  );

  try {
    const res = await fetch(config.url, {
      method: config.method,
      headers,
      body: config.method !== 'GET' ? body : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Webhook failed: ${res.status} ${res.statusText}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// delay
// ---------------------------------------------------------------------------
async function executeDelay(config: ActionConfigDelay): Promise<void> {
  const totalMs =
    (config.delay_seconds || 0) * 1000 +
    (config.delay_minutes || 0) * 60 * 1000 +
    (config.delay_hours || 0) * 60 * 60 * 1000 +
    (config.delay_days || 0) * 24 * 60 * 60 * 1000;

  // Cap synchronous waits at 5 minutes; longer delays need a queue system
  if (totalMs > 0 && totalMs <= 300_000) {
    await new Promise((resolve) => setTimeout(resolve, totalMs));
  } else if (totalMs > 300_000) {
    throw new Error(
      'Delays longer than 5 minutes require async queue processing'
    );
  }
}

// ---------------------------------------------------------------------------
// condition
// ---------------------------------------------------------------------------
async function executeCondition(
  config: ActionConfigCondition,
  triggerData: Record<string, unknown>
): Promise<void> {
  const fieldValue = triggerData[config.field];
  let met = false;

  switch (config.operator) {
    case 'equals':
      met = fieldValue === config.value;
      break;
    case 'not_equals':
      met = fieldValue !== config.value;
      break;
    case 'contains':
      met = String(fieldValue).includes(String(config.value));
      break;
    case 'not_contains':
      met = !String(fieldValue).includes(String(config.value));
      break;
    case 'greater_than':
      met = Number(fieldValue) > Number(config.value);
      break;
    case 'less_than':
      met = Number(fieldValue) < Number(config.value);
      break;
    case 'is_empty':
      met = !fieldValue || String(fieldValue).trim() === '';
      break;
    case 'is_not_empty':
      met = !!fieldValue && String(fieldValue).trim() !== '';
      break;
  }

  if (!met) {
    throw new Error('CONDITION_NOT_MET');
  }
}
