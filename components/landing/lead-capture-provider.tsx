'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, Sparkles } from 'lucide-react'

interface LeadCaptureContextType {
  openCapture: () => void
  closeCapture: () => void
}

const LeadCaptureContext = createContext<LeadCaptureContextType | null>(null)

export function useLeadCapture() {
  const context = useContext(LeadCaptureContext)
  if (!context) {
    return {
      openCapture: () => {},
      closeCapture: () => {},
    }
  }
  return context
}

interface LeadCaptureProviderProps {
  children: ReactNode
  pageId: string
}

export function LeadCaptureProvider({ children, pageId }: LeadCaptureProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    message: '',
  })

  const openCapture = () => setIsOpen(true)
  const closeCapture = () => {
    setIsOpen(false)
    if (status === 'success') {
      setStatus('idle')
      setFormData({ email: '', name: '', company: '', message: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.email.includes('@')) {
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
          email: formData.email,
          name: formData.name || undefined,
          company: formData.company || undefined,
          message: formData.message || undefined,
          source: 'modal',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (status === 'error') setStatus('idle')
  }

  return (
    <LeadCaptureContext.Provider value={{ openCapture, closeCapture }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {status === 'success' ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <DialogTitle className="text-2xl mb-2">You're all set!</DialogTitle>
              <DialogDescription className="mb-6">
                Thanks for your interest. We'll be in touch soon.
              </DialogDescription>
              <Button onClick={closeCapture}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
                <DialogTitle>Get Started</DialogTitle>
                <DialogDescription>
                  Enter your details and we'll get back to you shortly.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={status === 'loading'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={status === 'loading'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Your company"
                    value={formData.company}
                    onChange={handleInputChange}
                    disabled={status === 'loading'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (optional)</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your project..."
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={status === 'loading'}
                    rows={3}
                  />
                </div>

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
                    'Submit'
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </LeadCaptureContext.Provider>
  )
}
