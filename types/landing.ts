// Landing page types

export type PageStatus = "draft" | "published" | "archived";

export interface LandingPage {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: PageStatus | null;
  template: string | null;
  content: PageContent | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  favicon: string | null;
  custom_domain: string | null;
  custom_css: string | null;
  custom_js: string | null;
  password: string | null;
  view_count: number | null;
  conversion_count: number | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  workspace_id?: string;
}

export interface PageContent {
  sections: PageSection[];
  theme?: PageTheme;
}

export interface PageTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface PageSection {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
  order: number;
}

export type SectionType =
  | "hero"
  | "features"
  | "pricing"
  | "testimonials"
  | "cta"
  | "faq"
  | "contact"
  | "newsletter"
  | "stats"
  | "team"
  | "logos"
  | "content"
  | "gallery"
  | "video"
  | "custom";

export interface LandingPageLead {
  id: string;
  page_id: string;
  email: string;
  name: string | null;
  data: Record<string, unknown>;
  source: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LandingPageAnalytics {
  id: string;
  page_id: string;
  event_type: "view" | "click" | "scroll" | "conversion";
  event_data: Record<string, unknown>;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  session_id: string | null;
  created_at: string;
}

// Form inputs
export interface CreateLandingPageInput {
  title: string;
  slug: string;
  description?: string;
  template?: string;
}

export interface UpdateLandingPageInput {
  title?: string;
  slug?: string;
  description?: string;
  status?: PageStatus;
  content?: PageContent;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  custom_css?: string;
  custom_js?: string;
  password?: string;
}

// Templates
export const PAGE_TEMPLATES = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    thumbnail: "/templates/blank.png",
  },
  {
    id: "saas",
    name: "SaaS Product",
    description: "Perfect for software products",
    thumbnail: "/templates/saas.png",
  },
  {
    id: "waitlist",
    name: "Waitlist",
    description: "Collect emails before launch",
    thumbnail: "/templates/waitlist.png",
  },
  {
    id: "ebook",
    name: "eBook / Lead Magnet",
    description: "Promote downloadable content",
    thumbnail: "/templates/ebook.png",
  },
  {
    id: "webinar",
    name: "Webinar / Event",
    description: "Event registration page",
    thumbnail: "/templates/webinar.png",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Showcase your work",
    thumbnail: "/templates/portfolio.png",
  },
  {
    id: "agency",
    name: "Agency / Freelancer",
    description: "Showcase services and client work",
    thumbnail: "/templates/agency.png",
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "Promote your app with download CTAs",
    thumbnail: "/templates/mobile-app.png",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Grow your email subscriber list",
    thumbnail: "/templates/newsletter.png",
  },
  {
    id: "consulting",
    name: "Consulting / Coaching",
    description: "Personal brand with booking CTA",
    thumbnail: "/templates/consulting.png",
  },
] as const;

// Section templates
export const SECTION_TEMPLATES: Record<SectionType, { name: string; icon: string; defaultProps: Record<string, unknown> }> = {
  hero: {
    name: "Hero Section",
    icon: "Sparkles",
    defaultProps: {
      headline: "Your Amazing Product",
      subheadline: "The best solution for your needs",
      ctaText: "Get Started",
      ctaLink: "#",
      image: "",
      alignment: "center",
    },
  },
  features: {
    name: "Features",
    icon: "Grid3X3",
    defaultProps: {
      headline: "Why Choose Us",
      features: [
        { icon: "Zap", title: "Feature One", description: "Describe your first key feature" },
        { icon: "Shield", title: "Feature Two", description: "Describe your second key feature" },
        { icon: "Heart", title: "Feature Three", description: "Describe your third key feature" },
      ],
      columns: 3,
    },
  },
  pricing: {
    name: "Pricing",
    icon: "DollarSign",
    defaultProps: {
      headline: "Simple Pricing",
      plans: [
        { name: "Starter", price: "$0", features: ["Add your features here"], ctaText: "Get Started" },
        { name: "Pro", price: "$XX", features: ["Everything in Starter", "Add more features"], ctaText: "Go Pro", highlighted: true },
      ],
    },
  },
  testimonials: {
    name: "Testimonials",
    icon: "Quote",
    defaultProps: {
      headline: "What Our Customers Say",
      testimonials: [
        { quote: "Add a customer testimonial here", author: { name: "Customer Name", title: "Title", company: "Company", avatar: "" } },
      ],
    },
  },
  cta: {
    name: "Call to Action",
    icon: "MousePointerClick",
    defaultProps: {
      headline: "Ready to Get Started?",
      description: "Join thousands of happy customers today.",
      ctaText: "Start Now",
      ctaLink: "#",
    },
  },
  faq: {
    name: "FAQ",
    icon: "HelpCircle",
    defaultProps: {
      headline: "Frequently Asked Questions",
      items: [
        { question: "Your question here?", answer: "Your answer here." },
      ],
    },
  },
  contact: {
    name: "Contact Form",
    icon: "Mail",
    defaultProps: {
      headline: "Get in Touch",
      fields: ["name", "email", "message"],
      submitText: "Send Message",
    },
  },
  newsletter: {
    name: "Newsletter",
    icon: "Send",
    defaultProps: {
      headline: "Stay Updated",
      description: "Get the latest news and updates.",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
    },
  },
  stats: {
    name: "Stats",
    icon: "BarChart",
    defaultProps: {
      stats: [
        { value: "XX+", label: "Customers" },
        { value: "XX%", label: "Satisfaction" },
        { value: "XX", label: "Your Metric" },
      ],
    },
  },
  team: {
    name: "Team",
    icon: "Users",
    defaultProps: {
      headline: "Meet Our Team",
      members: [
        { name: "Team Member", role: "Role", image: "", social: {} },
      ],
    },
  },
  logos: {
    name: "Logo Cloud",
    icon: "Building",
    defaultProps: {
      headline: "Trusted By",
      logos: [],
    },
  },
  content: {
    name: "Rich Content",
    icon: "FileText",
    defaultProps: {
      content: "<p>Your content here...</p>",
    },
  },
  gallery: {
    name: "Image Gallery",
    icon: "Image",
    defaultProps: {
      images: [],
      columns: 3,
    },
  },
  video: {
    name: "Video",
    icon: "Play",
    defaultProps: {
      videoUrl: "",
      autoplay: false,
    },
  },
  custom: {
    name: "Custom HTML",
    icon: "Code",
    defaultProps: {
      html: "",
    },
  },
};
