'use client'

import { BaseSectionProps, getSectionPadding } from './index'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useLeadCapture } from '@/components/landing/lead-capture-provider'
import { cn } from '@/lib/utils'

interface CtaContent {
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
  showEmailCapture?: boolean
  badge?: string
}

export function CtaSection({ content, settings, theme }: BaseSectionProps) {
  const ctaContent = content as CtaContent
  const paddingClass = getSectionPadding(settings)
  const { openCapture } = useLeadCapture()
  const style = (settings.style as string) || 'gradient'

  const handleCtaClick = (url: string) => {
    if (url === '#capture' || ctaContent.showEmailCapture) {
      openCapture()
      return
    }
    window.location.href = url
  }

  return (
    <section className={`${paddingClass}`}>
      <div className="container mx-auto px-4">
        {style === 'gradient' && (
          <GradientCta
            content={ctaContent}
            onCtaClick={handleCtaClick}
          />
        )}

        {style === 'simple' && (
          <SimpleCta
            content={ctaContent}
            theme={theme}
            onCtaClick={handleCtaClick}
          />
        )}

        {style === 'bordered' && (
          <BorderedCta
            content={ctaContent}
            theme={theme}
            onCtaClick={handleCtaClick}
          />
        )}

        {style === 'split' && (
          <SplitCta
            content={ctaContent}
            theme={theme}
            onCtaClick={handleCtaClick}
          />
        )}
      </div>
    </section>
  )
}

function GradientCta({
  content,
  onCtaClick,
}: {
  content: CtaContent
  onCtaClick: (url: string) => void
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-rose-500 to-purple-500 p-12 md:p-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {content.badge && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {content.badge}
          </div>
        )}

        {content.headline && (
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {content.headline}
          </h2>
        )}

        {content.subheadline && (
          <p className="text-xl text-white/90 mb-4">
            {content.subheadline}
          </p>
        )}

        {content.description && (
          <p className="text-lg text-white/80 mb-8">
            {content.description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {content.primaryCta && (
            <Button
              size="lg"
              onClick={() => onCtaClick(content.primaryCta!.url)}
              className="bg-white text-slate-900 hover:bg-slate-100 px-8"
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
              className="border-white/30 text-white hover:bg-white/10"
            >
              {content.secondaryCta.text}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function SimpleCta({
  content,
  theme,
  onCtaClick,
}: {
  content: CtaContent
  theme: string
  onCtaClick: (url: string) => void
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <div className="text-center max-w-3xl mx-auto">
      {content.headline && (
        <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
          {content.headline}
        </h2>
      )}

      {content.description && (
        <p className={`text-lg ${mutedColor} mb-8`}>
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
          >
            {content.secondaryCta.text}
          </Button>
        )}
      </div>
    </div>
  )
}

function BorderedCta({
  content,
  theme,
  onCtaClick,
}: {
  content: CtaContent
  theme: string
  onCtaClick: (url: string) => void
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'
  const borderColor = theme === 'light' ? 'border-slate-200' : 'border-slate-700'
  const bgColor = theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'

  return (
    <div className={cn(
      'rounded-2xl border-2 p-12 text-center',
      borderColor,
      bgColor
    )}>
      {content.headline && (
        <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
          {content.headline}
        </h2>
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
          >
            {content.secondaryCta.text}
          </Button>
        )}
      </div>
    </div>
  )
}

function SplitCta({
  content,
  theme,
  onCtaClick,
}: {
  content: CtaContent
  theme: string
  onCtaClick: (url: string) => void
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="text-center md:text-left max-w-xl">
        {content.headline && (
          <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
            {content.headline}
          </h2>
        )}

        {content.description && (
          <p className={`text-lg ${mutedColor}`}>
            {content.description}
          </p>
        )}
      </div>

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
          >
            {content.secondaryCta.text}
          </Button>
        )}
      </div>
    </div>
  )
}
