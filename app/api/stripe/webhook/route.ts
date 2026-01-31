import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleStripeWebhook } from "@/lib/stripe/sync";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        if (session.mode === "payment") {
          // Lifetime purchase
          await (supabase
            .from("subscriptions") as any)
            .update({
              plan: "lifetime",
              status: "active",
              stripe_customer_id: session.customer as string,
            })
            .eq("user_id", userId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: existingSub } = await (supabase
          .from("subscriptions") as any)
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!existingSub) {
          console.error("No subscription found for customer:", customerId);
          break;
        }

        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "unpaid",
          incomplete: "incomplete",
          incomplete_expired: "incomplete_expired",
          paused: "paused",
        };

        await (supabase
          .from("subscriptions") as any)
          .update({
            plan: "pro",
            status: statusMap[subscription.status] || subscription.status,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("user_id", existingSub.user_id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: existingSub } = await (supabase
          .from("subscriptions") as any)
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!existingSub) {
          console.error("No subscription found for customer:", customerId);
          break;
        }

        // Downgrade to expired (read-only)
        await (supabase
          .from("subscriptions") as any)
          .update({
            plan: "expired",
            status: "expired",
            stripe_subscription_id: null,
            stripe_price_id: null,
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
          })
          .eq("user_id", existingSub.user_id);
        break;
      }

      case "invoice.payment_succeeded": {
        // Payment succeeded - no action needed, subscription status handled by other events
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user and mark subscription as past_due
        const { data: existingSub } = await (supabase
          .from("subscriptions") as any)
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (existingSub) {
          await (supabase
            .from("subscriptions") as any)
            .update({ status: "past_due" })
            .eq("user_id", existingSub.user_id);
        }

        break;
      }

      default:
        // Unhandled event types are ignored
    }

    // Sync to Command Center tables if this is a customer/subscription/invoice event
    const commandCenterEvents = [
      'customer.created', 'customer.updated',
      'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
      'invoice.paid', 'invoice.payment_failed',
    ];

    if (commandCenterEvents.includes(event.type)) {
      try {
        // Look up workspace_id from the customers table via stripe_customer_id
        let stripeCustomerId: string | null = null;

        if (event.type.startsWith('customer.subscription.')) {
          stripeCustomerId = (event.data.object as Stripe.Subscription).customer as string;
        } else if (event.type.startsWith('invoice.')) {
          stripeCustomerId = (event.data.object as Stripe.Invoice).customer as string;
        } else if (event.type.startsWith('customer.')) {
          stripeCustomerId = (event.data.object as Stripe.Customer).id;
        }

        if (stripeCustomerId) {
          const { data: cmdCustomer } = await (supabase
            .from('customers') as any)
            .select('workspace_id')
            .eq('stripe_customer_id', stripeCustomerId)
            .single();

          if (cmdCustomer?.workspace_id) {
            await handleStripeWebhook(cmdCustomer.workspace_id, event, supabase);
          }
        }
      } catch (syncError) {
        // Command Center sync failure should not break billing webhook
        console.error('Command Center sync error (non-fatal):', syncError);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
