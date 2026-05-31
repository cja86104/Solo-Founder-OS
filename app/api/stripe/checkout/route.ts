import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_IDS } from "@/lib/stripe/config";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceType } = body as {
      priceType: "pro" | "lifetime";
    };

    // Determine price ID early so we can validate before creating a customer.
    // Pro is monthly-only — the previous `interval` parameter for yearly
    // billing was removed on 2026-05-31 along with the yearly price ID. Any
    // older client still sending `interval` in the body has the field silently
    // ignored and is routed to monthly, which is the safe fallback (the user
    // is charged a known live price rather than crashing checkout).
    let priceId: string;
    if (priceType === "lifetime") {
      priceId = PRICE_IDS.LIFETIME;
    } else {
      priceId = PRICE_IDS.PRO_MONTHLY;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID — use upsert to handle missing subscription row
      const { error: saveError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          plan: "expired",
          status: "expired",
        }, { onConflict: "user_id" });

      if (saveError) {
        console.error("Failed to save stripe_customer_id:", saveError);
      }
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: priceType === "lifetime" ? "payment" : "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        price_type: priceType,
      },
    };

    // Add subscription-specific options
    if (priceType !== "lifetime") {
      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
