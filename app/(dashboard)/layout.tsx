import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { SubscriptionProvider } from "@/lib/subscription-context";

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
  const { data: profile } = await (supabase
    .from("profiles") as any)
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch subscription - if missing, we'll use a default
  const { data: subscription } = await (supabase
    .from("subscriptions") as any)
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Default subscription for users without one (expired -- forces upgrade)
  // Do NOT recalculate trial_ends_at on every load, as that creates a perpetual trial.
  const defaultSubscription = {
    id: "default",
    user_id: user.id,
    plan: "expired" as const,
    status: "expired" as const,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    trial_ends_at: null,
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
