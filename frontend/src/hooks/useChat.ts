'use client';

import { useState, useCallback } from 'react';
import { ConversationItem, Message, ClarificationOption } from '@/types';
import { INITIAL_CONVERSATIONS } from '@/lib/demoFixtures';
import { createUniqueId } from '@/lib/utils';
import { simulateAssistantResponse } from '@/lib/mockEngine';

export interface UseChatOptions {
  initialConversations?: ConversationItem[];
  defaultActiveId?: string;
}

export function useChat({
  initialConversations = INITIAL_CONVERSATIONS,
  defaultActiveId = 'conv-1',
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
    (messages: Message[]) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                messages,
                title: messages[0]?.content.slice(0, 36) || c.title,
                updatedAt: 'Just now',
              }
            : c
        )
      );
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

      try {
        const assistantMsg = await simulateAssistantResponse({
          text,
          onStageChange: (stage) => setThinkingStage(stage),
        });
        updateActiveConversation([...baseMessages, assistantMsg]);
      } catch (err) {
        console.error('Failed to generate assistant response', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeConversation.messages, isProcessing, updateActiveConversation]
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
