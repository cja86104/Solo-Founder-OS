'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Brain, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  ADVISOR_TOPIC_LABELS,
  type AdvisorMessage,
  type AdvisorTopic,
} from '@/types/advisor';

interface AdvisorChatProps {
  workspaceId: string;
  conversationId: string | null;
  messages: AdvisorMessage[];
  onConversationCreated: (id: string) => void;
  onMessageSent: () => void;
}

export function AdvisorChat({
  workspaceId,
  conversationId,
  messages,
  onConversationCreated,
  onMessageSent,
}: AdvisorChatProps) {
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState<AdvisorTopic>('general');
  const [sending, setSending] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setInput('');
    setSending(true);
    setFollowUps([]);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          conversation_id: conversationId,
          message: messageText,
          topic,
          include_suggestions: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }

      const data = await res.json();

      if (!conversationId && data.conversation_id) {
        onConversationCreated(data.conversation_id);
      }

      if (data.follow_up_questions?.length) {
        setFollowUps(data.follow_up_questions);
      }

      onMessageSent();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get response';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !sending ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Brain className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">AI Advisor</h3>
            <p className="text-sm max-w-md">
              Ask questions about marketing, sales, product, finance, or any
              aspect of building your business.
            </p>
          </div>
        ) : (
          <>
            {messages
              .filter((m) => m.role !== 'system')
              .map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            {sending && (
              <div className="flex gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-52" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Follow-up questions */}
        {followUps.length > 0 && !sending && (
          <div className="flex flex-wrap gap-2 pt-2">
            {followUps.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex items-end gap-2"
      >
        <Select
          value={topic}
          onValueChange={(v) => setTopic(v as AdvisorTopic)}
        >
          <SelectTrigger className="w-[130px] shrink-0 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ADVISOR_TOPIC_LABELS) as [AdvisorTopic, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI advisor..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={!input.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
