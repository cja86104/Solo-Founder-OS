import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const leadSchema = z.object({
  pageId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = leadSchema.parse(body)
    
    const supabase = await createClient()
    
    // Verify the page exists and is published, and get workspace_id
    const { data: page, error: pageError } = await (supabase
      .from('landing_pages') as any)
      .select('id, workspace_id, user_id')
      .eq('id', validatedData.pageId)
      .eq('status', 'published')
      .single()

    if (pageError || !page) {
      return NextResponse.json(
        { error: 'Page not found or not published' },
        { status: 404 }
      )
    }

    // Check for duplicate submission (same email within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existingLead } = await (supabase
      .from('landing_page_leads') as any)
      .select('id')
      .eq('page_id', validatedData.pageId)
      .eq('email', validatedData.email)
      .gte('created_at', oneHourAgo)
      .single()
    
    if (existingLead) {
      return NextResponse.json(
        { success: true, message: 'Already submitted' },
        { status: 200 }
      )
    }
    
    // Build data object with optional fields
    const leadData: Record<string, unknown> = {
      page_id: validatedData.pageId,
      workspace_id: page.workspace_id,
      email: validatedData.email,
      source: validatedData.source || 'website',
      data: {
        company: validatedData.company,
        phone: validatedData.phone,
        message: validatedData.message,
        ...validatedData.metadata,
        userAgent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
      },
    }

    // Add name if provided
    if (validatedData.name) {
      leadData.name = validatedData.name
    }
    
    // Insert the lead
    const { data: lead, error: insertError } = await (supabase
      .from('landing_page_leads') as any)
      .insert(leadData as any)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting lead:', insertError)
      return NextResponse.json(
        { error: 'Failed to capture lead' },
        { status: 500 }
      )
    }

    // Track conversion event
    await (supabase.from('landing_page_analytics') as any).insert({
      page_id: validatedData.pageId,
      event_type: 'conversion',
      event_data: {
        leadId: lead.id,
        source: validatedData.source || 'website',
        timestamp: new Date().toISOString(),
      },
    })
    
    return NextResponse.json(
      { success: true, message: 'Lead captured successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Lead capture error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Verify user has access to this page
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { data: page } = await (supabase
      .from('landing_pages') as any)
      .select('id, user_id')
      .eq('id', pageId)
      .eq('user_id', user.id)
      .single()

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch leads
    const { data: leads, error } = await (supabase
      .from('landing_page_leads') as any)
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
