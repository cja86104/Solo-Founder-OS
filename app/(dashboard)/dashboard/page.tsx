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
  description: "Your Solo Founder OS dashboard",
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              Connect Stripe to track revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Add analytics to your site
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Create deals in CRM
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start tracking projects
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
            Complete these steps to get the most out of Solo Founder OS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-muted-foreground">1 of 5</span>
            </div>
            <Progress value={20} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="success">Done</Badge>
              <span className="text-sm">Create your account</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Todo</Badge>
              <span className="text-sm">Add your first code snippet</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Todo</Badge>
              <span className="text-sm">Create a landing page</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Todo</Badge>
              <span className="text-sm">Add a contact to CRM</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Todo</Badge>
              <span className="text-sm">Set up analytics tracking</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
