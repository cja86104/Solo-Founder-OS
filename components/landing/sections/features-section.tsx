'use client'

import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { 
  Zap, Shield, Globe, Code, Cpu, Database, 
  Cloud, Lock, Rocket, Star, Check, ArrowRight 
} from 'lucide-react'

interface Feature {
  icon?: string
  title: string
  description: string
  link?: {
    text: string
    url: string
  }
}

interface FeaturesContent {
  headline?: string
  subheadline?: string
  description?: string
  features: Feature[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  shield: Shield,
  globe: Globe,
  code: Code,
  cpu: Cpu,
  database: Database,
  cloud: Cloud,
  lock: Lock,
  rocket: Rocket,
  star: Star,
  check: Check,
}

export function FeaturesSection({ content, settings, theme }: BaseSectionProps) {
  const featuresContent = content as unknown as FeaturesContent
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'grid'
  const columns = (settings.columns as number) || 3

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'
  const cardBg = theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'
  const cardBorder = theme === 'light' ? 'border-slate-200' : 'border-slate-700'

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {(featuresContent.headline || featuresContent.subheadline) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {featuresContent.subheadline && (
              <p className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
                {featuresContent.subheadline}
              </p>
            )}
            {featuresContent.headline && (
              <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
                {featuresContent.headline}
              </h2>
            )}
            {featuresContent.description && (
              <p className={`text-lg ${mutedColor}`}>
                {featuresContent.description}
              </p>
            )}
          </div>
        )}

        {layout === 'grid' && (
          <div className={`grid md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
            {featuresContent.features?.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                textColor={textColor}
                mutedColor={mutedColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
              />
            ))}
          </div>
        )}

        {layout === 'list' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {featuresContent.features?.map((feature, index) => (
              <FeatureListItem
                key={index}
                feature={feature}
                textColor={textColor}
                mutedColor={mutedColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
              />
            ))}
          </div>
        )}

        {layout === 'alternating' && (
          <div className="space-y-16">
            {featuresContent.features?.map((feature, index) => (
              <FeatureAlternating
                key={index}
                feature={feature}
                index={index}
                textColor={textColor}
                mutedColor={mutedColor}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FeatureCard({
  feature,
  textColor,
  mutedColor,
  cardBg,
  cardBorder,
}: {
  feature: Feature
  textColor: string
  mutedColor: string
  cardBg: string
  cardBorder: string
}) {
  const IconComponent = feature.icon ? iconMap[feature.icon] : Check

  return (
    <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} transition-all hover:border-orange-500/50`}>
      <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
        {IconComponent && <IconComponent className="w-6 h-6 text-orange-500" />}
      </div>
      <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
        {feature.title}
      </h3>
      <p className={`${mutedColor} mb-4`}>
        {feature.description}
      </p>
      {feature.link && (
        <a
          href={feature.link.url}
          className="inline-flex items-center text-orange-500 hover:text-orange-400 font-medium"
        >
          {feature.link.text}
          <ArrowRight className="ml-1 w-4 h-4" />
        </a>
      )}
    </div>
  )
}

function FeatureListItem({
  feature,
  textColor,
  mutedColor,
  cardBg,
  cardBorder,
}: {
  feature: Feature
  textColor: string
  mutedColor: string
  cardBg: string
  cardBorder: string
}) {
  const IconComponent = feature.icon ? iconMap[feature.icon] : Check

  return (
    <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} flex gap-6`}>
      <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
        {IconComponent && <IconComponent className="w-6 h-6 text-orange-500" />}
      </div>
      <div>
        <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
          {feature.title}
        </h3>
        <p className={`${mutedColor}`}>
          {feature.description}
        </p>
        {feature.link && (
          <a
            href={feature.link.url}
            className="inline-flex items-center text-orange-500 hover:text-orange-400 font-medium mt-3"
          >
            {feature.link.text}
            <ArrowRight className="ml-1 w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}

function FeatureAlternating({
  feature,
  index,
  textColor,
  mutedColor,
}: {
  feature: Feature
  index: number
  textColor: string
  mutedColor: string
}) {
  const IconComponent = feature.icon ? iconMap[feature.icon] : Check
  const isReversed = index % 2 === 1

  return (
    <div className={`grid md:grid-cols-2 gap-12 items-center ${isReversed ? 'md:flex-row-reverse' : ''}`}>
      <div className={isReversed ? 'md:order-2' : ''}>
        <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6">
          {IconComponent && <IconComponent className="w-7 h-7 text-orange-500" />}
        </div>
        <h3 className={`text-2xl font-bold ${textColor} mb-4`}>
          {feature.title}
        </h3>
        <p className={`text-lg ${mutedColor}`}>
          {feature.description}
        </p>
        {feature.link && (
          <a
            href={feature.link.url}
            className="inline-flex items-center text-orange-500 hover:text-orange-400 font-medium mt-4"
          >
            {feature.link.text}
            <ArrowRight className="ml-1 w-4 h-4" />
          </a>
        )}
      </div>
      <div className={`bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-2xl aspect-video ${isReversed ? 'md:order-1' : ''}`}>
        {/* Placeholder for feature illustration */}
      </div>
    </div>
  )
}
