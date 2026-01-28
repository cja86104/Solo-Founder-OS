import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LeadsContent } from "@/components/landing/leads-content";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Leads - Landing Page Factory",
  description: "Manage your captured leads",
};

export default async function LeadsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get all landing pages for the filter dropdown
  const { data: pages } = await supabase
    .from("landing_pages")
    .select("id, title, slug")
    .eq("user_id", user.id)
    .order("title");

  // Get all leads with page info
  const { data: leads } = await supabase
    .from("landing_page_leads")
    .select(`
      *,
      landing_pages!inner (
        id,
        title,
        slug,
        user_id
      )
    `)
    .eq("landing_pages.user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-muted-foreground">
          View and manage leads captured from your landing pages
        </p>
      </div>

      <Suspense fallback={<LeadsSkeleton />}>
        <LeadsContent 
          leads={leads || []} 
          pages={pages || []} 
        />
      </Suspense>
    </div>
  );
}

function LeadsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
