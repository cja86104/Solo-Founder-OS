import Link from "next/link";
import {
  Zap,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/marketing-nav";

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
    name: "Analytics",
    description: "Privacy-first analytics for your websites and apps",
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
  "Built for solo founders & indie hackers",
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
    description: "Build automations, track analytics, and let the AI Advisor guide your growth.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Navigation */}
      <MarketingNav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Sunset Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-orange-600/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-red-600/20 rounded-full blur-[120px] animate-pulse delay-500" />

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Dark gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span>Built for Solo Founders</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6">
            <span className="text-white">Your Entire Business.</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              One Dashboard.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10">
            Stop juggling 10 different tools. Solo Founder OS combines everything you need
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
              className="h-14 px-8 text-lg border-zinc-700 text-zinc-300 hover:bg-white/5 hover:text-white hover:border-orange-500/50"
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-400"
              >
                <Check className="h-3.5 w-3.5 text-orange-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-orange-400 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                10 Products.
              </span>{" "}
              One Platform.
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Everything you need to run your solo business, seamlessly integrated in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.name}
                className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <product.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-zinc-400">{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Built Different.
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Our Story.
                </span>
              </h2>
              <p className="text-xl text-zinc-400 mb-8">
                We&apos;re solo founders ourselves. We know the pain of managing a dozen
                subscriptions just to run a simple business. So we built this to give solo founders an unfair advantage.
              </p>
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dashboard Preview Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-2xl opacity-20" />
              <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                {/* Mock browser header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border-b border-zinc-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 bg-zinc-700 rounded-md max-w-xs" />
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20" />
                    <div className="h-24 rounded-xl bg-zinc-800" />
                    <div className="h-24 rounded-xl bg-zinc-800" />
                  </div>
                  <div className="h-40 rounded-xl bg-zinc-800" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 rounded-xl bg-zinc-800" />
                    <div className="h-20 rounded-xl bg-zinc-800" />
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
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Get up and running in minutes, not days.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
              >
                <div className="text-5xl font-bold bg-gradient-to-br from-orange-500/20 to-amber-500/20 bg-clip-text text-transparent mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Get Started CTA Section */}
      <section className="relative py-32">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8">
            <Rocket className="h-4 w-4" />
            <span>Start Building Today</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Get{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Started?
            </span>
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Join thousands of solo founders who run their entire business from one dashboard.
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
              className="h-14 px-8 text-lg border-zinc-700 text-zinc-300 hover:bg-white/5 hover:text-white hover:border-orange-500/50"
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
      <footer className="border-t border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">Solo Founder OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="#products" className="hover:text-white transition-colors">
                Products
              </Link>
              <Link href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-orange-400" /> by solo founders
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
