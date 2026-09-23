'use client';

import { useState, useCallback } from 'react';
import { ConversationItem, Message, ClarificationOption, ChatApiResponse } from '@/types';
import { INITIAL_CONVERSATIONS } from '@/lib/demoFixtures';
import { createUniqueId } from '@/lib/utils';
import { sendChatMessage } from '@/lib/api';

export interface UseChatOptions {
  initialConversations?: ConversationItem[];
  defaultActiveId?: string;
  accessToken?: string | null;
}

export function useChat({
  initialConversations = INITIAL_CONVERSATIONS,
  defaultActiveId = 'conv-1',
  accessToken = null,
}: UseChatOptions = {}) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string>(defaultActiveId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<number>(0);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0] || {
      id: 'default',
      title: 'New inquiry',
      status: 'open',
      domainKey: 'it',
      updatedAt: 'Just now',
      messages: [],
    };

  const updateActiveConversation = useCallback(
    (messages: Message[], conversationId?: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                id: conversationId || c.id,
                messages,
                title: messages[0]?.content.slice(0, 36) || c.title,
                updatedAt: 'Just now',
              }
            : c
        )
      );
      if (conversationId && conversationId !== activeConvId) {
        setActiveConvId(conversationId);
      }
    },
    [activeConvId]
  );

  const handleNewChat = useCallback(() => {
    const newId = createUniqueId('conv');
    const newConv: ConversationItem = {
      id: newId,
      title: 'New inquiry',
      status: 'open',
      domainKey: 'it',
      updatedAt: 'Just now',
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (remaining.length === 0) {
          const freshId = createUniqueId('conv');
          const freshConv: ConversationItem = {
            id: freshId,
            title: 'New inquiry',
            status: 'open',
            domainKey: 'it',
            updatedAt: 'Just now',
            messages: [],
          };
          setActiveConvId(freshId);
          return [freshConv];
        }
        if (activeConvId === id) {
          setActiveConvId(remaining[0].id);
        }
        return remaining;
      });
    },
    [activeConvId]
  );

  const sendMessage = useCallback(
    async (text: string, attachment?: { name: string; size: string; type: string }) => {
      if (!text.trim() && !attachment) return;
      if (isProcessing) return;

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsgText = attachment
        ? `${text}\n📎 [Attachment: ${attachment.name} (${attachment.size})]`
        : text;

      const userMsg: Message = {
        id: createUniqueId('msg'),
        role: 'user',
        content: userMsgText,
        timestamp,
      };

      const baseMessages = [...activeConversation.messages, userMsg];
      updateActiveConversation(baseMessages);
      setIsProcessing(true);
      setThinkingStage(0);

      // Simulate progressive thinking stages while backend request is in-flight
      const timer1 = setTimeout(() => setThinkingStage(1), 350);
      const timer2 = setTimeout(() => setThinkingStage(2), 700);

      try {
        const res: ChatApiResponse = await sendChatMessage(
          text,
          activeConvId,
          accessToken || undefined
        );

        clearTimeout(timer1);
        clearTimeout(timer2);

        // Map domain label
        let domainLabel = 'CampusOne';
        if (res.route_mode === 'multi' && res.domains.length > 1) {
          domainLabel = res.domains.map((d) => d.display_name).join(' + ');
        } else if (res.domains.length > 0) {
          domainLabel = res.domains[0].display_name;
        }

        // Map handoff if human assistance required
        let handoff = undefined;
        if (res.human_required) {
          const failingDept = res.domains.find((d) => d.human_required);
          handoff = {
            ticketId: createUniqueId('tkt'),
            department: failingDept?.display_name || res.department || 'Specialist Queue',
            reason: res.handoff_reason || 'Requires human department intervention',
            urgency: 'high' as const,
            status: 'pending' as const,
          };
        }

        // Map clarification if needed
        let clarification = undefined;
        if (res.requires_clarification && res.clarification_options?.length > 0) {
          clarification = {
            prompt: 'Please clarify which department or issue you are referring to:',
            options: res.clarification_options,
          };
        }

        const assistantMsg: Message = {
          id: createUniqueId('asst'),
          role: 'assistant',
          content: res.answer,
          domain: (res.department as any) || 'it',
          domainLabel,
          confidence: res.confidence,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: res.citations?.length ? res.citations : undefined,
          checklist: res.next_steps?.length ? res.next_steps : undefined,
          clarification,
          handoff,
        };

        updateActiveConversation([...baseMessages, assistantMsg], res.conversation_id);
      } catch (err: any) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        console.error('Chat API request failed:', err);

        let errorMessage = 'An unexpected error occurred while communicating with the campus orchestration engine.';
        if (err?.status === 401 || err?.status === 403) {
          errorMessage = '⚠️ **Authentication Error (401/403):** Your session is invalid or expired. Please sign in again to continue.';
        } else if (err?.status >= 500) {
          errorMessage = `⚠️ **Backend Service Error (${err.status}):** ${err.message || 'The orchestration engine encountered a server error.'} Please try again.`;
        } else if (
          err?.message?.includes('fetch') ||
          err?.message?.includes('network') ||
          err?.message?.includes('Failed to fetch') ||
          err?.name === 'TypeError'
        ) {
          errorMessage = '⚠️ **Connection Error:** Unable to reach the CampusOne backend server at http://localhost:8000. Please verify the FastAPI backend is running.';
        } else if (err?.message) {
          errorMessage = `⚠️ **Request Error:** ${err.message}`;
        }

        const errorMsg: Message = {
          id: createUniqueId('err'),
          role: 'system',
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        updateActiveConversation([...baseMessages, errorMsg]);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeConversation.messages, activeConvId, accessToken, isProcessing, updateActiveConversation]
  );

  const selectClarification = useCallback(
    (option: ClarificationOption) => {
      sendMessage(`I need help with: ${option.label}`);
    },
    [sendMessage]
  );

  return {
    conversations,
    activeConvId,
    setActiveConvId,
    activeConversation,
    isProcessing,
    thinkingStage,
    sendMessage,
    newChat: handleNewChat,
    deleteConversation: handleDeleteConversation,
    selectClarification,
  };
}
