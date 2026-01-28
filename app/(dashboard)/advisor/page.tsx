'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain } from 'lucide-react';
import { toast } from 'sonner';
import type { AdvisorConversation, AdvisorMessage } from '@/types/advisor';
import { ConversationList } from '@/components/advisor/conversation-list';
import { AdvisorChat } from '@/components/advisor/advisor-chat';

export default function AdvisorPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  const [conversations, setConversations] = useState<AdvisorConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const params = new URLSearchParams({
        workspace_id: currentWorkspace.id,
      });
      if (topicFilter !== 'all') params.set('topic', topicFilter);

      const res = await fetch(`/api/advisor?${params}`);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, topicFilter]);

  const fetchMessages = useCallback(
    async (convId: string) => {
      if (!currentWorkspace) return;
      setMessagesLoading(true);
      try {
        const params = new URLSearchParams({
          workspace_id: currentWorkspace.id,
          conversation_id: convId,
        });
        const res = await fetch(`/api/advisor?${params}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        toast.error('Failed to load messages');
      } finally {
        setMessagesLoading(false);
      }
    },
    [currentWorkspace]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, fetchMessages]);

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
  };

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleConversationCreated = (id: string) => {
    setActiveConvId(id);
    fetchConversations();
  };

  const handleMessageSent = () => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
    fetchConversations();
  };

  if (workspaceLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">
            Select a workspace to use the AI Advisor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" />
          AI Advisor
        </h1>
        <p className="text-sm text-muted-foreground">
          Get personalized advice for your business
        </p>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-72 shrink-0">
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            topicFilter={topicFilter}
            onTopicFilter={setTopicFilter}
          />
        </div>
        {/* Chat area */}
        <div className="flex-1 min-w-0">
          {messagesLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-12 w-2/3" />
            </div>
          ) : (
            <AdvisorChat
              workspaceId={currentWorkspace.id}
              conversationId={activeConvId}
              messages={messages}
              onConversationCreated={handleConversationCreated}
              onMessageSent={handleMessageSent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
