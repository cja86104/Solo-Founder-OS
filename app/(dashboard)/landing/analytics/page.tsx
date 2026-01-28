import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsContent } from "@/components/landing/analytics-content";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Analytics - Landing Page Factory",
  description: "View analytics for your landing pages",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get all landing pages with their analytics
  const { data: pages } = await supabase
    .from("landing_pages")
    .select("id, title, slug, status, view_count, conversion_count, created_at, published_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get recent analytics events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: analyticsEvents } = await supabase
    .from("landing_page_analytics")
    .select(`
      id,
      page_id,
      event_type,
      created_at,
      landing_pages!inner (
        user_id
      )
    `)
    .eq("landing_pages.user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  // Get lead counts by page
  const { data: leadCounts } = await supabase
    .from("landing_page_leads")
    .select(`
      page_id,
      landing_pages!inner (
        user_id
      )
    `)
    .eq("landing_pages.user_id", user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track performance across all your landing pages
        </p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent
          pages={pages || []}
          analyticsEvents={analyticsEvents || []}
          leadCounts={leadCounts || []}
        />
      </Suspense>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      <Skeleton className="h-[300px]" />
      <Skeleton className="h-[400px]" />
    </div>
  );
}
