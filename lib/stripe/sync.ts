import Stripe from 'stripe';
import { stripe } from './config';
import { createClient } from '@/lib/supabase/server';
import type {
  Customer,
  Subscription,
  SubscriptionStatus,
  SyncResult,
  SyncCustomerInput,
  SyncSubscriptionInput,
  RecordRevenueEventInput,
  RevenueEventType,
} from '@/types/command';

// ============================================================================
// STRIPE SYNC SERVICE
// Syncs Stripe customers, subscriptions, and invoices to local database
// ============================================================================

export interface SyncOptions {
  workspaceId: string;
  userId: string;
  syncType?: 'full' | 'incremental' | 'customers' | 'subscriptions' | 'invoices';
  limit?: number;
  startingAfter?: string;
}

// ============================================================================
// MAIN SYNC FUNCTIONS
// ============================================================================

/**
 * Sync all Stripe customers to local database
 */
export async function syncStripeCustomers(options: SyncOptions): Promise<SyncResult> {
  const { workspaceId, userId, limit = 100 } = options;
  const supabase = await createClient();
  const startTime = Date.now();

  const result: SyncResult = {
    success: true,
    sync_id: '',
    records_synced: 0,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    errors: [],
    duration_ms: 0,
  };

  // Create sync log entry
  const { data: syncLog, error: logError } = await (supabase
    .from('stripe_sync_log') as any)
    .insert({
      workspace_id: workspaceId,
      sync_type: 'customers',
      status: 'started',
      triggered_by: userId,
    })
    .select()
    .single();

  if (logError) {
    result.success = false;
    result.errors.push(`Failed to create sync log: ${logError.message}`);
    return result;
  }

  result.sync_id = syncLog.id;

  try {
    let hasMore = true;
    let startingAfter: string | undefined = options.startingAfter;

    while (hasMore) {
      const params: Stripe.CustomerListParams = {
        limit,
        expand: ['data.subscriptions'],
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const customers = await stripe.customers.list(params);

      for (const stripeCustomer of customers.data) {
        try {
          const customerResult = await upsertCustomer(workspaceId, stripeCustomer);
          result.records_synced++;

          if (customerResult.created) {
            result.records_created++;
          } else {
            result.records_updated++;
          }

          // Sync active subscription if exists
          const activeSubscription = stripeCustomer.subscriptions?.data.find(
            (sub: Stripe.Subscription) => sub.status === 'active' || sub.status === 'trialing'
          );

          if (activeSubscription) {
            await upsertSubscription(workspaceId, customerResult.customerId, activeSubscription);
          }
        } catch (err) {
          result.records_failed++;
          result.errors.push(
            `Failed to sync customer ${stripeCustomer.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      hasMore = customers.has_more;
      if (hasMore && customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }

    result.duration_ms = Date.now() - startTime;

    // Update sync log
    await (supabase
      .from('stripe_sync_log') as any)
      .update({
        status: 'completed',
        records_synced: result.records_synced,
        records_created: result.records_created,
        records_updated: result.records_updated,
        records_failed: result.records_failed,
        completed_at: new Date().toISOString(),
        duration_ms: result.duration_ms,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      })
      .eq('id', syncLog.id);

  } catch (err) {
    result.success = false;
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    result.duration_ms = Date.now() - startTime;

    await (supabase
      .from('stripe_sync_log') as any)
      .update({
        status: 'failed',
        error_message: result.errors.join('; '),
        completed_at: new Date().toISOString(),
        duration_ms: result.duration_ms,
      })
      .eq('id', syncLog.id);
  }

  return result;
}

/**
 * Sync all Stripe subscriptions to local database
 */
export async function syncStripeSubscriptions(options: SyncOptions): Promise<SyncResult> {
  const { workspaceId, userId, limit = 100 } = options;
  const supabase = await createClient();
  const startTime = Date.now();

  const result: SyncResult = {
    success: true,
    sync_id: '',
    records_synced: 0,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    errors: [],
    duration_ms: 0,
  };

  // Create sync log entry
  const { data: syncLog, error: logError } = await (supabase
    .from('stripe_sync_log') as any)
    .insert({
      workspace_id: workspaceId,
      sync_type: 'subscriptions',
      status: 'started',
      triggered_by: userId,
    })
    .select()
    .single();

  if (logError) {
    result.success = false;
    result.errors.push(`Failed to create sync log: ${logError.message}`);
    return result;
  }

  result.sync_id = syncLog.id;

  try {
    let hasMore = true;
    let startingAfter: string | undefined = options.startingAfter;

    while (hasMore) {
      const params: Stripe.SubscriptionListParams = {
        limit,
        expand: ['data.customer'],
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const subscriptions = await stripe.subscriptions.list(params);

      for (const stripeSub of subscriptions.data) {
        try {
          // First ensure customer exists
          const customer = stripeSub.customer as Stripe.Customer;
          const customerResult = await upsertCustomer(workspaceId, customer);

          // Then sync subscription
          const subResult = await upsertSubscription(workspaceId, customerResult.customerId, stripeSub);
          result.records_synced++;

          if (subResult.created) {
            result.records_created++;
          } else {
            result.records_updated++;
          }
        } catch (err) {
          result.records_failed++;
          result.errors.push(
            `Failed to sync subscription ${stripeSub.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      hasMore = subscriptions.has_more;
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    result.duration_ms = Date.now() - startTime;

    // Update sync log
    await (supabase
      .from('stripe_sync_log') as any)
      .update({
        status: 'completed',
        records_synced: result.records_synced,
        records_created: result.records_created,
        records_updated: result.records_updated,
        records_failed: result.records_failed,
        completed_at: new Date().toISOString(),
        duration_ms: result.duration_ms,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      })
      .eq('id', syncLog.id);

  } catch (err) {
    result.success = false;
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    result.duration_ms = Date.now() - startTime;

    await (supabase
      .from('stripe_sync_log') as any)
      .update({
        status: 'failed',
        error_message: result.errors.join('; '),
        completed_at: new Date().toISOString(),
        duration_ms: result.duration_ms,
      })
      .eq('id', syncLog.id);
  }

  return result;
}

/**
 * Full sync - customers and subscriptions
 */
export async function syncStripeData(options: SyncOptions): Promise<SyncResult> {
  const { workspaceId, userId } = options;
  const supabase = await createClient();
  const startTime = Date.now();

  const result: SyncResult = {
    success: true,
    sync_id: '',
    records_synced: 0,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    errors: [],
    duration_ms: 0,
  };

  // Create sync log entry
  const { data: syncLog, error: logError } = await (supabase
    .from('stripe_sync_log') as any)
    .insert({
      workspace_id: workspaceId,
      sync_type: 'full',
      status: 'started',
      triggered_by: userId,
    })
    .select()
    .single();

  if (logError) {
    result.success = false;
    result.errors.push(`Failed to create sync log: ${logError.message}`);
    return result;
  }

  result.sync_id = syncLog.id;

  try {
    // Sync customers first
    const customerResult = await syncStripeCustomers({ ...options, syncType: 'customers' });
    result.records_synced += customerResult.records_synced;
    result.records_created += customerResult.records_created;
    result.records_updated += customerResult.records_updated;
    result.records_failed += customerResult.records_failed;
    result.errors.push(...customerResult.errors);

    // Then sync subscriptions
    const subResult = await syncStripeSubscriptions({ ...options, syncType: 'subscriptions' });
    result.records_synced += subResult.records_synced;
    result.records_created += subResult.records_created;
    result.records_updated += subResult.records_updated;
    result.records_failed += subResult.records_failed;
    result.errors.push(...subResult.errors);

    // Update MRR history
    await updateMRRHistory(workspaceId);

    result.duration_ms = Date.now() - startTime;
    result.success = result.records_failed === 0;

    // Update sync log
    await (supabase
      .from('stripe_sync_log') as any)
      .update({
        status: result.success ? 'completed' : 'failed',
        records_synced: result.records_synced,
        records_created: result.records_created,
        records_updated: result.records_updated,
        records_failed: result.records_failed,
        completed_at: new Date().toISOString(),
        duration_ms: result.duration_ms,
        error_message: result.errors.length > 0 ? result.errors.slice(0, 10).join('; ') : null,
      })
      .eq('id', syncLog.id);

  } catch (err) {
    result.success = false;
    result.errors.push(`Full sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    result.duration_ms = Date.now() - startTime;

    await (supabase
      .from('stripe_sync_log') as any)
      .update({
        status: 'failed',
        error_message: result.errors.join('; '),
        completed_at: new Date().toISOString(),
        duration_ms: result.duration_ms,
      })
      .eq('id', syncLog.id);
  }

  return result;
}

// ============================================================================
// UPSERT FUNCTIONS
// ============================================================================

interface UpsertResult {
  customerId: string;
  created: boolean;
}

interface SubscriptionUpsertResult {
  subscriptionId: string;
  created: boolean;
}

/**
 * Upsert a Stripe customer to local database
 */
export async function upsertCustomer(
  workspaceId: string,
  stripeCustomer: Stripe.Customer,
  dbClient?: any
): Promise<UpsertResult> {
  const supabase = dbClient || await createClient();

  // Check if customer exists
  const { data: existing } = await (supabase
    .from('customers') as any)
    .select('id')
    .eq('stripe_customer_id', stripeCustomer.id)
    .single();

  const activeSubscription = stripeCustomer.subscriptions?.data.find(
    (sub: Stripe.Subscription) => sub.status === 'active' || sub.status === 'trialing'
  );

  const mrr = activeSubscription
    ? calculateMRRFromSubscription(activeSubscription)
    : 0;

  const customerData = {
    workspace_id: workspaceId,
    stripe_customer_id: stripeCustomer.id,
    stripe_subscription_id: activeSubscription?.id || null,
    email: stripeCustomer.email || '',
    name: stripeCustomer.name || null,
    company: stripeCustomer.metadata?.company || null,
    subscription_status: activeSubscription?.status as SubscriptionStatus || null,
    plan_name: activeSubscription?.items.data[0]?.price.nickname || null,
    plan_id: activeSubscription?.items.data[0]?.price.id || null,
    mrr,
    currency: activeSubscription?.currency?.toUpperCase() || 'USD',
    subscription_start_date: activeSubscription?.start_date
      ? new Date(activeSubscription.start_date * 1000).toISOString()
      : null,
    subscription_end_date: activeSubscription?.current_period_end
      ? new Date(activeSubscription.current_period_end * 1000).toISOString()
      : null,
    trial_end_date: activeSubscription?.trial_end
      ? new Date(activeSubscription.trial_end * 1000).toISOString()
      : null,
    canceled_at: activeSubscription?.canceled_at
      ? new Date(activeSubscription.canceled_at * 1000).toISOString()
      : null,
    days_until_renewal: activeSubscription?.current_period_end
      ? Math.ceil((activeSubscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
    synced_at: new Date().toISOString(),
    metadata: stripeCustomer.metadata || {},
  };

  if (existing) {
    const { error } = await (supabase
      .from('customers') as any)
      .update(customerData)
      .eq('id', existing.id);

    if (error) throw new Error(`Failed to update customer: ${error.message}`);

    return { customerId: existing.id, created: false };
  } else {
    const { data, error } = await (supabase
      .from('customers') as any)
      .insert(customerData)
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create customer: ${error.message}`);

    return { customerId: data.id, created: true };
  }
}

/**
 * Upsert a Stripe subscription to local database
 */
export async function upsertSubscription(
  workspaceId: string,
  customerId: string,
  stripeSubscription: Stripe.Subscription,
  dbClient?: any
): Promise<SubscriptionUpsertResult> {
  const supabase = dbClient || await createClient();

  // Check if subscription exists
  const { data: existing } = await (supabase
    .from('stripe_subscriptions') as any)
    .select('id')
    .eq('stripe_subscription_id', stripeSubscription.id)
    .single();

  const price = stripeSubscription.items.data[0]?.price;
  const amount = (price?.unit_amount || 0) / 100;
  const interval = price?.recurring?.interval || 'month';
  const intervalCount = price?.recurring?.interval_count || 1;
  const mrr = calculateMRRFromAmount(amount, interval, intervalCount);

  const subscriptionData = {
    workspace_id: workspaceId,
    customer_id: customerId,
    stripe_subscription_id: stripeSubscription.id,
    stripe_customer_id: typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer.id,
    status: stripeSubscription.status as SubscriptionStatus,
    plan_name: price?.nickname || null,
    plan_id: price?.product as string || null,
    price_id: price?.id || null,
    amount,
    currency: stripeSubscription.currency.toUpperCase(),
    interval,
    interval_count: intervalCount,
    mrr,
    current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    trial_start: stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000).toISOString()
      : null,
    trial_end: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null,
    canceled_at: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
      : null,
    ended_at: stripeSubscription.ended_at
      ? new Date(stripeSubscription.ended_at * 1000).toISOString()
      : null,
    billing_cycle_anchor: new Date(stripeSubscription.billing_cycle_anchor * 1000).toISOString(),
    collection_method: stripeSubscription.collection_method,
    synced_at: new Date().toISOString(),
    metadata: stripeSubscription.metadata || {},
  };

  if (existing) {
    const { error } = await (supabase
      .from('stripe_subscriptions') as any)
      .update(subscriptionData)
      .eq('id', existing.id);

    if (error) throw new Error(`Failed to update subscription: ${error.message}`);

    return { subscriptionId: existing.id, created: false };
  } else {
    const { data, error } = await (supabase
      .from('stripe_subscriptions') as any)
      .insert(subscriptionData as any)
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create subscription: ${error.message}`);

    return { subscriptionId: data.id, created: true };
  }
}

// ============================================================================
// REVENUE EVENTS
// ============================================================================

/**
 * Record a revenue event from Stripe webhook
 */
export async function recordRevenueEvent(
  workspaceId: string,
  input: RecordRevenueEventInput,
  dbClient?: any
): Promise<string> {
  const supabase = dbClient || await createClient();

  const { data, error } = await (supabase
    .from('revenue_events') as any)
    .insert({
      workspace_id: workspaceId,
      customer_id: input.customer_id,
      subscription_id: input.subscription_id,
      stripe_event_id: input.stripe_event_id,
      stripe_invoice_id: input.stripe_invoice_id,
      stripe_charge_id: input.stripe_charge_id,
      event_type: input.event_type,
      amount: input.amount,
      currency: input.currency || 'USD',
      mrr_impact: input.mrr_impact || 0,
      description: input.description,
      plan_from: input.plan_from,
      plan_to: input.plan_to,
      status: input.status,
      failure_reason: input.failure_reason,
      event_date: input.event_date || new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to record revenue event: ${error.message}`);

  return data.id;
}

// ============================================================================
// MRR HISTORY
// ============================================================================

/**
 * Update MRR history for a workspace
 */
export async function updateMRRHistory(workspaceId: string, dbClient?: any): Promise<void> {
  const supabase = dbClient || await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Get current totals
  const { data: customers } = await (supabase
    .from('customers') as any)
    .select('mrr, status')
    .eq('workspace_id', workspaceId);

  if (!customers) return;

  type CustomerRow = { mrr: number; status: string };

  const totalMRR = customers
    .filter((c: CustomerRow) => c.status === 'active' || c.status === 'new' || c.status === 'at_risk')
    .reduce((sum: number, c: CustomerRow) => sum + Number(c.mrr), 0);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (c: CustomerRow) => c.status === 'active' || c.status === 'new' || c.status === 'at_risk'
  ).length;
  const churnedCustomers = customers.filter((c: CustomerRow) => c.status === 'churned').length;

  // Get previous day's record for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data: previousRecord } = await (supabase
    .from('mrr_history') as any)
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('period_date', yesterdayStr)
    .eq('period_type', 'daily')
    .single();

  const previousMRR = previousRecord?.mrr || 0;
  const netMRRChange = totalMRR - previousMRR;
  const growthRate = previousMRR > 0 ? (netMRRChange / previousMRR) * 100 : 0;
  const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

  // Upsert today's record
  const { error } = await (supabase
    .from('mrr_history') as any)
    .upsert(
      {
        workspace_id: workspaceId,
        period_date: today,
        period_type: 'daily',
        mrr: totalMRR,
        net_mrr_change: netMRRChange,
        total_customers: totalCustomers,
        new_customers: customers.filter((c: CustomerRow) => c.status === 'new').length,
        churned_customers: churnedCustomers,
        churn_rate: churnRate,
        growth_rate: growthRate,
      },
      {
        onConflict: 'workspace_id,period_date,period_type',
      }
    );

  if (error) {
    console.error('Failed to update MRR history:', error);
  }
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  workspaceId: string,
  event: Stripe.Event,
  dbClient?: any
): Promise<void> {
  switch (event.type) {
    case 'customer.created':
    case 'customer.updated':
      await handleCustomerEvent(workspaceId, event.data.object as Stripe.Customer, dbClient);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionEvent(workspaceId, event.data.object as Stripe.Subscription, event.type, dbClient);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(workspaceId, event.data.object as Stripe.Invoice, dbClient);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(workspaceId, event.data.object as Stripe.Invoice, dbClient);
      break;

    default:
      // Ignore other event types
      break;
  }

  // Update MRR history after any event
  await updateMRRHistory(workspaceId, dbClient);
}

async function handleCustomerEvent(workspaceId: string, customer: Stripe.Customer, dbClient?: any): Promise<void> {
  // Fetch full customer with subscriptions
  const fullCustomer = await stripe.customers.retrieve(customer.id, {
    expand: ['subscriptions'],
  });

  if (fullCustomer.deleted) return;

  await upsertCustomer(workspaceId, fullCustomer as Stripe.Customer, dbClient);
}

async function handleSubscriptionEvent(
  workspaceId: string,
  subscription: Stripe.Subscription,
  eventType: string,
  dbClient?: any
): Promise<void> {
  const supabase = dbClient || await createClient();

  // Get or create customer
  const { data: customer } = await (supabase
    .from('customers') as any)
    .select('id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single();

  let customerId = customer?.id;

  if (!customerId) {
    // Fetch and create customer first
    const stripeCustomer = await stripe.customers.retrieve(subscription.customer as string, {
      expand: ['subscriptions'],
    });
    if (stripeCustomer.deleted) return;

    const result = await upsertCustomer(workspaceId, stripeCustomer as Stripe.Customer, dbClient);
    customerId = result.customerId;
  }

  await upsertSubscription(workspaceId, customerId, subscription, dbClient);

  // Record revenue event
  const price = subscription.items.data[0]?.price;
  const amount = (price?.unit_amount || 0) / 100;
  const mrr = calculateMRRFromSubscription(subscription);

  let eventType_: RevenueEventType = 'new';
  if (eventType === 'customer.subscription.deleted') {
    eventType_ = 'churn';
  } else if (eventType === 'customer.subscription.updated') {
    eventType_ = 'expansion'; // Could be contraction too, need to compare
  }

  await recordRevenueEvent(workspaceId, {
    customer_id: customer.id,
    event_type: eventType_,
    amount,
    mrr_impact: eventType_ === 'churn' ? -mrr : mrr,
    plan_to: price?.nickname || undefined,
    status: 'succeeded',
  }, dbClient);
}

async function handleInvoicePaid(workspaceId: string, invoice: Stripe.Invoice, dbClient?: any): Promise<void> {
  const supabase = dbClient || await createClient();

  const { data: customer } = await (supabase
    .from('customers') as any)
    .select('id, payment_count')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (!customer) return;

  // Update customer payment info
  await (supabase
    .from('customers') as any)
    .update({
      last_payment_date: new Date().toISOString(),
      last_invoice_date: new Date().toISOString(),
      payment_count: (customer.payment_count || 0) + 1,
    } as any)
    .eq('id', customer.id);

  // Record payment event
  await recordRevenueEvent(workspaceId, {
    customer_id: customer.id,
    stripe_invoice_id: invoice.id,
    event_type: 'payment',
    amount: (invoice.amount_paid || 0) / 100,
    status: 'succeeded',
  }, dbClient);
}

async function handlePaymentFailed(workspaceId: string, invoice: Stripe.Invoice, dbClient?: any): Promise<void> {
  const supabase = dbClient || await createClient();

  const { data: customer } = await (supabase
    .from('customers') as any)
    .select('id, failed_payment_count')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (!customer) return;

  // Update customer failed payment count
  await (supabase
    .from('customers') as any)
    .update({
      failed_payment_count: (customer.failed_payment_count || 0) + 1,
    })
    .eq('id', customer.id);

  // Record failed payment event
  await recordRevenueEvent(workspaceId, {
    customer_id: customer.id,
    stripe_invoice_id: invoice.id,
    event_type: 'payment',
    amount: (invoice.amount_due || 0) / 100,
    status: 'failed',
    failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
  }, dbClient);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateMRRFromSubscription(subscription: Stripe.Subscription): number {
  const price = subscription.items.data[0]?.price;
  if (!price) return 0;

  const amount = (price.unit_amount || 0) / 100;
  const interval = price.recurring?.interval || 'month';
  const intervalCount = price.recurring?.interval_count || 1;

  return calculateMRRFromAmount(amount, interval, intervalCount);
}

function calculateMRRFromAmount(
  amount: number,
  interval: string,
  intervalCount: number = 1
): number {
  switch (interval) {
    case 'month':
      return amount / intervalCount;
    case 'year':
      return amount / (12 * intervalCount);
    case 'week':
      return (amount * 52) / (12 * intervalCount);
    case 'day':
      return (amount * 365) / (12 * intervalCount);
    default:
      return amount;
  }
}
