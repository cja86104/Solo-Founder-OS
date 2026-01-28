import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, FileText, Eye, Users, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingPageCard } from "@/components/landing/landing-page-card";

export const metadata: Metadata = {
  title: "Landing Pages",
  description: "Build and deploy high-converting landing pages",
};

export default async function LandingPagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch pages
  const { data: pages } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Fetch lead counts
  const { data: leadCounts } = await supabase
    .from("landing_page_leads")
    .select("page_id")
    .in("page_id", pages?.map((p) => p.id) || []);

  const totalLeads = leadCounts?.length || 0;

  // Calculate stats
  const totalViews = pages?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
  const totalConversions = pages?.reduce((sum, p) => sum + (p.conversion_count || 0), 0) || 0;
  const publishedCount = pages?.filter((p) => p.status === "published").length || 0;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground">
            Build and deploy high-converting landing pages
          </p>
        </div>
        <Link href="/landing/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pages?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Pages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Eye className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <MousePointerClick className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Conversions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLeads.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pages List */}
      {pages && pages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <LandingPageCard key={page.id} page={page as any} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No landing pages yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first landing page to start collecting leads
            </p>
            <Link href="/landing/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Landing Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </>
  );
}
