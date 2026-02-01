import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  AdvisorMessage,
  AdvisorSuggestion,
  AdvisorTopic,
  ChatRequest,
  ChatResponse,
  AdvisorContext,
} from '@/types/advisor';
import {
  ADVISOR_SYSTEM_PROMPT,
  buildContextPrompt,
} from '@/types/advisor';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat';

// =============================================================================
// GET - List Conversations & Messages
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Advisor GET auth failed:', authError?.message || 'No user session');
      return NextResponse.json({ error: 'Unauthorized', detail: authError?.message || 'No user session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const conversationId = searchParams.get('conversation_id');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership, error: memberError } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (memberError) {
      console.error('Workspace membership check failed:', memberError);
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace', detail: memberError?.message || 'No membership found' },
        { status: 403 }
      );
    }

    // If conversation_id provided, return messages for that conversation
    if (conversationId) {
      const { data: messages, error } = await (supabase
        .from('advisor_messages') as any)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Advisor: failed to fetch messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages', detail: error.message }, { status: 500 });
      }

      return NextResponse.json({ messages: messages || [] });
    }

    // Otherwise return conversations list
    const topicFilter = searchParams.get('topic');
    let query = (supabase
      .from('advisor_conversations') as any)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (topicFilter && topicFilter !== 'all') {
      query = query.eq('topic', topicFilter);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('Advisor: failed to fetch conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error('Advisor GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Send Message & Get AI Response
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const {
      workspace_id,
      conversation_id,
      message,
      topic = 'general',
      context,
      include_suggestions = false,
    } = body;

    if (!workspace_id || !message) {
      return NextResponse.json(
        { error: 'workspace_id and message are required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      // Create new conversation
      const { data: newConv, error: convError } = await (supabase
        .from('advisor_conversations') as any)
        .insert({
          workspace_id,
          user_id: user.id,
          title: generateTitle(message),
          topic,
          message_count: 0,
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }
      convId = newConv.id;
    }

    const conversationId = convId!;

    // Save user message
    const { data: userMessage, error: userMsgError } = await (supabase
      .from('advisor_messages') as any)
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        topic,
        tokens_used: estimateTokens(message),
        metadata: {},
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Fetch conversation history for context
    const { data: history } = await (supabase
      .from('advisor_messages') as any)
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build messages array for AI
    const messages = buildMessagesForAI(history || [], context);

    // Get AI response
    const aiResponse = await getAIResponse(messages, topic);

    // Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await (supabase
      .from('advisor_messages') as any)
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse.content,
        topic,
        tokens_used: aiResponse.tokens,
        model: aiResponse.model,
        metadata: {
          follow_up_questions: aiResponse.followUpQuestions,
          action_items: aiResponse.actionItems,
        },
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    // Update conversation
    await (supabase
      .from('advisor_conversations') as any)
      .update({
        message_count: (history?.length || 0) + 2,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // Generate suggestions if requested
    let suggestions;
    if (include_suggestions) {
      suggestions = await generateSuggestions(
        supabase,
        workspace_id,
        conversationId,
        aiResponse.content,
        topic
      );
    }

    const response: ChatResponse = {
      conversation_id: conversationId,
      message: assistantMessage as unknown as AdvisorMessage,
      suggestions: suggestions as unknown as AdvisorSuggestion[] | undefined,
      follow_up_questions: aiResponse.followUpQuestions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Advisor chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateTitle(message: string): string {
  // Take first 50 chars or first sentence
  const firstSentence = message.split(/[.!?]/)[0];
  if (firstSentence.length <= 50) {
    return firstSentence.trim();
  }
  return message.substring(0, 47).trim() + '...';
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildMessagesForAI(
  history: Array<{ role: string; content: string }>,
  context?: Partial<AdvisorContext>
): AIMessage[] {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: ADVISOR_SYSTEM_PROMPT + (context ? buildContextPrompt(context as AdvisorContext) : ''),
    },
  ];

  // Add conversation history
  for (const msg of history) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  return messages;
}

interface AIResponseResult {
  content: string;
  tokens: number;
  model: string;
  followUpQuestions: string[];
  actionItems: string[];
}

async function getAIResponse(
  messages: AIMessage[],
  topic: AdvisorTopic
): Promise<AIResponseResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  // Call OpenRouter API with DeepSeek model
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.foundershelm.com',
      'X-Title': 'Founders Helm AI Advisor',
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter API error:', response.status, errorData);
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid response from OpenRouter API');
  }

  const content = data.choices[0].message.content;
  const tokensUsed = data.usage?.total_tokens || estimateTokens(content);
  const modelUsed = data.model || DEEPSEEK_MODEL;

  // Extract follow-up questions from the response
  const followUpQuestions = extractFollowUpQuestions(content);
  
  // Extract action items from the response
  const actionItems = extractActionItems(content);

  return {
    content,
    tokens: tokensUsed,
    model: modelUsed,
    followUpQuestions,
    actionItems,
  };
}

function extractFollowUpQuestions(content: string): string[] {
  const questions: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that end with ? and are likely questions
    if (trimmed.endsWith('?') && trimmed.length > 15 && trimmed.length < 200) {
      // Clean up markdown formatting
      const cleaned = trimmed.replace(/^\*+|\*+$/g, '').replace(/^-\s*/, '').trim();
      if (cleaned.length > 10) {
        questions.push(cleaned);
      }
    }
  }
  
  return questions.slice(0, 3);
}

function extractActionItems(content: string): string[] {
  // Simple extraction of numbered items
  const items: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+\*\*([^*]+)\*\*/);
    if (match) {
      items.push(match[1].trim());
    }
  }
  
  return items.slice(0, 5);
}

async function generateSuggestions(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  workspaceId: string,
  conversationId: string,
  responseContent: string,
  topic: AdvisorTopic
) {
  // Extract suggestions from the AI response
  const actionItems = extractActionItems(responseContent);
  
  if (actionItems.length === 0) return [];

  const suggestions = actionItems.slice(0, 3).map((item, index) => ({
    workspace_id: workspaceId,
    conversation_id: conversationId,
    type: 'action' as const,
    topic,
    title: item,
    description: `Action item from AI advisor conversation`,
    rationale: null,
    action_steps: [item],
    priority: index === 0 ? 'high' : 'medium' as const,
    status: 'pending' as const,
    impact_score: 70 - index * 10,
    effort_score: 50,
  }));

  const { data } = await (supabase
    .from('advisor_suggestions') as any)
    .insert(suggestions)
    .select();

  return data || [];
}
