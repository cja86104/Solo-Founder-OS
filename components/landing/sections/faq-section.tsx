'use client'

import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FaqItem {
  question: string
  answer: string
  category?: string
}

interface FaqContent {
  headline?: string
  subheadline?: string
  description?: string
  items: FaqItem[]
  categories?: string[]
}

export function FaqSection({ content, settings, theme }: BaseSectionProps) {
  const faqContent = content as unknown as FaqContent
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'single'

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  const categories = faqContent.categories || 
    [...new Set(faqContent.items?.map(item => item.category).filter(Boolean))]

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {(faqContent.headline || faqContent.subheadline) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {faqContent.subheadline && (
              <p className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
                {faqContent.subheadline}
              </p>
            )}
            {faqContent.headline && (
              <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
                {faqContent.headline}
              </h2>
            )}
            {faqContent.description && (
              <p className={`text-lg ${mutedColor}`}>
                {faqContent.description}
              </p>
            )}
          </div>
        )}

        {layout === 'single' && (
          <div className="max-w-3xl mx-auto">
            <FaqAccordion
              items={faqContent.items}
              theme={theme}
            />
          </div>
        )}

        {layout === 'two-column' && (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <FaqAccordion
              items={faqContent.items?.slice(0, Math.ceil(faqContent.items.length / 2))}
              theme={theme}
            />
            <FaqAccordion
              items={faqContent.items?.slice(Math.ceil(faqContent.items.length / 2))}
              theme={theme}
            />
          </div>
        )}

        {layout === 'categorized' && categories.length > 0 && (
          <div className="space-y-12 max-w-3xl mx-auto">
            {categories.map((category, index) => (
              <div key={index}>
                <h3 className={`text-xl font-semibold ${textColor} mb-4`}>
                  {category}
                </h3>
                <FaqAccordion
                  items={faqContent.items?.filter(item => item.category === category)}
                  theme={theme}
                />
              </div>
            ))}
            {/* Items without category */}
            {faqContent.items?.some(item => !item.category) && (
              <div>
                <h3 className={`text-xl font-semibold ${textColor} mb-4`}>
                  General
                </h3>
                <FaqAccordion
                  items={faqContent.items?.filter(item => !item.category)}
                  theme={theme}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function FaqAccordion({
  items,
  theme,
}: {
  items: FaqItem[]
  theme: string
}) {
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'
  const borderColor = theme === 'light' ? 'border-slate-200' : 'border-slate-700'

  if (!items?.length) return null

  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className={`border-b ${borderColor}`}
        >
          <AccordionTrigger
            className={`${textColor} text-left hover:no-underline hover:text-orange-500 py-4`}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent className={`${mutedColor} pb-4`}>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
