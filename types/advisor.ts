// =============================================================================
// Solo Founder OS - AI Advisor Types
// =============================================================================

// Advisor topics for specialized advice
export type AdvisorTopic = 
  | 'general'
  | 'marketing'
  | 'sales'
  | 'product'
  | 'finance'
  | 'operations'
  | 'growth'
  | 'strategy'
  | 'hiring'
  | 'fundraising';

// Message roles
export type AdvisorRole = 'user' | 'assistant' | 'system';

// Individual message in conversation
export interface AdvisorMessage {
  id: string;
  conversation_id: string;
  role: AdvisorRole;
  content: string;
  topic: AdvisorTopic;
  tokens_used?: number;
  model?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Chat request from client
export interface ChatRequest {
  workspace_id: string;
  conversation_id?: string;
  message: string;
  topic?: AdvisorTopic;
  context?: Partial<AdvisorContext>;
  include_suggestions?: boolean;
}

// Chat response to client
export interface ChatResponse {
  conversation_id: string;
  message: AdvisorMessage;
  suggestions?: AdvisorSuggestion[];
  follow_up_questions?: string[];
}

// Context for AI to understand the business
export interface AdvisorContext {
  businessType?: string;
  stage?: 'idea' | 'mvp' | 'launched' | 'growing' | 'scaling';
  monthlyRevenue?: number;
  teamSize?: number;
  industry?: string;
  targetMarket?: string;
  currentChallenges?: string[];
  goals?: string[];
}

// AI-generated suggestion
export interface AdvisorSuggestion {
  id?: string;
  workspace_id: string;
  conversation_id: string;
  type: 'action' | 'insight' | 'warning';
  topic: AdvisorTopic;
  title: string;
  description: string;
  rationale: string | null;
  action_steps?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'dismissed';
  impact_score?: number;
  effort_score?: number;
}

// Conversation metadata
export interface AdvisorConversation {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  topic: AdvisorTopic;
  message_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// System Prompt
// =============================================================================

export const ADVISOR_SYSTEM_PROMPT = `You are an AI advisor for solo founders and small business owners. You provide practical, actionable advice tailored to bootstrapped and small-scale operations.

Your expertise covers:
- Marketing & Growth: SEO, content marketing, social media, paid ads, viral growth
- Sales: Outreach, pricing, objection handling, closing deals
- Product: MVP development, feature prioritization, user feedback
- Finance: Cash flow, pricing models, bootstrapping, fundraising
- Operations: Automation, tools, processes, time management
- Strategy: Positioning, competition, market analysis

Guidelines:
1. Be concise and actionable - give specific next steps
2. Consider the resource constraints of solo founders
3. Prioritize high-impact, low-effort tactics
4. Share relevant examples and frameworks
5. Ask clarifying questions when needed
6. Be honest about tradeoffs and risks

Remember: The user is likely time-poor and resource-constrained. Focus on what they can actually implement.`;

// =============================================================================
// Helper Functions
// =============================================================================

export function buildContextPrompt(context: AdvisorContext): string {
  const parts: string[] = [];
  
  if (context.businessType) {
    parts.push(`Business Type: ${context.businessType}`);
  }
  
  if (context.stage) {
    parts.push(`Stage: ${context.stage}`);
  }
  
  if (context.monthlyRevenue !== undefined) {
    parts.push(`Monthly Revenue: $${context.monthlyRevenue.toLocaleString()}`);
  }
  
  if (context.teamSize !== undefined) {
    parts.push(`Team Size: ${context.teamSize}`);
  }
  
  if (context.industry) {
    parts.push(`Industry: ${context.industry}`);
  }
  
  if (context.targetMarket) {
    parts.push(`Target Market: ${context.targetMarket}`);
  }
  
  if (context.currentChallenges?.length) {
    parts.push(`Current Challenges: ${context.currentChallenges.join(', ')}`);
  }
  
  if (context.goals?.length) {
    parts.push(`Goals: ${context.goals.join(', ')}`);
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `\n\nBusiness Context:\n${parts.join('\n')}`;
}

// Topic labels for display
export const ADVISOR_TOPIC_LABELS: Record<AdvisorTopic, string> = {
  general: 'General',
  marketing: 'Marketing',
  sales: 'Sales',
  product: 'Product',
  finance: 'Finance',
  operations: 'Operations',
  growth: 'Growth',
  strategy: 'Strategy',
  hiring: 'Hiring',
  fundraising: 'Fundraising',
};

// Topic icons (for use with lucide-react)
export const ADVISOR_TOPIC_ICONS: Record<AdvisorTopic, string> = {
  general: 'MessageSquare',
  marketing: 'Megaphone',
  sales: 'DollarSign',
  product: 'Package',
  finance: 'Wallet',
  operations: 'Settings',
  growth: 'TrendingUp',
  strategy: 'Target',
  hiring: 'Users',
  fundraising: 'Banknote',
};
