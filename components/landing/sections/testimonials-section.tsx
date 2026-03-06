'use client'

import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { Star, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Testimonial {
  quote: string
  author: {
    name: string
    title?: string
    company?: string
    avatar?: string
  }
  rating?: number
  featured?: boolean
}

interface TestimonialsContent {
  headline?: string
  subheadline?: string
  description?: string
  testimonials: Testimonial[]
}

// Normalize testimonials that may have a flat author string instead of an object
function normalizeTestimonial(t: Record<string, unknown>): Testimonial {
  if (typeof t.author === 'string') {
    return {
      ...t,
      author: {
        name: t.author as string,
        title: (t.role as string) || '',
        company: '',
        avatar: (t.avatar as string) || '',
      },
    } as Testimonial
  }
  return t as unknown as Testimonial
}

export function TestimonialsSection({ content, settings, theme }: BaseSectionProps) {
  const raw = content as unknown as { headline?: string; subheadline?: string; description?: string; testimonials: Record<string, unknown>[] }
  const testimonialsContent: TestimonialsContent = {
    ...raw,
    testimonials: raw.testimonials?.map(normalizeTestimonial) ?? [],
  }
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'grid'

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {(testimonialsContent.headline || testimonialsContent.subheadline) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {testimonialsContent.subheadline && (
              <p className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
                {testimonialsContent.subheadline}
              </p>
            )}
            {testimonialsContent.headline && (
              <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
                {testimonialsContent.headline}
              </h2>
            )}
            {testimonialsContent.description && (
              <p className={`text-lg ${mutedColor}`}>
                {testimonialsContent.description}
              </p>
            )}
          </div>
        )}

        {layout === 'grid' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonialsContent.testimonials?.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                testimonial={testimonial}
                theme={theme}
              />
            ))}
          </div>
        )}

        {layout === 'carousel' && (
          <div className="max-w-4xl mx-auto">
            <TestimonialCarousel
              testimonials={testimonialsContent.testimonials}
              theme={theme}
            />
          </div>
        )}

        {layout === 'masonry' && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {testimonialsContent.testimonials?.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                testimonial={testimonial}
                theme={theme}
                className="break-inside-avoid"
              />
            ))}
          </div>
        )}

        {layout === 'featured' && (
          <FeaturedLayout
            testimonials={testimonialsContent.testimonials}
            theme={theme}
          />
        )}
      </div>
    </section>
  )
}

function TestimonialCard({
  testimonial,
  theme,
  className,
}: {
  testimonial: Testimonial
  theme: string
  className?: string
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'
  const cardBg = testimonial.featured
    ? 'bg-gradient-to-br from-orange-500/10 to-purple-500/10'
    : theme === 'light'
    ? 'bg-white'
    : 'bg-slate-800/50'
  const cardBorder = testimonial.featured
    ? 'border-orange-500/50'
    : theme === 'light'
    ? 'border-slate-200'
    : 'border-slate-700'

  return (
    <div
      className={cn(
        'rounded-xl border p-6 transition-all hover:border-orange-500/50',
        cardBg,
        cardBorder,
        className
      )}
    >
      <Quote className="w-8 h-8 text-orange-500/30 mb-4" />

      {testimonial.rating && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-4 h-4',
                i < testimonial.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'
              )}
            />
          ))}
        </div>
      )}

      <blockquote className={`${textColor} text-lg mb-6`}>
        &quot;{testimonial.quote}&quot;
      </blockquote>

      <div className="flex items-center gap-4">
        {testimonial.author.avatar ? (
          <Image
            src={testimonial.author.avatar}
            alt={testimonial.author.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-orange-500 font-semibold">
              {testimonial.author.name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <div className={`font-semibold ${textColor}`}>
            {testimonial.author.name}
          </div>
          {(testimonial.author.title || testimonial.author.company) && (
            <div className={`text-sm ${mutedColor}`}>
              {testimonial.author.title}
              {testimonial.author.title && testimonial.author.company && ' at '}
              {testimonial.author.company}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TestimonialCarousel({
  testimonials,
  theme,
}: {
  testimonials: Testimonial[]
  theme: string
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  if (!testimonials?.length) return null

  const featured = testimonials[0]

  return (
    <div className="text-center">
      <Quote className="w-16 h-16 text-orange-500/30 mx-auto mb-6" />

      {featured.rating && (
        <div className="flex gap-1 justify-center mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-6 h-6',
                i < featured.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'
              )}
            />
          ))}
        </div>
      )}

      <blockquote className={`${textColor} text-2xl md:text-3xl font-medium mb-8 max-w-3xl mx-auto`}>
        &quot;{featured.quote}&quot;
      </blockquote>

      <div className="flex items-center gap-4 justify-center">
        {featured.author.avatar ? (
          <Image
            src={featured.author.avatar}
            alt={featured.author.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-orange-500 font-semibold text-xl">
              {featured.author.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="text-left">
          <div className={`font-semibold text-lg ${textColor}`}>
            {featured.author.name}
          </div>
          {(featured.author.title || featured.author.company) && (
            <div className={`${mutedColor}`}>
              {featured.author.title}
              {featured.author.title && featured.author.company && ' at '}
              {featured.author.company}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturedLayout({
  testimonials,
  theme,
}: {
  testimonials: Testimonial[]
  theme: string
}) {
  if (!testimonials?.length) return null

  const featured = testimonials.find(t => t.featured) || testimonials[0]
  const others = testimonials.filter(t => t !== featured).slice(0, 2)

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <TestimonialCard
        testimonial={{ ...featured, featured: true }}
        theme={theme}
        className="lg:row-span-2"
      />
      {others.map((testimonial, index) => (
        <TestimonialCard
          key={index}
          testimonial={testimonial}
          theme={theme}
        />
      ))}
    </div>
  )
}
