'use client'

import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { cn } from '@/lib/utils'

interface Logo {
  name: string
  url?: string
  image?: string
}

interface LogosContent {
  headline?: string
  subheadline?: string
  logos: Logo[]
}

export function LogosSection({ content, settings, theme }: BaseSectionProps) {
  const logosContent = content as unknown as LogosContent
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'grid'

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-500' : 'text-slate-400'

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {(logosContent.headline || logosContent.subheadline) && (
          <div className="text-center mb-10">
            {logosContent.subheadline && (
              <p className={`${mutedColor} text-sm uppercase tracking-wider font-medium`}>
                {logosContent.subheadline}
              </p>
            )}
            {logosContent.headline && (
              <h2 className={`text-xl font-semibold ${textColor} mt-2`}>
                {logosContent.headline}
              </h2>
            )}
          </div>
        )}

        {layout === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {logosContent.logos?.map((logo, index) => (
              <LogoItem key={index} logo={logo} theme={theme} />
            ))}
          </div>
        )}

        {layout === 'row' && (
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {logosContent.logos?.map((logo, index) => (
              <LogoItem key={index} logo={logo} theme={theme} />
            ))}
          </div>
        )}

        {layout === 'marquee' && (
          <div className="relative overflow-hidden">
            <div className="flex animate-marquee gap-12">
              {[...logosContent.logos, ...logosContent.logos].map((logo, index) => (
                <LogoItem key={index} logo={logo} theme={theme} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function LogoItem({
  logo,
  theme,
}: {
  logo: Logo
  theme: string
}) {
  const opacity = theme === 'light' ? 'opacity-60 hover:opacity-100' : 'opacity-50 hover:opacity-100'
  const filter = theme === 'dark' ? 'brightness-0 invert' : ''

  const content = logo.image ? (
    <img
      src={logo.image}
      alt={logo.name}
      className={cn(
        'h-8 md:h-10 w-auto object-contain transition-all',
        opacity,
        filter && `filter ${filter}`
      )}
    />
  ) : (
    <span className={cn(
      'text-xl font-bold transition-opacity',
      opacity,
      theme === 'light' ? 'text-slate-800' : 'text-white'
    )}>
      {logo.name}
    </span>
  )

  if (logo.url) {
    return (
      <a
        href={logo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    )
  }

  return <div>{content}</div>
}
