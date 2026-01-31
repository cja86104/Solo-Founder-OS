import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  Code2,
  FileText,
  MessageSquare,
  BarChart3,
  Users,
  PenTool,
  FolderKanban,
  Brain,
  LineChart,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Founders Helm dashboard",
};

const products = [
  {
    name: "Code Vault",
    description: "Snippets & prompts library",
    href: "/vault",
    icon: Code2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "Landing Pages",
    description: "Build & deploy landing pages",
    href: "/landing",
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    name: "Feedback",
    description: "Collect user feedback",
    href: "/feedback",
    icon: MessageSquare,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    name: "Command Center",
    description: "SaaS metrics & health",
    href: "/command",
    icon: BarChart3,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    name: "CRM",
    description: "Contacts & deals",
    href: "/crm",
    icon: Users,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    name: "Content Engine",
    description: "AI content creation",
    href: "/content",
    icon: PenTool,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    name: "Projects",
    description: "Client project tracking",
    href: "/projects",
    icon: FolderKanban,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    name: "AI Advisor",
    description: "Business insights",
    href: "/advisor",
    icon: Brain,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    name: "Analytics",
    description: "Privacy-first analytics",
    href: "/analytics",
    icon: LineChart,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's workspace
  const { data: membership } = await (supabase
    .from("workspace_members") as any)
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const workspaceId = membership?.workspace_id;

  // Fetch real stats in parallel
  const [mrrResult, dealsResult, projectsResult, snippetsResult, landingResult, contactsResult] = await Promise.all([
    // Total MRR from Command Center customers
    workspaceId
      ? (supabase.from("customers") as any)
          .select("mrr")
          .eq("workspace_id", workspaceId)
          .in("status", ["active", "new", "at_risk"])
      : Promise.resolve({ data: null }),
    // Open deals count
    workspaceId
      ? (supabase.from("deals") as any)
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "open")
      : Promise.resolve({ count: null }),
    // Active projects count
    workspaceId
      ? (supabase.from("projects") as any)
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active")
      : Promise.resolve({ count: null }),
    // Vault snippets count (for getting started)
    (supabase.from("vault_items") as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    // Landing pages count (for getting started)
    workspaceId
      ? (supabase.from("landing_pages") as any)
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
      : Promise.resolve({ count: null }),
    // Contacts count (for getting started)
    workspaceId
      ? (supabase.from("contacts") as any)
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
      : Promise.resolve({ count: null }),
  ]);

  // Calculate total MRR
  const totalMRR = mrrResult.data
    ? mrrResult.data.reduce((sum: number, c: { mrr: number }) => sum + Number(c.mrr || 0), 0)
    : 0;

  const openDeals = dealsResult.count || 0;
  const activeProjects = projectsResult.count || 0;

  // Getting started checklist
  const hasSnippets = (snippetsResult.count || 0) > 0;
  const hasLandings = (landingResult.count || 0) > 0;
  const hasContacts = (contactsResult.count || 0) > 0;
  const hasDeals = openDeals > 0;

  const steps = [
    { label: "Create your account", done: true },
    { label: "Add your first code snippet", done: hasSnippets },
    { label: "Create a landing page", done: hasLandings },
    { label: "Add a contact to CRM", done: hasContacts },
    { label: "Create your first deal", done: hasDeals },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  // Format MRR
  const formattedMRR = totalMRR > 0
    ? `$${totalMRR.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your business.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedMRR}</div>
            <p className="text-xs text-muted-foreground">
              {totalMRR > 0 ? "MRR from active customers" : "Connect Stripe to track revenue"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsResult.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(contactsResult.count || 0) > 0 ? "Total contacts in CRM" : "Add contacts to your CRM"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openDeals}</div>
            <p className="text-xs text-muted-foreground">
              {openDeals > 0 ? "Deals in pipeline" : "Create deals in CRM"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects > 0 ? "Projects in progress" : "Start tracking projects"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.href} href={product.href}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-2 rounded-lg ${product.bgColor}`}>
                    <product.icon className={`h-5 w-5 ${product.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {product.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Complete these steps to get the most out of Founders Helm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-muted-foreground">{completedSteps} of {steps.length}</span>
            </div>
            <Progress value={progressPercent} />
          </div>
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <Badge variant={step.done ? "success" : "outline"}>
                  {step.done ? "Done" : "Todo"}
                </Badge>
                <span className="text-sm">{step.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
