'use client'

import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { Button } from '@/components/ui/button'
import { Check, X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingPlan {
  name: string
  description?: string
  price: {
    monthly?: number
    yearly?: number
    oneTime?: number
    custom?: string
  }
  features: Array<{
    text: string
    included: boolean
  }>
  cta: {
    text: string
    url: string
  }
  popular?: boolean
  badge?: string
}

interface PricingContent {
  headline?: string
  subheadline?: string
  description?: string
  plans: PricingPlan[]
  showToggle?: boolean
}

export function PricingSection({ content, settings, theme }: BaseSectionProps) {
  const pricingContent = content as unknown as PricingContent
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {(pricingContent.headline || pricingContent.subheadline) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {pricingContent.subheadline && (
              <p className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
                {pricingContent.subheadline}
              </p>
            )}
            {pricingContent.headline && (
              <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
                {pricingContent.headline}
              </h2>
            )}
            {pricingContent.description && (
              <p className={`text-lg ${mutedColor}`}>
                {pricingContent.description}
              </p>
            )}
          </div>
        )}

        <div className={cn(
          'grid gap-8 max-w-6xl mx-auto',
          pricingContent.plans?.length === 1 && 'md:max-w-md',
          pricingContent.plans?.length === 2 && 'md:grid-cols-2 md:max-w-3xl',
          pricingContent.plans?.length >= 3 && 'md:grid-cols-3'
        )}>
          {pricingContent.plans?.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({
  plan,
  theme,
}: {
  plan: PricingPlan
  theme: string
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'
  const cardBg = plan.popular
    ? 'bg-gradient-to-br from-orange-500/10 to-purple-500/10'
    : theme === 'light'
    ? 'bg-white'
    : 'bg-slate-800/50'
  const cardBorder = plan.popular
    ? 'border-orange-500'
    : theme === 'light'
    ? 'border-slate-200'
    : 'border-slate-700'

  const displayPrice = () => {
    if (plan.price.custom) return plan.price.custom
    if (plan.price.oneTime) return `$${plan.price.oneTime}`
    if (plan.price.monthly) return `$${plan.price.monthly}`
    return 'Free'
  }

  const priceLabel = () => {
    if (plan.price.custom) return ''
    if (plan.price.oneTime) return 'one-time'
    if (plan.price.monthly) return '/month'
    return ''
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 p-8 transition-all',
        cardBg,
        cardBorder,
        plan.popular && 'scale-105 shadow-xl shadow-orange-500/10'
      )}
    >
      {(plan.popular || plan.badge) && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-orange-500 text-white text-sm font-medium">
            {plan.popular && <Star className="w-4 h-4 fill-current" />}
            {plan.badge || 'Most Popular'}
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className={`text-xl font-bold ${textColor} mb-2`}>
          {plan.name}
        </h3>
        {plan.description && (
          <p className={`${mutedColor} text-sm`}>
            {plan.description}
          </p>
        )}
      </div>

      <div className="text-center mb-8">
        <span className={`text-5xl font-bold ${textColor}`}>
          {displayPrice()}
        </span>
        {priceLabel() && (
          <span className={`${mutedColor} ml-1`}>
            {priceLabel()}
          </span>
        )}
        {plan.price.yearly && plan.price.monthly && (
          <p className={`${mutedColor} text-sm mt-2`}>
            or ${plan.price.yearly}/year (save {Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100)}%)
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features?.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? textColor : mutedColor}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        className={cn(
          'w-full',
          plan.popular
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : theme === 'light'
            ? 'bg-slate-900 hover:bg-slate-800 text-white'
            : 'bg-white hover:bg-slate-100 text-slate-900'
        )}
        size="lg"
        onClick={() => window.location.href = plan.cta.url}
      >
        {plan.cta.text}
      </Button>
    </div>
  )
}
