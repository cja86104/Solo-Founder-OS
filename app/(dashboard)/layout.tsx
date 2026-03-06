import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { SubscriptionProvider } from "@/lib/subscription-context";
import type { Database } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch subscription - if missing, we'll use a default
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single<Database["public"]["Tables"]["subscriptions"]["Row"]>();

  // Default subscription for users without one (expired -- forces upgrade)
  // Do NOT recalculate trial_ends_at on every load, as that creates a perpetual trial.
  const defaultSubscription: Database["public"]["Tables"]["subscriptions"]["Row"] = {
    id: "default",
    user_id: user.id,
    plan: "expired",
    status: "expired",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    trial_ends_at: null,
    cancel_at_period_end: null,
    current_period_start: null,
    current_period_end: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activeSubscription = subscription || defaultSubscription;

  return (
    <WorkspaceProvider subscription={activeSubscription}>
      <SubscriptionProvider subscription={activeSubscription}>
        <AppShell
          user={user}
          profile={profile}
          subscription={activeSubscription}
        >
          {children}
        </AppShell>
      </SubscriptionProvider>
    </WorkspaceProvider>
  );
}
