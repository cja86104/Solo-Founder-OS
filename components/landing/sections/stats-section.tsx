'use client'

import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { cn } from '@/lib/utils'
import { TrendingUp, Users, Zap, Globe, Star, Clock } from 'lucide-react'

interface Stat {
  value: string
  label: string
  description?: string
  icon?: string
  change?: {
    value: string
    positive: boolean
  }
}

interface StatsContent {
  headline?: string
  subheadline?: string
  description?: string
  stats: Stat[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: TrendingUp,
  users: Users,
  zap: Zap,
  globe: Globe,
  star: Star,
  clock: Clock,
}

export function StatsSection({ content, settings, theme }: BaseSectionProps) {
  const statsContent = content as unknown as StatsContent
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'row'

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {(statsContent.headline || statsContent.subheadline) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {statsContent.subheadline && (
              <p className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
                {statsContent.subheadline}
              </p>
            )}
            {statsContent.headline && (
              <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
                {statsContent.headline}
              </h2>
            )}
            {statsContent.description && (
              <p className={`text-lg ${mutedColor}`}>
                {statsContent.description}
              </p>
            )}
          </div>
        )}

        {layout === 'row' && (
          <div className={cn(
            'grid gap-8',
            statsContent.stats?.length === 3 && 'md:grid-cols-3',
            statsContent.stats?.length === 4 && 'md:grid-cols-2 lg:grid-cols-4',
            statsContent.stats?.length !== 3 && statsContent.stats?.length !== 4 && 'md:grid-cols-2 lg:grid-cols-4'
          )}>
            {statsContent.stats?.map((stat, index) => (
              <StatRow
                key={index}
                stat={stat}
                textColor={textColor}
                mutedColor={mutedColor}
              />
            ))}
          </div>
        )}

        {layout === 'cards' && (
          <div className={cn(
            'grid gap-6',
            statsContent.stats?.length === 3 && 'md:grid-cols-3',
            statsContent.stats?.length === 4 && 'md:grid-cols-2 lg:grid-cols-4',
            statsContent.stats?.length !== 3 && statsContent.stats?.length !== 4 && 'md:grid-cols-2 lg:grid-cols-4'
          )}>
            {statsContent.stats?.map((stat, index) => (
              <StatCard
                key={index}
                stat={stat}
                theme={theme}
              />
            ))}
          </div>
        )}

        {layout === 'centered' && (
          <div className="flex flex-wrap justify-center gap-12 md:gap-16">
            {statsContent.stats?.map((stat, index) => (
              <StatCentered
                key={index}
                stat={stat}
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

function StatRow({
  stat,
  textColor,
  mutedColor,
}: {
  stat: Stat
  textColor: string
  mutedColor: string
}) {
  return (
    <div className="text-center">
      <div className={`text-4xl md:text-5xl font-bold ${textColor} mb-2`}>
        {stat.value}
      </div>
      <div className={`text-lg font-medium ${textColor} mb-1`}>
        {stat.label}
      </div>
      {stat.description && (
        <p className={`text-sm ${mutedColor}`}>
          {stat.description}
        </p>
      )}
      {stat.change && (
        <div className={cn(
          'text-sm font-medium mt-2',
          stat.change.positive ? 'text-green-500' : 'text-red-500'
        )}>
          {stat.change.positive ? '+' : ''}{stat.change.value}
        </div>
      )}
    </div>
  )
}

function StatCard({
  stat,
  theme,
}: {
  stat: Stat
  theme: string
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'
  const cardBg = theme === 'light' ? 'bg-white' : 'bg-slate-800/50'
  const borderColor = theme === 'light' ? 'border-slate-200' : 'border-slate-700'

  const IconComponent = stat.icon ? iconMap[stat.icon] : null

  return (
    <div className={cn(
      'rounded-xl border p-6 text-center transition-all hover:border-orange-500/50',
      cardBg,
      borderColor
    )}>
      {IconComponent && (
        <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <IconComponent className="w-6 h-6 text-orange-500" />
        </div>
      )}
      <div className={`text-3xl md:text-4xl font-bold ${textColor} mb-2`}>
        {stat.value}
      </div>
      <div className={`font-medium ${textColor} mb-1`}>
        {stat.label}
      </div>
      {stat.description && (
        <p className={`text-sm ${mutedColor}`}>
          {stat.description}
        </p>
      )}
      {stat.change && (
        <div className={cn(
          'text-sm font-medium mt-2 inline-flex items-center gap-1',
          stat.change.positive ? 'text-green-500' : 'text-red-500'
        )}>
          <TrendingUp className={cn(
            'w-4 h-4',
            !stat.change.positive && 'rotate-180'
          )} />
          {stat.change.value}
        </div>
      )}
    </div>
  )
}

function StatCentered({
  stat,
  textColor,
  mutedColor,
}: {
  stat: Stat
  textColor: string
  mutedColor: string
}) {
  return (
    <div className="text-center">
      <div className={`text-5xl md:text-6xl font-bold text-orange-500 mb-2`}>
        {stat.value}
      </div>
      <div className={`text-lg font-medium ${textColor}`}>
        {stat.label}
      </div>
      {stat.description && (
        <p className={`text-sm ${mutedColor} mt-1`}>
          {stat.description}
        </p>
      )}
    </div>
  )
}
