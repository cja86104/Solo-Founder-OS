import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider } from "@/lib/workspace-context";

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
    .single();

  // Default subscription for users without one (free tier)
  const defaultSubscription = {
    id: "default",
    user_id: user.id,
    plan: "free" as const,
    status: "active" as const,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <WorkspaceProvider>
      <AppShell
        user={user}
        profile={profile}
        subscription={subscription || defaultSubscription}
      >
        {children}
      </AppShell>
    </WorkspaceProvider>
  );
}
