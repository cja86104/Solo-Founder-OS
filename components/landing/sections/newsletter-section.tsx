'use client'

import { useState } from 'react'
import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Loader2, Check, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsletterContent {
  headline?: string
  subheadline?: string
  description?: string
  placeholder?: string
  buttonText?: string
  successMessage?: string
  privacyText?: string
}

export function NewsletterSection({ content, settings, theme, pageId }: BaseSectionProps) {
  const newsletterContent = content as NewsletterContent
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'centered'

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {layout === 'centered' && (
          <CenteredNewsletter
            content={newsletterContent}
            textColor={textColor}
            mutedColor={mutedColor}
            theme={theme}
            pageId={pageId}
          />
        )}

        {layout === 'split' && (
          <SplitNewsletter
            content={newsletterContent}
            textColor={textColor}
            mutedColor={mutedColor}
            theme={theme}
            pageId={pageId}
          />
        )}

        {layout === 'card' && (
          <CardNewsletter
            content={newsletterContent}
            textColor={textColor}
            mutedColor={mutedColor}
            theme={theme}
            pageId={pageId}
          />
        )}
      </div>
    </section>
  )
}

function CenteredNewsletter({
  content,
  textColor,
  mutedColor,
  theme,
  pageId,
}: {
  content: NewsletterContent
  textColor: string
  mutedColor: string
  theme: string
  pageId: string
}) {
  return (
    <div className="max-w-xl mx-auto text-center">
      <Mail className="w-12 h-12 text-orange-500 mx-auto mb-6" />

      {content.headline && (
        <h2 className={`text-3xl font-bold ${textColor} mb-4`}>
          {content.headline}
        </h2>
      )}

      {content.description && (
        <p className={`${mutedColor} mb-8`}>
          {content.description}
        </p>
      )}

      <EmailForm
        content={content}
        theme={theme}
        pageId={pageId}
        layout="stacked"
      />

      {content.privacyText && (
        <p className={`text-sm ${mutedColor} mt-4`}>
          {content.privacyText}
        </p>
      )}
    </div>
  )
}

function SplitNewsletter({
  content,
  textColor,
  mutedColor,
  theme,
  pageId,
}: {
  content: NewsletterContent
  textColor: string
  mutedColor: string
  theme: string
  pageId: string
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
      <div className="text-center md:text-left">
        {content.headline && (
          <h2 className={`text-2xl md:text-3xl font-bold ${textColor} mb-2`}>
            {content.headline}
          </h2>
        )}

        {content.description && (
          <p className={`${mutedColor}`}>
            {content.description}
          </p>
        )}
      </div>

      <div className="w-full md:w-auto">
        <EmailForm
          content={content}
          theme={theme}
          pageId={pageId}
          layout="inline"
        />
      </div>
    </div>
  )
}

function CardNewsletter({
  content,
  textColor,
  mutedColor,
  theme,
  pageId,
}: {
  content: NewsletterContent
  textColor: string
  mutedColor: string
  theme: string
  pageId: string
}) {
  const cardBg = theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'
  const borderColor = theme === 'light' ? 'border-slate-200' : 'border-slate-700'

  return (
    <div className={cn(
      'max-w-xl mx-auto rounded-2xl border p-8 md:p-12 text-center',
      cardBg,
      borderColor
    )}>
      <Mail className="w-12 h-12 text-orange-500 mx-auto mb-6" />

      {content.headline && (
        <h2 className={`text-2xl font-bold ${textColor} mb-4`}>
          {content.headline}
        </h2>
      )}

      {content.description && (
        <p className={`${mutedColor} mb-8`}>
          {content.description}
        </p>
      )}

      <EmailForm
        content={content}
        theme={theme}
        pageId={pageId}
        layout="stacked"
      />

      {content.privacyText && (
        <p className={`text-sm ${mutedColor} mt-4`}>
          {content.privacyText}
        </p>
      )}
    </div>
  )
}

function EmailForm({
  content,
  theme,
  pageId,
  layout,
}: {
  content: NewsletterContent
  theme: string
  pageId: string
  layout: 'stacked' | 'inline'
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const inputBg = theme === 'light' ? 'bg-white' : 'bg-slate-900'
  const borderColor = theme === 'light' ? 'border-slate-300' : 'border-slate-600'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          email,
          source: 'newsletter',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-green-500 py-4">
        <Check className="w-5 h-5" />
        <span>{content.successMessage || 'Thanks for subscribing!'}</span>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        layout === 'inline'
          ? 'flex flex-col sm:flex-row gap-3'
          : 'space-y-4'
      )}
    >
      <Input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (status === 'error') setStatus('idle')
        }}
        placeholder={content.placeholder || 'Enter your email'}
        className={cn(
          'h-12',
          inputBg,
          borderColor,
          layout === 'inline' && 'sm:w-64'
        )}
        disabled={status === 'loading'}
      />

      <Button
        type="submit"
        size="lg"
        className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-6"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {content.buttonText || 'Subscribe'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>

      {status === 'error' && (
        <p className="text-red-500 text-sm">{errorMessage}</p>
      )}
    </form>
  )
}
