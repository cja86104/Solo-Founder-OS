import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat';

// =============================================================================
// POST /api/content/generate — AI content generation for the Content Engine
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, prompt, content_type, platforms, mode = 'generate' } = body;

    if (!workspace_id || !prompt) {
      return NextResponse.json(
        { error: 'workspace_id and prompt are required' },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const systemPrompt = buildSystemPrompt(mode, content_type, platforms);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Solo Founder OS Content Generator',
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: mode === 'ideas' ? 1500 : 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'AI generation failed' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Empty AI response' },
        { status: 502 }
      );
    }

    const content = data.choices[0].message.content;

    if (mode === 'ideas') {
      // Parse ideas from the response
      const ideas = parseIdeas(content);
      return NextResponse.json({ ideas });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(
  mode: string,
  contentType?: string,
  platforms?: string[]
): string {
  const basePrompt = `You are an expert content writer for solo founders and entrepreneurs. You write engaging, authentic content that resonates with audiences.`;

  if (mode === 'ideas') {
    return `${basePrompt}

Generate content ideas. For each idea, provide:
- A compelling title
- A brief description (1-2 sentences)

Return EXACTLY this JSON format (no markdown, no code fences):
[{"title":"Idea Title","description":"Brief description of the idea."}]

Generate 5 diverse, actionable content ideas based on the user's request.`;
  }

  if (mode === 'improve') {
    return `${basePrompt}

Improve the given content. Make it more engaging, clear, and impactful while preserving the original message and voice. Return only the improved content as HTML, no explanations.`;
  }

  // Default: generate
  const typeInstructions: Record<string, string> = {
    post: 'Write a concise social media post. Keep it punchy and engaging. Use short paragraphs.',
    article: 'Write a well-structured article with clear sections. Use headers, paragraphs, and actionable takeaways.',
    thread: `Write a Twitter/X thread. Return EXACTLY this JSON format (no markdown, no code fences):
{"segments":[{"text":"First tweet text"},{"text":"Second tweet text"}]}
Each segment should be under 280 characters. Aim for 4-7 segments.`,
  };

  const platformInstructions = platforms?.length
    ? `\nTarget platforms: ${platforms.join(', ')}. Adapt tone and length accordingly.`
    : '';

  const typeInstruction = typeInstructions[contentType || 'post'] || typeInstructions.post;

  return `${basePrompt}

${typeInstruction}${platformInstructions}

Return the content as clean HTML (use <p>, <strong>, <em>, <ul>, <li>, <h2>, <h3> tags as appropriate). Do not include any explanation or preamble — just the content itself.`;
}

function parseIdeas(content: string): Array<{ title: string; description: string }> {
  try {
    // Try to parse as JSON directly
    const parsed = JSON.parse(content.trim());
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        title: item.title || 'Untitled Idea',
        description: item.description || '',
      }));
    }
  } catch {
    // Try to extract JSON from markdown code fences
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            title: item.title || 'Untitled Idea',
            description: item.description || '',
          }));
        }
      } catch {
        // fallthrough
      }
    }
  }

  // Fallback: parse line-by-line
  const ideas: Array<{ title: string; description: string }> = [];
  const lines = content.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const cleaned = line.replace(/^\d+[\.\)]\s*/, '').replace(/^\*+\s*/, '').replace(/^-\s*/, '').trim();
    if (cleaned.length > 5) {
      const [title, ...descParts] = cleaned.split(/[:\-–—]/);
      ideas.push({
        title: title.replace(/\*+/g, '').trim(),
        description: descParts.join(' ').replace(/\*+/g, '').trim(),
      });
    }
  }

  return ideas.slice(0, 5);
}
