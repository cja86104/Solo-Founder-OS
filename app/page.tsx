import Link from "next/link";
import {
  Code2,
  FileText,
  Users,
  PenTool,
  FolderKanban,
  Brain,
  LineChart,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Check,
  Sparkles,
  Heart,
  Shield,
  Headphones,
  Rocket,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { FoundersHelmIcon } from "@/components/founders-helm-icon";

const products = [
  {
    name: "Code Vault",
    description: "Store and organize your code snippets, prompts, and templates",
    icon: Code2,
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Landing Pages",
    description: "Build high-converting landing pages without code",
    icon: FileText,
    color: "from-amber-500 to-yellow-500",
  },
  {
    name: "Personal CRM",
    description: "Track deals, contacts, and your sales pipeline",
    icon: Users,
    color: "from-orange-600 to-red-500",
  },
  {
    name: "Content Engine",
    description: "Plan, create, and schedule your content calendar",
    icon: PenTool,
    color: "from-red-500 to-orange-500",
  },
  {
    name: "Projects",
    description: "Manage tasks, track time, and invoice clients",
    icon: FolderKanban,
    color: "from-amber-600 to-orange-500",
  },
  {
    name: "AI Advisor",
    description: "Get AI-powered insights for your business decisions",
    icon: Brain,
    color: "from-orange-400 to-amber-400",
  },
  {
    name: "Insights",
    description: "See your entire business at a glance with real-time dashboards",
    icon: LineChart,
    color: "from-yellow-500 to-amber-500",
  },
  {
    name: "Feedback",
    description: "Collect and manage user feedback with embeddable widgets",
    icon: MessageSquare,
    color: "from-red-600 to-orange-600",
  },
  {
    name: "Command Center",
    description: "Real-time dashboard for all your SaaS metrics",
    icon: BarChart3,
    color: "from-orange-500 to-red-600",
  },
];

const features = [
  "10 integrated tools in one dashboard",
  "All features included",
  "Built for founders & indie hackers",
  "Privacy-first, you own your data",
  "Modern stack: Next.js, Supabase, Tailwind",
  "Cloud-hosted & always available",
];

const steps = [
  {
    number: "01",
    title: "Sign Up in Seconds",
    description: "Create your account and workspace. No credit card required to get started.",
  },
  {
    number: "02",
    title: "Connect Your Tools",
    description: "Set up your CRM, landing pages, content calendar, and more — all from one dashboard.",
  },
  {
    number: "03",
    title: "Automate & Scale",
    description: "Build automations, track insights, and let the AI Advisor guide your growth.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF6F1] text-stone-900 overflow-hidden">
      {/* Navigation */}
      <MarketingNav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Warm Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-orange-200/40 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-amber-200/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-orange-100/40 rounded-full blur-[120px]" />

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `linear-gradient(rgba(194, 133, 70, 0.15) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(194, 133, 70, 0.15) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Fade at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#FAF6F1] to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Built for Founders</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6">
            <span className="text-stone-900">Your Entire Business.</span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
              One Dashboard.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-stone-700 max-w-3xl mx-auto mb-10">
            Stop juggling 10 different tools. Founders Helm combines everything you need
            to build, launch, and grow your business in one powerful platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-105"
              asChild
            >
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg !bg-white/70 border-stone-300 !text-stone-700 !hover:bg-white hover:text-stone-900 hover:border-orange-400"
              asChild
            >
              <Link href="#products">
                See All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
            {["Enterprise Ready", "Secure & Reliable", "24/7 Support"].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-stone-200 text-sm text-stone-700 backdrop-blur-sm"
              >
                <Check className="h-3.5 w-3.5 text-orange-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-stone-300 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-orange-400 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                10 Products.
              </span>{" "}
              One Platform.
            </h2>
            <p className="text-xl text-stone-700 max-w-2xl mx-auto">
              Everything you need to run your solo business, seamlessly integrated in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.name}
                className="group relative p-6 rounded-2xl bg-white/70 border border-stone-200 hover:border-orange-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/50 backdrop-blur-sm"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <product.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-stone-700">{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[100px] -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Built Different.
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Our Story.
                </span>
              </h2>
              <p className="text-xl text-stone-700 mb-8">
                We&apos;re founders ourselves. We know the pain of managing a dozen
                subscriptions just to run a simple business. So we built this to give founders an unfair advantage.
              </p>
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-stone-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dashboard Preview Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur-2xl opacity-15" />
              <div className="relative rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-2xl shadow-stone-200/50">
                {/* Mock browser header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 bg-stone-200 rounded-md max-w-xs" />
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-5 space-y-4">
                  {/* Stat cards row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50">
                      <DollarSign className="h-4 w-4 text-orange-500 mb-1" />
                      <p className="text-lg font-bold text-stone-800">$12,400</p>
                      <p className="text-xs text-stone-400">Revenue</p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/50">
                      <Users className="h-4 w-4 text-stone-400 mb-1" />
                      <p className="text-lg font-bold text-stone-800">248</p>
                      <p className="text-xs text-stone-400">Contacts</p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/50">
                      <CheckCircle2 className="h-4 w-4 text-stone-400 mb-1" />
                      <p className="text-lg font-bold text-stone-800">37</p>
                      <p className="text-xs text-stone-400">Tasks Done</p>
                    </div>
                  </div>
                  {/* Chart area */}
                  <div className="rounded-xl bg-stone-50 border border-stone-200/50 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-stone-700">Revenue Trend</p>
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    {/* Fake chart bars */}
                    <div className="flex items-end gap-1.5 h-20">
                      {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-orange-400 to-amber-300 opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Bottom row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/50">
                      <p className="text-xs font-medium text-stone-700 mb-2">Active Projects</p>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-orange-200 rounded-full w-full" />
                        <div className="h-2 bg-amber-200 rounded-full w-3/4" />
                        <div className="h-2 bg-stone-200 rounded-full w-1/2" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/50">
                      <p className="text-xs font-medium text-stone-700 mb-2">Deal Pipeline</p>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-green-200 rounded-full w-4/5" />
                        <div className="h-2 bg-amber-200 rounded-full w-3/5" />
                        <div className="h-2 bg-orange-200 rounded-full w-2/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              How It{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-stone-700 max-w-2xl mx-auto">
              Get up and running in minutes, not days.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative p-6 rounded-2xl bg-white/70 border border-stone-200 backdrop-blur-sm"
              >
                <div className="text-5xl font-bold bg-gradient-to-br from-orange-300 to-amber-200 bg-clip-text text-transparent mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-stone-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-[100px] -translate-y-1/2" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Simple Pricing</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Start Free.{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Upgrade When Ready.
              </span>
            </h2>
            <p className="text-xl text-stone-700 max-w-2xl mx-auto">
              Get a 14-day free trial with full access. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pro Plan */}
            <div className="relative p-8 rounded-2xl bg-white border-2 border-primary shadow-xl shadow-orange-100/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-stone-900">Pro</h3>
              </div>
              <p className="text-stone-600 text-sm mb-6">For growing businesses</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-stone-900">$29</span>
                <span className="text-stone-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited Landing Pages",
                  "10,000 Contacts",
                  "100,000 Page Views/mo",
                  "Unlimited Vault Items",
                  "5 Team Members",
                  "Priority Support",
                  "Custom Domain",
                  "Advanced Analytics",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-stone-700">
                    <Check className="h-4 w-4 text-orange-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="w-full h-12 text-base bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25"
                asChild
              >
                <Link href="/signup">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Lifetime Plan */}
            <div className="relative p-8 rounded-2xl bg-white/70 border border-stone-200 hover:border-amber-300 transition-all backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h3 className="text-xl font-bold text-stone-900">Lifetime</h3>
              </div>
              <p className="text-stone-600 text-sm mb-6">Pay once, use forever</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-stone-900">$299</span>
                <span className="text-stone-500">/one-time</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Pro",
                  "Unlimited Team Members",
                  "Unlimited Everything",
                  "Priority Support Forever",
                  "All Future Updates",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-stone-700">
                    <Check className="h-4 w-4 text-amber-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 text-base !bg-white/70 border-stone-300 !text-stone-700 !hover:bg-white hover:text-stone-900 hover:border-amber-400"
                asChild
              >
                <Link href="/signup">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 mt-8">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Ready to Get Started CTA Section */}
      <section className="relative py-32">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-100/50 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-sm font-medium mb-8">
            <Rocket className="h-4 w-4" />
            <span>Start Building Today</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Get{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Started?
            </span>
          </h2>
          <p className="text-xl text-stone-700 mb-10 max-w-2xl mx-auto">
            Join thousands of founders who run their entire business from one dashboard.
            Get started in minutes and see the difference for yourself.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-105"
              asChild
            >
              <Link href="/signup">
                Sign Up Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg !bg-white/70 border-stone-300 !text-stone-700 !hover:bg-white hover:text-stone-900 hover:border-orange-400"
              asChild
            >
              <Link href="#products">
                Explore Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-12 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center">
                <FoundersHelmIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-stone-900">Founders Helm</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-stone-700">
              <Link href="#products" className="hover:text-stone-900 transition-colors">
                Products
              </Link>
              <Link href="#how-it-works" className="hover:text-stone-900 transition-colors">
                How It Works
              </Link>
              <Link href="/signup" className="hover:text-stone-900 transition-colors">
                Sign Up
              </Link>
              <Link href="/terms" className="hover:text-stone-900 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-stone-900 transition-colors">
                Privacy
              </Link>
            </div>
            <p className="text-sm text-stone-400 flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-orange-400" /> by founders, for founders
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
