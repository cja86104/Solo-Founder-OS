'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MessageSquare } from 'lucide-react';
import type { AdvisorConversation, AdvisorTopic } from '@/types/advisor';
import { ADVISOR_TOPIC_LABELS } from '@/types/advisor';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: AdvisorConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  topicFilter: string;
  onTopicFilter: (topic: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  topicFilter,
  onTopicFilter,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 space-y-3 border-b">
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
        <Select value={topicFilter} onValueChange={onTopicFilter}>
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder="Filter by topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {(Object.entries(ADVISOR_TOPIC_LABELS) as [AdvisorTopic, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                  activeId === conv.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{conv.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {ADVISOR_TOPIC_LABELS[conv.topic]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {conv.last_message_at
                          ? formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                            })
                          : formatDistanceToNow(new Date(conv.created_at), {
                              addSuffix: true,
                            })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
