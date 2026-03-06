'use client'

import { useState } from 'react'
import { BaseSectionProps, getSectionBackground, getSectionPadding } from './index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, Mail, Phone, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactInfo {
  email?: string
  phone?: string
  address?: string
}

interface ContactContent {
  headline?: string
  subheadline?: string
  description?: string
  contactInfo?: ContactInfo
  formFields?: Array<{
    name: string
    label: string
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select'
    required?: boolean
    placeholder?: string
    options?: string[]
  }>
  submitButtonText?: string
  successMessage?: string
}

export function ContactSection({ content, settings, theme, pageId }: BaseSectionProps) {
  const contactContent = content as ContactContent
  const bgClass = getSectionBackground(theme, settings)
  const paddingClass = getSectionPadding(settings)
  const layout = (settings.layout as string) || 'split'

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const mutedColor = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <section className={`${bgClass} ${paddingClass}`}>
      <div className="container mx-auto px-4">
        {layout === 'split' && (
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              {contactContent.subheadline && (
                <p className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
                  {contactContent.subheadline}
                </p>
              )}
              {contactContent.headline && (
                <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
                  {contactContent.headline}
                </h2>
              )}
              {contactContent.description && (
                <p className={`text-lg ${mutedColor} mb-8`}>
                  {contactContent.description}
                </p>
              )}

              {contactContent.contactInfo && (
                <ContactInfoDisplay
                  info={contactContent.contactInfo}
                  textColor={textColor}
                  mutedColor={mutedColor}
                />
              )}
            </div>

            <ContactForm
              content={contactContent}
              theme={theme}
              pageId={pageId}
            />
          </div>
        )}

        {layout === 'centered' && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              {contactContent.subheadline && (
                <p className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
                  {contactContent.subheadline}
                </p>
              )}
              {contactContent.headline && (
                <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
                  {contactContent.headline}
                </h2>
              )}
              {contactContent.description && (
                <p className={`text-lg ${mutedColor}`}>
                  {contactContent.description}
                </p>
              )}
            </div>

            <ContactForm
              content={contactContent}
              theme={theme}
              pageId={pageId}
            />

            {contactContent.contactInfo && (
              <div className="mt-8">
                <ContactInfoDisplay
                  info={contactContent.contactInfo}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  centered
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactInfoDisplay({
  info,
  textColor: _textColor,
  mutedColor,
  centered,
}: {
  info: ContactInfo
  textColor: string
  mutedColor: string
  centered?: boolean
}) {
  const items = [
    { icon: Mail, value: info.email, href: `mailto:${info.email}` },
    { icon: Phone, value: info.phone, href: `tel:${info.phone}` },
    { icon: MapPin, value: info.address },
  ].filter(item => item.value)

  return (
    <div className={cn('space-y-4', centered && 'flex flex-wrap justify-center gap-6')}>
      {items.map((item, index) => {
        const Icon = item.icon
        const content = (
          <div className={cn('flex items-center gap-3', centered && 'flex-col text-center')}>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-orange-500" />
            </div>
            <span className={mutedColor}>{item.value}</span>
          </div>
        )

        return item.href ? (
          <a
            key={index}
            href={item.href}
            className={cn('block', !centered && `hover:text-orange-500 transition-colors`)}
          >
            {content}
          </a>
        ) : (
          <div key={index}>{content}</div>
        )
      })}
    </div>
  )
}

function ContactForm({
  content,
  theme,
  pageId,
}: {
  content: ContactContent
  theme: string
  pageId: string
}) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const cardBg = theme === 'light' ? 'bg-white' : 'bg-slate-800/50'
  const borderColor = theme === 'light' ? 'border-slate-200' : 'border-slate-700'
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-slate-900'
  const inputBorder = theme === 'light' ? 'border-slate-300' : 'border-slate-600'

  const defaultFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true, placeholder: 'Your name' },
    { name: 'email', label: 'Email', type: 'email' as const, required: true, placeholder: 'you@example.com' },
    { name: 'message', label: 'Message', type: 'textarea' as const, required: true, placeholder: 'How can we help?' },
  ]

  const fields = content.formFields?.length ? content.formFields : defaultFields

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (status === 'error') setStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          email: formData.email,
          name: formData.name,
          message: formData.message,
          source: 'contact',
          metadata: formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className={cn('rounded-xl border p-8 text-center', cardBg, borderColor)}>
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          Message Sent!
        </h3>
        <p className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
          {content.successMessage || "Thanks for reaching out. We'll get back to you soon."}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('rounded-xl border p-6 md:p-8', cardBg, borderColor)}
    >
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                disabled={status === 'loading'}
                className={cn(inputBg, inputBorder)}
                rows={4}
              />
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                disabled={status === 'loading'}
                className={cn(inputBg, inputBorder)}
              />
            )}
          </div>
        ))}

        {status === 'error' && (
          <p className="text-red-500 text-sm">{errorMessage}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            content.submitButtonText || 'Send Message'
          )}
        </Button>
      </div>
    </form>
  )
}
