'use client';

import { useState, useCallback, useEffect } from 'react';
import { ConversationItem, Message, ClarificationOption, Citation, HandoffTicket } from '@/types';
import { INITIAL_CONVERSATIONS } from '@/lib/demoFixtures';
import { createUniqueId } from '@/lib/utils';
import {
  sendChatMessageApi,
  sendChatMessageStreamApi,
  BackendChatResponse,
  loginWithApi,
  fetchChatHistoryApi,
  fetchUserConversationsApi,
  createConversationApi,
  deleteConversationApi,
  updateConversationApi,
  SEEDED_CREDENTIALS,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export interface UseChatOptions {
  initialConversations?: ConversationItem[];
  defaultActiveId?: string;
}

function parseBackendAnswer(answer: string): { content: string; checklist?: string[] } {
  if (!answer) return { content: '' };

  const trimmed = answer.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      let content = '';
      if (typeof parsed.answer === 'string') {
        content = parsed.answer;
      }
      let checklist: string[] | undefined = undefined;
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        checklist = parsed.steps.map((s: unknown) => String(s));
        if (!content) {
          content = 'Please follow these steps:';
        }
      }
      if (content) {
        return { content, checklist };
      }
    } catch {
      // Fall through to plain text
    }
  }

  return { content: answer };
}

function mapBackendResponseToMessage(
  data: BackendChatResponse,
  timestamp: string
): Message {
  const { content, checklist } = parseBackendAnswer(data.answer);

  const rawDomain = (data.detected_domains?.[0] || data.intent || 'it').toLowerCase();
  let domain: 'it' | 'finance' | 'facilities' | 'academics' | 'administration' = 'it';
  let domainLabel = 'IT Support';

  if (rawDomain.includes('it') || rawDomain.includes('network') || rawDomain.includes('tech')) {
    domain = 'it';
    domainLabel = 'IT Support';
  } else if (
    rawDomain.includes('fee') ||
    rawDomain.includes('finance') ||
    rawDomain.includes('bursar') ||
    rawDomain.includes('account')
  ) {
    domain = 'finance';
    domainLabel = 'Student Accounts & Finance';
  } else if (
    rawDomain.includes('facilit') ||
    rawDomain.includes('mainten') ||
    rawDomain.includes('housing') ||
    rawDomain.includes('dorm')
  ) {
    domain = 'facilities';
    domainLabel = 'Campus Facilities';
  } else if (
    rawDomain.includes('acad') ||
    rawDomain.includes('course') ||
    rawDomain.includes('exam')
  ) {
    domain = 'academics';
    domainLabel = 'Academic Services';
  } else {
    domain = 'administration';
    domainLabel = 'Campus Administration';
  }

  const citations: Citation[] = (data.retrieved_chunks || []).map((chunk, idx) => {
    const pageNum = chunk.page ?? (chunk.metadata?.page as number | string | undefined);
    const pageStr = pageNum !== undefined ? `Page ${pageNum}` : `Section ${idx + 1}`;
    const docTitle = String(chunk.metadata?.document_name || chunk.source || 'Institutional Policy Document');
    return {
      id: String(chunk.metadata?.chunk_id || createUniqueId('cit')),
      marker: `[${idx + 1}]`,
      title: docTitle,
      section: pageStr,
      version: 'v2026.1',
      excerpt: chunk.content,
      groundingScore: data.routing_confidence || 0.95,
      sourceUri: chunk.source,
      custodian: domainLabel,
      authority: (chunk.metadata?.authority as string) || domainLabel,
      effectiveDate: (chunk.metadata?.effective_date as string) || (chunk.metadata?.version as string) || undefined,
      recordId: String(chunk.metadata?.chunk_id || `DOC-${idx + 1}`),
      matchScore: `${Math.round((data.routing_confidence || 0.95) * 100)}% Match`,
      mandateStatus: 'Active Policy',
      ferpaCompliant: true,
    };
  });

  let routingCard = undefined;
  if (checklist && checklist.length > 0) {
    routingCard = {
      departmentTitle: `${domainLabel} — Official Protocol`,
      routingTag: `• ROUTING TO: ${domainLabel.toUpperCase()}`,
      summary: content,
      steps: checklist.map((item, idx) => ({
        stepNumber: idx + 1,
        title: `Step ${idx + 1}`,
        description: item,
      })),
      sourceLabel: citations[0]?.title || `Institutional Knowledge Base (${domainLabel})`,
      portalAction: {
        label: `Open ${domainLabel} Portal`,
        url: '#',
      },
      proactiveNote: 'I can assist you in filing this request directly through your student profile.',
    };
  }

  let handoff: HandoffTicket | undefined = undefined;
  if (data.ticket_id || data.ticket) {
    const ticketObj = (data.ticket || {}) as Record<string, string | undefined>;
    handoff = {
      ticketId: data.ticket_id || ticketObj.ticket_id || 'TKT-PENDING',
      department: ticketObj.department || domainLabel,
      reason: ticketObj.escalation_reason || data.handoff_reason || 'Requires manual specialist assistance',
      urgency: ticketObj.priority?.toLowerCase() === 'urgent' ? 'urgent' : 'high',
      createdAt: 'Just now',
      status: 'pending',
      preview: ticketObj.issue_summary || data.handoff_reason || 'Specialist escalation created.',
    };
  }

  let clarification = undefined;
  const rawOptions =
    (data as any).clarification_options ||
    data.metadata?.clarification_options ||
    (data.metadata as any)?.options;
  const hasRawOptions = Array.isArray(rawOptions) && rawOptions.length > 0;
  const isClarification =
    hasRawOptions ||
    data.intent === 'clarify' ||
    data.metadata?.outcome === 'clarification' ||
    content.toLowerCase().includes('clarify') ||
    content.toLowerCase().includes('which of the following') ||
    content.toLowerCase().includes('which area can i help');

  if (isClarification) {
    let options;
    if (hasRawOptions) {
      options = rawOptions.map((opt: any) => ({
        id: opt.id || opt.label.toLowerCase().replace(/\s+/g, '_'),
        label: opt.label,
        domain: (opt.department || opt.domain || '').toLowerCase(),
      }));
    } else {
      const candidates = data.detected_domains?.length
        ? data.detected_domains
        : ['Academics', 'IT Support', 'Student Life', 'Finance'];
      options = candidates.map((d) => ({
        id: d.toLowerCase().replace(/\s+/g, '_'),
        label: d,
        domain: d.toLowerCase(),
      }));
    }
    clarification = {
      prompt: content,
      options,
    };
  }

  return {
    id: createUniqueId('asst'),
    role: 'assistant',
    domain,
    domainLabel,
    confidence: data.routing_confidence || 0.92,
    timestamp,
    content,
    checklist,
    citations: citations.length > 0 ? citations : undefined,
    handoff,
    clarification,
    routingCard,
  };
}

function mapHistoryMessageToMessage(
  m: any,
  idx: number,
  globalMeta?: Record<string, any>,
  globalIntent?: string,
  isLastAssistant = false
): Message {
  if (m.role === 'user') {
    return {
      id: `backend-msg-user-${idx}`,
      role: 'user',
      content: m.content,
      timestamp: 'Earlier',
    };
  }

  const meta = m.metadata || (isLastAssistant ? globalMeta : undefined) || {};
  const intent = m.intent || (isLastAssistant ? globalIntent : undefined) || meta.outcome;
  const chunks = m.retrieved_chunks || [];
  const ticketId = m.ticket_id || meta.ticket_id;
  const domains = m.detected_domains || (meta.detected_domains as string[]) || [];

  const chatResp: BackendChatResponse = {
    answer: m.content,
    thread_id: '',
    ticket_id: ticketId,
    ticket: (meta.ticket as Record<string, unknown>) || null,
    detected_domains: domains,
    intent,
    routing_confidence: m.routing_confidence || 0.92,
    solved: !intent?.includes('clarify') && !ticketId,
    human_required: !!ticketId,
    sources: m.sources || [],
    retrieved_chunks: chunks,
    metadata: meta,
  };

  const mapped = mapBackendResponseToMessage(chatResp, 'Earlier');
  return {
    ...mapped,
    id: `backend-msg-asst-${idx}`,
  };
}

export function useChat({
  initialConversations = INITIAL_CONVERSATIONS,
  defaultActiveId,
}: UseChatOptions = {}) {
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return defaultActiveId || initialConversations[0]?.id || 'conv-1';
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<number>(0);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || {
      id: activeConvId,
      title: 'New inquiry',
      status: 'open',
      domainKey: 'it',
      updatedAt: 'Just now',
      messages: [],
    };

  // Hydrate persistent conversations from backend when user is authenticated
  useEffect(() => {
    if (!accessToken) {
      setConversations(initialConversations);
      return;
    }
    let isCancelled = false;

    fetchUserConversationsApi(accessToken)
      .then(async (userConvs) => {
        if (isCancelled) return;

        if (userConvs && userConvs.length > 0) {
          const targetActiveId =
            defaultActiveId && userConvs.some((c) => c.id === defaultActiveId)
              ? defaultActiveId
              : userConvs[0].id;

          setActiveConvId(targetActiveId);

          // Preload messages for initial active conversation
          try {
            const history = await fetchChatHistoryApi(accessToken, targetActiveId);
            if (isCancelled) return;
            const rawMsgs = history.messages || [];
            const lastAsstIdx = rawMsgs.map((m) => m.role).lastIndexOf('assistant');
            const loadedMessages: Message[] = rawMsgs.map((m, idx) =>
              mapHistoryMessageToMessage(
                m,
                idx,
                history.metadata,
                history.intent,
                idx === lastAsstIdx
              )
            );

            setConversations(
              userConvs.map((c) =>
                c.id === targetActiveId ? { ...c, messages: loadedMessages } : c
              )
            );
          } catch {
            setConversations(userConvs);
          }
        } else {
          // New student without history: create fresh empty session
          const freshId = createUniqueId('conv');
          const emptyConv: ConversationItem = {
            id: freshId,
            title: 'New inquiry',
            status: 'open',
            domainKey: 'it',
            updatedAt: 'Just now',
            messages: [],
          };
          setConversations([emptyConv]);
          setActiveConvId(freshId);
        }
      })
      .catch((err) => {
        console.warn('Could not load user conversations from backend:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, defaultActiveId, initialConversations]);

  const selectConversation = useCallback(
    async (convId: string) => {
      setActiveConvId(convId);
      const target = conversations.find((c) => c.id === convId);
      if (accessToken && target && target.messages.length === 0) {
        try {
          const history = await fetchChatHistoryApi(accessToken, convId);
          if (history.messages && history.messages.length > 0) {
            const rawMsgs = history.messages;
            const lastAsstIdx = rawMsgs.map((m) => m.role).lastIndexOf('assistant');
            const loadedMessages: Message[] = rawMsgs.map((m, idx) =>
              mapHistoryMessageToMessage(
                m,
                idx,
                history.metadata,
                history.intent,
                idx === lastAsstIdx
              )
            );

            setConversations((prev) =>
              prev.map((c) =>
                c.id === convId ? { ...c, messages: loadedMessages } : c
              )
            );
          }
        } catch (err) {
          console.error('Failed to load conversation history for thread:', convId, err);
        }
      }
    },
    [accessToken, conversations]
  );

  const updateActiveConversation = useCallback(
    (messages: Message[]) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === activeConvId);
        if (exists) {
          return prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  messages,
                  title:
                    c.title === 'New inquiry'
                      ? messages[0]?.content.slice(0, 36) || c.title
                      : c.title,
                  updatedAt: 'Just now',
                }
              : c
          );
        }
        return [
          {
            id: activeConvId,
            title: messages[0]?.content.slice(0, 36) || 'New inquiry',
            status: 'open',
            domainKey: 'it',
            updatedAt: 'Just now',
            messages,
          },
          ...prev,
        ];
      });
    },
    [activeConvId]
  );

  const handleNewChat = useCallback(async () => {
    const newId = createUniqueId('conv');
    const newConv: ConversationItem = {
      id: newId,
      title: 'New inquiry',
      status: 'open',
      domainKey: 'it',
      updatedAt: 'Just now',
      messages: [],
    };

    // Optimistically prepend new chat while preserving all previous conversations
    setConversations((prev) => {
      const filtered = prev.filter(
        (c) => c.id !== newId && (c.messages.length > 0 || c.title !== 'New inquiry')
      );
      return [newConv, ...filtered];
    });
    setActiveConvId(newId);

    if (accessToken) {
      try {
        await createConversationApi(accessToken, { id: newId, title: 'New inquiry' });
        const remoteConvs = await fetchUserConversationsApi(accessToken);
        setConversations((prev) => {
          const msgMap = new Map(prev.map((c) => [c.id, c.messages]));
          const remoteIds = new Set(remoteConvs.map((r) => r.id));
          const localOnly = prev.filter((p) => !remoteIds.has(p.id));
          const merged = remoteConvs.map((rc) => ({
            ...rc,
            messages: msgMap.get(rc.id) || rc.messages || [],
          }));
          return [...localOnly, ...merged];
        });
      } catch (err) {
        console.warn('Initial backend conversation registration notice:', err);
      }
    }
  }, [accessToken]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      if (accessToken) {
        try {
          await deleteConversationApi(accessToken, id);
        } catch (err) {
          console.error('Failed to delete conversation from backend:', err);
        }
      }

      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (remaining.length === 0) {
          const freshId = createUniqueId('conv');
          setActiveConvId(freshId);
          return [
            {
              id: freshId,
              title: 'New inquiry',
              status: 'open',
              domainKey: 'it',
              updatedAt: 'Just now',
              messages: [],
            },
          ];
        }
        if (activeConvId === id) {
          setActiveConvId(remaining[0].id);
        }
        return remaining;
      });
    },
    [accessToken, activeConvId]
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

      let token = accessToken;
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('campusone_access_token');
      }

      if (!token) {
        try {
          const auth = await loginWithApi(SEEDED_CREDENTIALS.student);
          if (auth?.access_token) {
            token = auth.access_token;
            if (typeof window !== 'undefined') {
              localStorage.setItem('campusone_access_token', auth.access_token);
              localStorage.setItem('campusone_refresh_token', auth.refresh_token);
            }
          }
        } catch {
          // If login fails, will be caught below
        }
      }

      const stageTimer1 = setTimeout(() => setThinkingStage(1), 600);
      const stageTimer2 = setTimeout(() => setThinkingStage(2), 1300);

      try {
        let assistantMsg: Message;
        if (!token) {
          assistantMsg = {
            id: createUniqueId('asst'),
            role: 'assistant',
            domain: 'it',
            domainLabel: 'Authentication Notice',
            confidence: 1.0,
            timestamp,
            content: 'Unable to authenticate with the campus service. Please check your backend connection and try again.',
          };
        } else {
          try {
            const backendRes = await sendChatMessageStreamApi(
              token,
              text,
              activeConvId,
              {
                onStage: (stageInfo) => {
                  if (stageInfo.stage === 'routing') setThinkingStage(1);
                  else if (stageInfo.stage === 'retrieving') setThinkingStage(2);
                  else if (stageInfo.stage === 'synthesizing') setThinkingStage(2);
                },
              }
            );
            assistantMsg = mapBackendResponseToMessage(backendRes, timestamp);
          } catch (apiErr) {
            console.error('Backend chat API request failed:', apiErr);
            const errStr = apiErr instanceof Error ? apiErr.message : String(apiErr);
            assistantMsg = {
              id: createUniqueId('asst'),
              role: 'assistant',
              domain: 'it',
              domainLabel: 'Service Notice',
              confidence: 1.0,
              timestamp,
              content: `Service communication error: ${errStr}. Please check that the backend is responding.`,
            };
          }
        }

        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        updateActiveConversation([...baseMessages, assistantMsg]);

        // Dynamically synchronize the sidebar conversation index with the backend
        if (token) {
          fetchUserConversationsApi(token)
            .then((remoteConvs) => {
              setConversations((prev) => {
                const msgMap = new Map(prev.map((c) => [c.id, c.messages]));
                return remoteConvs.map((rc) => ({
                  ...rc,
                  messages: msgMap.get(rc.id) || rc.messages || [],
                }));
              });
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Failed to generate assistant response', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [accessToken, activeConvId, activeConversation.messages, isProcessing, updateActiveConversation]
  );

  const togglePin = useCallback(
    async (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (!conv) return;
      const nextPinned = !conv.pinned;

      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned: nextPinned } : c))
      );

      if (accessToken) {
        try {
          await updateConversationApi(accessToken, id, { pinned: nextPinned });
        } catch (err) {
          console.error('Failed to update pinned state on backend:', err);
        }
      }
    },
    [accessToken, conversations]
  );

  const selectClarification = useCallback(
    (option: ClarificationOption) => {
      const deptSuffix = option.domain ? ` [${option.domain.toUpperCase()}]` : '';
      sendMessage(`I need help with: ${option.label}${deptSuffix}`);
    },
    [sendMessage]
  );

  return {
    conversations,
    activeConvId,
    setActiveConvId: selectConversation,
    activeConversation,
    isProcessing,
    thinkingStage,
    sendMessage,
    newChat: handleNewChat,
    deleteConversation: handleDeleteConversation,
    togglePin,
    selectClarification,
  };
}

