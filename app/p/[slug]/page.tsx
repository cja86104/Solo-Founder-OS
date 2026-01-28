import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SectionRenderer } from '@/components/landing/sections'
import { LeadCaptureProvider } from '@/components/landing/lead-capture-provider'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface LandingPageRow {
  id: string
  title: string
  slug: string
  description: string | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  content: unknown
  custom_css: string | null
  custom_js: string | null
  status: string | null
  [key: string]: unknown
}

async function getLandingPage(slug: string): Promise<LandingPageRow | null> {
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single() as { data: LandingPageRow | null; error: unknown }

  if (error || !page) {
    return null
  }

  // Track page view
  await supabase.from('landing_page_analytics').insert({
    page_id: page.id,
    event_type: 'page_view',
    event_data: {
      timestamp: new Date().toISOString(),
    },
  } as never)

  return page
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getLandingPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.description || `${page.title} - Built with Solo Founder OS`,
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || page.description || undefined,
      images: page.og_image ? [page.og_image] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.meta_title || page.title,
      description: page.meta_description || page.description || undefined,
    },
  }
}

export default async function PublicLandingPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getLandingPage(slug)

  if (!page) {
    notFound()
  }

  // Get content from the content column (where editor saves it)
  const content = (page.content as unknown as PageContent) || { sections: [], theme: {} }
  const sections = content.sections || []
  const theme = content.theme || {}
  const themeMode = theme.backgroundColor === '#ffffff' ? 'light' : 'dark'

  return (
    <LeadCaptureProvider pageId={page.id}>
      <div
        className={`min-h-screen ${getThemeClasses(themeMode)}`}
        style={{
          '--primary-color': theme.primaryColor || '#6366f1',
          '--secondary-color': theme.secondaryColor || '#8b5cf6',
          fontFamily: theme.fontFamily || 'Inter, sans-serif',
        } as React.CSSProperties}
        data-page-id={page.id}
      >
        {sections.map((section, index) => (
          <SectionRenderer
            key={section.id || index}
            section={{
              id: section.id,
              type: section.type,
              content: section.props || {}, // Map "props" to "content" for renderer
              settings: {},
            }}
            theme={themeMode}
            pageId={page.id}
          />
        ))}

        {sections.length === 0 && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">{page.title}</h1>
              <p className="text-muted-foreground">This page is under construction.</p>
            </div>
          </div>
        )}

        {/* Custom CSS */}
        {page.custom_css && (
          <style dangerouslySetInnerHTML={{ __html: page.custom_css }} />
        )}
      </div>
    </LeadCaptureProvider>
  )
}

function getThemeClasses(theme: string): string {
  switch (theme) {
    case 'light':
      return 'bg-white text-slate-900'
    case 'gradient':
      return 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'
    case 'dark':
    default:
      return 'bg-slate-900 text-white'
  }
}

interface PageSection {
  id: string
  type: string
  order: number
  props: Record<string, unknown>
}

interface PageTheme {
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
  borderRadius?: string
}

interface PageContent {
  sections: PageSection[]
  theme?: PageTheme
}
