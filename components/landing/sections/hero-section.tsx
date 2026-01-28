'use client'

import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import { useLeadCapture } from '@/components/landing/lead-capture-provider'

interface HeroContent {
  headline?: string
  subheadline?: string
  description?: string
  primaryCta?: {
    text: string
    url: string
  }
  secondaryCta?: {
    text: string
    url: string
  }
  image?: {
    url: string
    alt: string
  }
  video?: {
    url: string
    thumbnail?: string
  }
  badge?: string
  showEmailCapture?: boolean
}

export function HeroSection({ content, settings, theme, pageId }: BaseSectionProps) {
  const heroContent = content as HeroContent
  const { openCapture } = useLeadCapture()
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'centered'

  const handleCtaClick = (url: string) => {
    if (url === '#capture' || heroContent.showEmailCapture) {
      openCapture()
      return
    }
    window.location.href = url
  }

  return (
    <section className={`${bgClass} ${paddingClass} relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {layout === 'centered' ? (
          <CenteredLayout
            content={heroContent}
            theme={theme}
            onCtaClick={handleCtaClick}
          />
        ) : (
          <SplitLayout
            content={heroContent}
            theme={theme}
            onCtaClick={handleCtaClick}
          />
        )}
      </div>
    </section>
  )
}

function CenteredLayout({
  content,
  theme,
  onCtaClick,
}: {
  content: HeroContent
  theme: string
  onCtaClick: (url: string) => void
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-300'

  return (
    <div className="max-w-4xl mx-auto text-center">
      {content.badge && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-medium mb-6">
          {content.badge}
        </div>
      )}

      {content.headline && (
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${textColor} mb-6 leading-tight`}>
          {content.headline}
        </h1>
      )}

      {content.subheadline && (
        <p className={`text-xl md:text-2xl ${mutedColor} mb-4`}>
          {content.subheadline}
        </p>
      )}

      {content.description && (
        <p className={`text-lg ${mutedColor} mb-8 max-w-2xl mx-auto`}>
          {content.description}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {content.primaryCta && (
          <Button
            size="lg"
            onClick={() => onCtaClick(content.primaryCta!.url)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
          >
            {content.primaryCta.text}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {content.secondaryCta && (
          <Button
            size="lg"
            variant="outline"
            onClick={() => onCtaClick(content.secondaryCta!.url)}
            className={theme === 'light' ? 'border-slate-300' : 'border-slate-600'}
          >
            {content.video ? <Play className="mr-2 h-4 w-4" /> : null}
            {content.secondaryCta.text}
          </Button>
        )}
      </div>

      {content.image && (
        <div className="mt-12 rounded-xl overflow-hidden shadow-2xl">
          <img
            src={content.image.url}
            alt={content.image.alt || 'Hero image'}
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  )
}

function SplitLayout({
  content,
  theme,
  onCtaClick,
}: {
  content: HeroContent
  theme: string
  onCtaClick: (url: string) => void
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-300'

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        {content.badge && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-medium mb-6">
            {content.badge}
          </div>
        )}

        {content.headline && (
          <h1 className={`text-4xl md:text-5xl font-bold ${textColor} mb-6 leading-tight`}>
            {content.headline}
          </h1>
        )}

        {content.subheadline && (
          <p className={`text-xl ${mutedColor} mb-4`}>
            {content.subheadline}
          </p>
        )}

        {content.description && (
          <p className={`text-lg ${mutedColor} mb-8`}>
            {content.description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {content.primaryCta && (
            <Button
              size="lg"
              onClick={() => onCtaClick(content.primaryCta!.url)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            >
              {content.primaryCta.text}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {content.secondaryCta && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => onCtaClick(content.secondaryCta!.url)}
              className={theme === 'light' ? 'border-slate-300' : 'border-slate-600'}
            >
              {content.secondaryCta.text}
            </Button>
          )}
        </div>
      </div>

      <div>
        {content.image && (
          <div className="rounded-xl overflow-hidden shadow-2xl">
            <img
              src={content.image.url}
              alt={content.image.alt || 'Hero image'}
              className="w-full h-auto"
            />
          </div>
        )}
      </div>
    </div>
  )
}
