'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from '@/components/TopNav';
import { Sidebar } from '@/components/Sidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageComposer } from '@/components/MessageComposer';
import { CitationDrawer } from '@/components/CitationDrawer';
import { AnalyticsView } from '@/components/AnalyticsView';
import { AgentQueueView } from '@/components/AgentQueueView';
import { KnowledgeAdminView } from '@/components/KnowledgeAdminView';
import { KnowledgeMeshHero } from '@/components/vectors/KnowledgeMeshHero';
import {
  INITIAL_CONVERSATIONS,
  STARTER_PROMPTS,
  ConversationItem,
  Message,
  Citation,
  ClarificationOption,
  UserRole,
  PERSONAS,
} from '@/lib/demoFixtures';
import { KeyRound, CreditCard, Wrench, Compass } from 'lucide-react';

let globalIdSeq = 1000;
function createUniqueId(prefix: string): string {
  globalIdSeq += 1;
  return `${prefix}_${Date.now()}_${globalIdSeq}`;
}

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync theme with html element
  useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const activePersona = PERSONAS[currentRole];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, activeConversation?.messages?.length, isProcessing, thinkingStage]);

  const handleNewChat = () => {
    const newId = createUniqueId('conv');
    const newConv: ConversationItem = {
      id: newId,
      title: 'New inquiry',
      status: 'open',
      domainKey: 'it',
      updatedAt: 'Just now',
      messages: [],
    };
    setConversations([newConv, ...conversations]);
    setActiveConvId(newId);
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id && remaining.length > 0) {
      setActiveConvId(remaining[0].id);
    }
  };

  const handleSendMessage = (text: string, attachment?: { name: string; size: string; type: string }) => {
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

    const updatedMessages = [...activeConversation.messages, userMsg];
    updateActiveConversation(updatedMessages);
    setIsProcessing(true);
    setThinkingStage(0);

    // Multi-step progressive thinking stages
    setTimeout(() => {
      setThinkingStage(1);
    }, 450);

    setTimeout(() => {
      setThinkingStage(2);
    }, 900);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let assistantMsg: Message;
      const respTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (lower.includes('password') || lower.includes('eduroam') || lower.includes('login') || lower.includes('wi-fi')) {
        assistantMsg = {
          id: createUniqueId('asst'),
          role: 'assistant',
          domain: 'it',
          domainLabel: 'IT Support',
          confidence: 0.96,
          timestamp: respTimestamp,
          content: 'You can reset your university password and re-issue your **Eduroam Wi-Fi certificate** through the Identity Management self-service portal [1]. Once updated, credentials synchronize across all campus networks within **3 minutes**.',
          portalLink: {
            label: 'Open Password Reset Portal (iam.example.edu)',
            url: 'https://iam.example.edu/reset',
          },
          citations: [
            {
              id: createUniqueId('cit'),
              marker: '[1]',
              title: 'IT Account Recovery Guide (v2026.1)',
              section: 'Section 2.1: Self-Service Identity Management',
              version: 'v2026.1',
              excerpt: 'Students and faculty may reset expired or compromised Active Directory credentials via the Identity & Access Management (IAM) self-service portal.',
              groundingScore: 0.99,
              custodian: 'Central IT Network & Security Services',
            },
          ],
        };
      } else if (lower.includes('submarine') || lower.includes('marine') || lower.includes('off-campus')) {
        assistantMsg = {
          id: createUniqueId('asst'),
          role: 'assistant',
          domain: 'administration',
          domainLabel: 'Department Escalation',
          confidence: 0.28,
          timestamp: respTimestamp,
          content: 'I could not find official university documentation regarding research submarine leases in our published institutional corpus. Rather than guessing, I have routed your inquiry directly to the **Registrar & Academic Administration** for human assistance.',
          handoff: {
            ticketId: '#HND-9921',
            department: 'Office of the Registrar / Academic Administration',
            reason: 'Specialty Asset Inquiry',
          },
        };
      } else if (lower.includes('account') && lower.includes('problem')) {
        assistantMsg = {
          id: createUniqueId('asst'),
          role: 'assistant',
          domain: 'it',
          domainLabel: 'Disambiguation',
          confidence: 0.52,
          timestamp: respTimestamp,
          content: 'Your question touches both technical campus login access and student fee accounts. Please choose the option that matches what you need:',
          clarification: {
            prompt: 'Which account are you experiencing issues with?',
            options: [
              {
                id: 'opt-it',
                label: 'Campus Wi-Fi, Portal & Email Login (IT Support)',
                domain: 'it',
              },
              {
                id: 'opt-fin',
                label: 'Tuition Fee Balance & Payment Dues (Finance & Accounts)',
                domain: 'finance',
              },
            ],
          },
        };
      } else {
        assistantMsg = {
          id: createUniqueId('asst'),
          role: 'assistant',
          domain: 'finance',
          domainLabel: 'Finance & Student Accounts',
          confidence: 0.93,
          timestamp: respTimestamp,
          content: 'University NEFT/RTGS electronic fund transfers require **24 to 48 banking business hours** to reconcile into the Student Information System (SIS) ledger [1]. If payment was made within this window, pending status is standard settlement latency.',
          checklist: [
            'Verify the 16-digit **UTR transaction reference number** on your payment receipt.',
            'Download the provisional payment confirmation slip from the Finance Portal.',
            'Check real-time clearance status under "Fee Dues & History".',
          ],
          citations: [
            {
              id: createUniqueId('cit'),
              marker: '[1]',
              title: 'Fee Payment & Refund Policy (v2026.1)',
              section: 'Section 3.2: Payment Reconciliation SLAs',
              version: 'v2026.1',
              excerpt: 'All electronic fund transfers require an automated clearinghouse settlement cycle of 24 to 48 banking business hours before reconciliation into the Student SIS Ledger.',
              groundingScore: 0.98,
              custodian: 'Office of the University Bursar & Comptroller',
            },
          ],
          followUps: [
            'What if my fee payment is still pending after 48 hours?',
            'Where do I upload the bank payment proof?',
          ],
        };
      }

      updateActiveConversation([...updatedMessages, assistantMsg]);
      setIsProcessing(false);
    }, 1350);
  };

  const updateActiveConversation = (messages: Message[]) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages,
              title: messages[0]?.content.slice(0, 36) || c.title,
            }
          : c
      )
    );
  };

  const handleSelectClarification = (option: ClarificationOption) => {
    handleSendMessage(`I need help with: ${option.label}`);
  };

  const getPromptIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <KeyRound className="w-4 h-4 text-[var(--accent)]" />;
      case 1:
        return <CreditCard className="w-4 h-4 text-[var(--accent)]" />;
      case 2:
        return <Wrench className="w-4 h-4 text-[var(--accent)]" />;
      default:
        return <Compass className="w-4 h-4 text-[var(--accent)]" />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden transition-colors duration-200">
      {/* Top App Bar with Persona & Theme Switchers */}
      <TopNav
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentTheme={currentTheme}
        onToggleTheme={toggleTheme}
        onNewChat={handleNewChat}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace - Persona Tailored Views */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 1. STUDENT VIEW: Pure conversational interface */}
        {currentRole === 'student' && (
          <>
            {/* Navigation Drawer */}
            <Sidebar
              conversations={conversations}
              activeId={activeConvId}
              onSelectConversation={setActiveConvId}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              persona={activePersona}
              onDeleteConversation={handleDeleteConversation}
            />

            {/* Conversational Stream */}
            <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[var(--background)] relative min-w-0 transition-all duration-200">
              <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
                <div className="max-w-2xl mx-auto w-full">
                  {activeConversation.messages.length === 0 ? (
                    /* Minimal Clean Student Empty State with Vector Knowledge Mesh */
                    <div className="py-8 sm:py-12 text-center space-y-6 animate-in fade-in duration-200">
                      {/* Architectural Vector Network Graphic */}
                      <KnowledgeMeshHero className="mb-1" />

                      <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)] tracking-tight">
                          How can we help you today?
                        </h1>

                        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                          Ask any question across campus services to get routed and resolved.
                        </p>
                      </div>

                      {/* Clean Suggestion Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2 text-left">
                        {STARTER_PROMPTS.slice(0, 4).map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(prompt.text)}
                            className="p-4 rounded-2xl bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-all text-xs flex flex-col justify-between gap-3 group cursor-pointer border border-[var(--border-subtle)] hover:border-[var(--border-medium)]"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-secondary)]">
                                {getPromptIcon(idx)}
                              </div>
                              <span className="text-xs text-[var(--text-tertiary)] capitalize">
                                {prompt.domain}
                              </span>
                            </div>
                            <span className="text-sm text-[var(--foreground)] leading-snug font-normal">
                              {prompt.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Message Thread */
                    <div className="pb-4">
                      {activeConversation.messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          onOpenCitation={setSelectedCitation}
                          onSelectClarification={handleSelectClarification}
                          onSelectFollowUp={handleSendMessage}
                        />
                      ))}

                      {/* Minimal Thinking Indicator */}
                      {isProcessing && (
                        <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] my-5 pl-1 animate-in fade-in duration-150">
                          <span className="w-2 h-2 rounded-full bg-[var(--foreground)] animate-pulse" />
                          <span>Checking university evidence &amp; routing...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Pill Message Composer */}
              <MessageComposer
                onSendMessage={handleSendMessage}
                disabled={isProcessing}
              />
            </main>

            {/* Slide-out Citation Drawer */}
            <CitationDrawer
              citation={selectedCitation}
              onClose={() => setSelectedCitation(null)}
            />
          </>
        )}

        {/* 2. CAMPUS SUPPORT AGENT VIEW: Dedicated Triage & Escalations Queue */}
        {currentRole === 'agent' && <AgentQueueView />}

        {/* 3. KNOWLEDGE ADMIN VIEW: Registrar & Knowledge Base Corpus Management */}
        {currentRole === 'knowledge_admin' && <KnowledgeAdminView />}

        {/* 4. EXECUTIVE & EVALUATOR VIEW: Operational Telemetry & 5x5 Matrix */}
        {currentRole === 'executive' && <AnalyticsView />}
      </div>
    </div>
  );
}
