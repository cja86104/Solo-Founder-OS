'use client'

import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { PricingSection } from './pricing-section'
import { TestimonialsSection } from './testimonials-section'
import { FaqSection } from './faq-section'
import { CtaSection } from './cta-section'
import { NewsletterSection } from './newsletter-section'
import { LogosSection } from './logos-section'
import { StatsSection } from './stats-section'
import { ContactSection } from './contact-section'

export interface SectionData {
  id: string
  type: string
  content: Record<string, unknown>
  settings?: Record<string, unknown>
}

interface SectionRendererProps {
  section: SectionData
  theme: string
  pageId: string
}

export function SectionRenderer({ section, theme, pageId }: SectionRendererProps) {
  const commonProps = {
    content: section.content,
    settings: section.settings || {},
    theme,
    pageId,
    sectionId: section.id,
  }

  switch (section.type) {
    case 'hero':
      return <HeroSection {...commonProps} />
    case 'features':
      return <FeaturesSection {...commonProps} />
    case 'pricing':
      return <PricingSection {...commonProps} />
    case 'testimonials':
      return <TestimonialsSection {...commonProps} />
    case 'faq':
      return <FaqSection {...commonProps} />
    case 'cta':
      return <CtaSection {...commonProps} />
    case 'newsletter':
      return <NewsletterSection {...commonProps} />
    case 'logos':
      return <LogosSection {...commonProps} />
    case 'stats':
      return <StatsSection {...commonProps} />
    case 'contact':
      return <ContactSection {...commonProps} />
    default:
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="py-12 px-4 text-center border border-dashed border-yellow-500/50 bg-yellow-500/10">
            <p className="text-yellow-500">Unknown section type: {section.type}</p>
          </div>
        )
      }
      return null
  }
}

export interface BaseSectionProps {
  content: Record<string, unknown>
  settings: Record<string, unknown>
  theme: string
  pageId: string
  sectionId: string
}

export function getSectionBackground(theme: string, settings: Record<string, unknown>): string {
  const customBg = settings.backgroundColor as string | undefined
  if (customBg) return customBg

  switch (theme) {
    case 'light':
      return 'bg-white'
    case 'gradient':
      return 'bg-transparent'
    case 'dark':
    default:
      return 'bg-slate-900'
  }
}

export function getSectionPadding(settings: Record<string, unknown>): string {
  const padding = settings.padding as string | undefined
  switch (padding) {
    case 'none':
      return 'py-0'
    case 'small':
      return 'py-8 md:py-12'
    case 'large':
      return 'py-20 md:py-32'
    default:
      return 'py-12 md:py-20'
  }
}

export { HeroSection } from './hero-section'
export { FeaturesSection } from './features-section'
export { PricingSection } from './pricing-section'
export { TestimonialsSection } from './testimonials-section'
export { FaqSection } from './faq-section'
export { CtaSection } from './cta-section'
export { NewsletterSection } from './newsletter-section'
export { LogosSection } from './logos-section'
export { StatsSection } from './stats-section'
export { ContactSection } from './contact-section'
