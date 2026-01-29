"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import { landingPageSchema, type LandingPageInput } from "@/lib/validations/landing";
import { PAGE_TEMPLATES } from "@/types/landing";
import { slugify, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateLandingPageForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");

  const form = useForm<LandingPageInput>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      template: "blank",
    },
  });

  const watchTitle = form.watch("title");

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue("title", title);
    if (!form.getValues("slug") || form.getValues("slug") === slugify(watchTitle)) {
      form.setValue("slug", slugify(title));
    }
  };

  async function onSubmit(data: LandingPageInput) {
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Get user's workspace
      const { data: workspaceMember, error: workspaceError } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (workspaceError || !workspaceMember) {
        console.error("Workspace error:", workspaceError);
        toast.error("No workspace found. Please refresh and try again.");
        return;
      }

      const workspaceId = (workspaceMember as { workspace_id: string }).workspace_id;

      // Check if slug is already taken in this workspace
      const { data: existing } = await supabase
        .from("landing_pages")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("slug", data.slug)
        .single() as { data: { id: string } | null };

      if (existing) {
        form.setError("slug", { message: "This slug is already taken" });
        setIsLoading(false);
        return;
      }

      // Create page with template content
      const templateContent = getTemplateContent(selectedTemplate);

      const { data: newPage, error } = await (supabase
        .from("landing_pages")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          title: data.title,
          slug: data.slug,
          description: data.description || null,
          template: selectedTemplate,
          content: templateContent as unknown as Json,
          status: "draft",
        } as never)
        .select()
        .single() as unknown as Promise<{ data: { id: string } | null; error: { message: string; details?: string; hint?: string } | null }>);

      if (error) {
        console.error("Supabase error:", error.message, error.details, error.hint);
        throw new Error(error.message || "Database error");
      }

      toast.success("Landing page created!");
      router.push(`/landing/${newPage!.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create landing page";
      toast.error(message);
      console.error("Create page error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose a Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PAGE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSelectedTemplate(template.id);
                  form.setValue("template", template.id);
                }}
                className={cn(
                  "relative p-4 border rounded-lg text-left transition-all hover:border-primary",
                  selectedTemplate === template.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border"
                )}
              >
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className="h-20 bg-muted rounded-md mb-3 flex items-center justify-center text-muted-foreground text-xs">
                  Preview
                </div>
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Details */}
      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Product"
                        disabled={isLoading}
                        {...field}
                        onChange={handleTitleChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground shrink-0">
                        /p/
                      </span>
                      <FormControl>
                        <Input
                          placeholder="my-awesome-product"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      This will be your page&apos;s URL. Use lowercase letters, numbers, and hyphens.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of this landing page..."
                        className="min-h-[80px]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Page
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get template content
function getTemplateContent(template: string) {
  const defaultContent = { sections: [], theme: getDefaultTheme() };

  switch (template) {
    case "saas":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              headline: "Your SaaS Product Name",
              subheadline: "The perfect solution for your business needs. Save time, increase productivity, and grow faster.",
              primaryCta: {
                text: "Start Free Trial",
                url: "#pricing",
              },
              secondaryCta: {
                text: "Learn More",
                url: "#features",
              },
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 1,
            props: {
              headline: "Why Choose Us",
              subheadline: "Everything you need to succeed",
              features: [
                { icon: "Zap", title: "Lightning Fast", description: "Optimized for speed and performance" },
                { icon: "Shield", title: "Secure", description: "Enterprise-grade security built-in" },
                { icon: "BarChart", title: "Analytics", description: "Detailed insights and reports" },
              ],
            },
          },
          {
            id: "pricing-1",
            type: "pricing",
            order: 2,
            props: {
              headline: "Simple, Transparent Pricing",
              subheadline: "Choose the plan that's right for you",
              plans: [
                {
                  name: "Starter",
                  price: "$XX",
                  period: "/month",
                  description: "Perfect for getting started",
                  features: ["Your feature here", "Another feature", "One more feature"],
                  cta: { text: "Get Started", url: "#" }
                },
                {
                  name: "Pro",
                  price: "$XX",
                  period: "/month",
                  description: "For growing businesses",
                  features: ["Everything in Starter", "Premium feature", "Advanced feature", "Priority Support"],
                  cta: { text: "Start Trial", url: "#" },
                  highlighted: true
                },
              ],
            },
          },
          {
            id: "cta-1",
            type: "cta",
            order: 3,
            props: {
              headline: "Ready to Get Started?",
              subheadline: "Join thousands of satisfied customers today.",
              primaryCta: {
                text: "Start Your Free Trial",
                url: "#capture",
              },
            },
          },
        ],
      };

    case "waitlist":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              badge: "Coming Soon",
              headline: "Something Amazing is Coming",
              subheadline: "Be the first to know when we launch. Join our exclusive waitlist.",
              primaryCta: {
                text: "Join Waitlist",
                url: "#capture",
              },
            },
          },
          {
            id: "newsletter-1",
            type: "newsletter",
            order: 1,
            props: {
              headline: "Join the Waitlist",
              subheadline: "Get early access and exclusive updates.",
              buttonText: "Join Waitlist",
              placeholder: "Enter your email",
            },
          },
        ],
      };

    case "ebook":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              headline: "Download Your Free eBook",
              subheadline: "Learn the proven strategies that top performers use to 10x their results. Get your free copy now.",
              primaryCta: {
                text: "Download Now",
                url: "#capture",
              },
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 1,
            props: {
              headline: "What's Inside",
              subheadline: "Packed with actionable insights",
              features: [
                { icon: "BookOpen", title: "10 Chapters", description: "Comprehensive guide covering everything you need" },
                { icon: "Target", title: "Action Steps", description: "Practical exercises at the end of each chapter" },
                { icon: "TrendingUp", title: "Case Studies", description: "Real-world examples and success stories" },
              ],
            },
          },
          {
            id: "cta-1",
            type: "cta",
            order: 2,
            props: {
              headline: "Get Your Free Copy",
              subheadline: "Join readers who have already downloaded this guide.",
              primaryCta: {
                text: "Download Now",
                url: "#capture",
              },
            },
          },
          {
            id: "newsletter-1",
            type: "newsletter",
            order: 3,
            props: {
              headline: "Get the eBook",
              subheadline: "Enter your email and we'll send it straight to your inbox.",
              buttonText: "Send Me the eBook",
              placeholder: "Enter your email",
            },
          },
        ],
      };

    case "webinar":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              badge: "Live Event",
              headline: "Free Webinar: Master Your Craft",
              subheadline: "Join us for a live, interactive session where you'll learn actionable strategies from industry experts. Reserve your spot today.",
              primaryCta: {
                text: "Register Now",
                url: "#capture",
              },
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 1,
            props: {
              headline: "What You'll Learn",
              subheadline: "Key takeaways from this session",
              features: [
                { icon: "Lightbulb", title: "Proven Framework", description: "A step-by-step system you can implement immediately" },
                { icon: "Users", title: "Live Q&A", description: "Get your questions answered in real time" },
                { icon: "Gift", title: "Bonus Resources", description: "Exclusive templates and worksheets for attendees" },
              ],
            },
          },
          {
            id: "stats-1",
            type: "stats",
            order: 2,
            props: {
              stats: [
                { value: "X+", label: "Years Experience" },
                { value: "XX+", label: "Students Taught" },
                { value: "X.X/5", label: "Average Rating" },
              ],
            },
          },
          {
            id: "cta-1",
            type: "cta",
            order: 3,
            props: {
              headline: "Seats Are Limited",
              subheadline: "Register now to secure your spot in this free live event.",
              primaryCta: {
                text: "Reserve My Seat",
                url: "#capture",
              },
            },
          },
          {
            id: "newsletter-1",
            type: "newsletter",
            order: 4,
            props: {
              headline: "Register for the Webinar",
              subheadline: "Enter your email to save your seat.",
              buttonText: "Register Now",
              placeholder: "Enter your email",
            },
          },
        ],
      };

    case "portfolio":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              headline: "Hi, I'm [Your Name]",
              subheadline: "Designer, developer, and creative problem solver. I help brands stand out with thoughtful, impactful work.",
              primaryCta: {
                text: "View My Work",
                url: "#features",
              },
              secondaryCta: {
                text: "Get in Touch",
                url: "#contact",
              },
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 1,
            props: {
              headline: "Services",
              subheadline: "What I can do for you",
              features: [
                { icon: "Palette", title: "Brand Design", description: "Logos, identity systems, and visual guidelines" },
                { icon: "Monitor", title: "Web Development", description: "Responsive, fast, and accessible websites" },
                { icon: "Megaphone", title: "Strategy", description: "Marketing and growth consulting" },
              ],
            },
          },
          {
            id: "stats-1",
            type: "stats",
            order: 2,
            props: {
              stats: [
                { value: "X+", label: "Years Experience" },
                { value: "XX+", label: "Projects Completed" },
                { value: "XX+", label: "Happy Clients" },
              ],
            },
          },
          {
            id: "cta-1",
            type: "cta",
            order: 3,
            props: {
              headline: "Let's Work Together",
              subheadline: "Have a project in mind? I'd love to hear about it.",
              primaryCta: {
                text: "Hire Me",
                url: "#contact",
              },
            },
          },
          {
            id: "contact-1",
            type: "contact",
            order: 4,
            props: {
              headline: "Get in Touch",
              fields: ["name", "email", "message"],
              submitText: "Send Message",
            },
          },
        ],
      };

    case "agency":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              headline: "We Build Brands That Scale",
              subheadline: "A full-service digital agency helping startups and growing businesses achieve measurable results.",
              primaryCta: {
                text: "See Our Work",
                url: "#features",
              },
              secondaryCta: {
                text: "Get a Quote",
                url: "#contact",
              },
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 1,
            props: {
              headline: "Our Services",
              subheadline: "End-to-end solutions for your business",
              features: [
                { icon: "Palette", title: "Branding & Design", description: "Visual identity that resonates with your audience" },
                { icon: "Code", title: "Web Development", description: "Fast, modern websites and web applications" },
                { icon: "TrendingUp", title: "Growth Marketing", description: "Data-driven strategies to scale your business" },
              ],
            },
          },
          {
            id: "testimonials-1",
            type: "testimonials",
            order: 2,
            props: {
              headline: "What Our Clients Say",
              testimonials: [
                { quote: "Add your client testimonial here.", author: { name: "Client Name", title: "Title", company: "Company", avatar: "" } },
                { quote: "Add another client testimonial here.", author: { name: "Client Name", title: "Title", company: "Company", avatar: "" } },
              ],
            },
          },
          {
            id: "pricing-1",
            type: "pricing",
            order: 3,
            props: {
              headline: "Engagement Models",
              subheadline: "Flexible options to fit your needs",
              plans: [
                {
                  name: "Project",
                  price: "$XXX",
                  period: "+",
                  description: "One-time projects with defined scope",
                  features: ["Your service here", "Another service", "Support included"],
                  cta: { text: "Get a Quote", url: "#contact" },
                },
                {
                  name: "Retainer",
                  price: "$XXX",
                  period: "/month",
                  description: "Ongoing partnership for continuous growth",
                  features: ["Dedicated support", "Monthly deliverables", "Priority access", "Regular reports"],
                  cta: { text: "Let's Talk", url: "#contact" },
                  highlighted: true,
                },
              ],
            },
          },
          {
            id: "cta-1",
            type: "cta",
            order: 4,
            props: {
              headline: "Ready to Grow?",
              subheadline: "Let's discuss how we can help your business reach its full potential.",
              primaryCta: {
                text: "Start a Project",
                url: "#contact",
              },
            },
          },
        ],
      };

    case "mobile-app":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              headline: "Your Life, Simplified",
              subheadline: "The all-in-one app that helps you stay organized, focused, and productive. Available on iOS and Android.",
              primaryCta: {
                text: "Download Free",
                url: "#cta",
              },
              secondaryCta: {
                text: "See Features",
                url: "#features",
              },
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 1,
            props: {
              headline: "Powerful Features",
              subheadline: "Everything you need in your pocket",
              features: [
                { icon: "Smartphone", title: "Intuitive Design", description: "Beautiful interface that's easy to navigate" },
                { icon: "Cloud", title: "Cloud Sync", description: "Access your data anywhere, on any device" },
                { icon: "Bell", title: "Smart Reminders", description: "Never miss what matters most" },
              ],
            },
          },
          {
            id: "stats-1",
            type: "stats",
            order: 2,
            props: {
              stats: [
                { value: "500K+", label: "Downloads" },
                { value: "4.8", label: "App Store Rating" },
                { value: "99.9%", label: "Uptime" },
              ],
            },
          },
          {
            id: "testimonials-1",
            type: "testimonials",
            order: 3,
            props: {
              headline: "Loved by Users",
              testimonials: [
                { quote: "This app completely changed how I manage my day. Can't live without it!", author: { name: "Alex Rivera", title: "Product Designer", company: "", avatar: "" } },
                { quote: "Simple, fast, and reliable. Exactly what I was looking for.", author: { name: "Jamie Lee", title: "Freelancer", company: "", avatar: "" } },
              ],
            },
          },
          {
            id: "cta-1",
            type: "cta",
            order: 4,
            props: {
              headline: "Download the App",
              subheadline: "Free to get started. Available on iOS and Android.",
              primaryCta: {
                text: "Download Now",
                url: "#",
              },
            },
          },
        ],
      };

    case "newsletter":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              headline: "Stay Ahead of the Curve",
              subheadline: "Join 10,000+ professionals who get actionable insights delivered to their inbox every week.",
              primaryCta: {
                text: "Subscribe Free",
                url: "#capture",
              },
            },
          },
          {
            id: "newsletter-1",
            type: "newsletter",
            order: 1,
            props: {
              headline: "Subscribe Now",
              subheadline: "No spam, unsubscribe anytime. Just great content.",
              buttonText: "Subscribe",
              placeholder: "Enter your email",
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 2,
            props: {
              headline: "What You'll Get",
              subheadline: "Every issue is packed with value",
              features: [
                { icon: "TrendingUp", title: "Industry Insights", description: "Curated trends and analysis you won't find elsewhere" },
                { icon: "Wrench", title: "Tools & Resources", description: "Handpicked tools, templates, and tutorials" },
                { icon: "Users", title: "Community Access", description: "Connect with like-minded professionals" },
              ],
            },
          },
          {
            id: "testimonials-1",
            type: "testimonials",
            order: 3,
            props: {
              headline: "What Readers Say",
              testimonials: [
                { quote: "The one newsletter I actually read every week. Always actionable.", author: { name: "Chris Patel", title: "Marketing Lead", company: "", avatar: "" } },
                { quote: "Concise, insightful, and worth every minute. Highly recommend.", author: { name: "Dana Kim", title: "Startup Founder", company: "", avatar: "" } },
              ],
            },
          },
        ],
      };

    case "consulting":
      return {
        ...defaultContent,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            order: 0,
            props: {
              headline: "Grow Your Business with Expert Guidance",
              subheadline: "I help founders and teams unlock their potential through strategic consulting and hands-on coaching.",
              primaryCta: {
                text: "Book a Free Call",
                url: "#contact",
              },
              secondaryCta: {
                text: "See Services",
                url: "#features",
              },
            },
          },
          {
            id: "features-1",
            type: "features",
            order: 1,
            props: {
              headline: "How I Can Help",
              subheadline: "Tailored services for your stage of growth",
              features: [
                { icon: "Target", title: "Strategy Sessions", description: "Clarify your vision and build a roadmap to get there" },
                { icon: "Users", title: "Team Coaching", description: "Level up your leadership and team performance" },
                { icon: "BarChart", title: "Growth Audits", description: "Identify bottlenecks and unlock new opportunities" },
              ],
            },
          },
          {
            id: "testimonials-1",
            type: "testimonials",
            order: 2,
            props: {
              headline: "Client Results",
              testimonials: [
                { quote: "After just 3 sessions, we had a clear plan and doubled our revenue in 6 months.", author: { name: "Rachel Torres", title: "CEO", company: "BrightPath", avatar: "" } },
                { quote: "The best investment I've made in my business. Practical, no-fluff advice.", author: { name: "David Osei", title: "Founder", company: "LaunchPad", avatar: "" } },
              ],
            },
          },
          {
            id: "stats-1",
            type: "stats",
            order: 3,
            props: {
              stats: [
                { value: "200+", label: "Clients Coached" },
                { value: "15+", label: "Years Experience" },
                { value: "95%", label: "Client Satisfaction" },
              ],
            },
          },
          {
            id: "cta-1",
            type: "cta",
            order: 4,
            props: {
              headline: "Let's Talk",
              subheadline: "Book a free 30-minute discovery call and let's see how I can help.",
              primaryCta: {
                text: "Book a Call",
                url: "#contact",
              },
            },
          },
          {
            id: "contact-1",
            type: "contact",
            order: 5,
            props: {
              headline: "Get in Touch",
              fields: ["name", "email", "message"],
              submitText: "Send Message",
            },
          },
        ],
      };

    default:
      return defaultContent;
  }
}

function getDefaultTheme() {
  return {
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    fontFamily: "Inter",
    borderRadius: "0.5rem",
  };
}
