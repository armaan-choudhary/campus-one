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
import { Sparkles, ArrowRight, KeyRound, CreditCard, Wrench, Compass } from 'lucide-react';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
  }, [activeConvId, activeConversation?.messages?.length, isProcessing]);

  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`;
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

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...activeConversation.messages, userMsg];
    updateActiveConversation(updatedMessages);
    setIsProcessing(true);

    // Simulated orchestrator response matching runbook fixtures
    setTimeout(() => {
      const lower = text.toLowerCase();
      let assistantMsg: Message;

      if (lower.includes('password') || lower.includes('eduroam') || lower.includes('login') || lower.includes('wi-fi')) {
        assistantMsg = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          domain: 'it',
          domainLabel: 'IT Support',
          confidence: 0.96,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'You can reset your university password and re-issue your Eduroam certificate through the Identity Management self-service portal. Once updated, credentials synchronize across all campus networks within 3 minutes.',
          portalLink: {
            label: 'Open Password Reset Portal (iam.example.edu)',
            url: 'https://iam.example.edu/reset',
          },
          citations: [
            {
              id: `cit-${Date.now()}`,
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
          id: `asst-${Date.now()}`,
          role: 'assistant',
          domain: 'administration',
          domainLabel: 'Department Escalation',
          confidence: 0.28,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'I could not find official university documentation regarding research submarine leases in our published institutional corpus. Rather than guessing, I have routed your inquiry directly to the Registrar for human assistance.',
          handoff: {
            ticketId: '#HND-9921',
            department: 'Office of the Registrar / Academic Administration',
            reason: 'Specialty Asset Inquiry',
          },
        };
      } else if (lower.includes('account') && lower.includes('problem')) {
        assistantMsg = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          domain: 'it',
          domainLabel: 'Disambiguation',
          confidence: 0.52,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          id: `asst-${Date.now()}`,
          role: 'assistant',
          domain: 'finance',
          domainLabel: 'Finance & Student Accounts',
          confidence: 0.93,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'University NEFT/RTGS electronic fund transfers require 24 to 48 banking business hours to reconcile into the Student Information System (SIS) ledger. If payment was made within this window, pending status is standard settlement latency.',
          checklist: [
            'Verify the 16-digit UTR transaction reference number on your payment receipt.',
            'Download the provisional payment confirmation slip from the Finance Portal.',
            'Check real-time clearance status under "Fee Dues & History".',
          ],
          citations: [
            {
              id: `cit-${Date.now()}`,
              marker: '[1]',
              title: 'Fee Payment & Refund Policy (v2026.1)',
              section: 'Section 3.2: Payment Reconciliation SLAs',
              version: 'v2026.1',
              excerpt: 'All electronic fund transfers require an automated clearinghouse settlement cycle of 24 to 48 banking business hours before reconciliation into the Student SIS Ledger.',
              groundingScore: 0.98,
              custodian: 'Office of the University Bursar & Comptroller',
            },
          ],
        };
      }

      updateActiveConversation([...updatedMessages, assistantMsg]);
      setIsProcessing(false);
    }, 600);
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
      />

      {/* Main Workspace - Persona Tailored Views */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 1. STUDENT VIEW: Pure conversational interface with ZERO corporate stats */}
        {currentRole === 'student' && (
          <>
            {/* Minimalist Navigation Drawer */}
            <Sidebar
              conversations={conversations}
              activeId={activeConvId}
              onSelectConversation={setActiveConvId}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              persona={activePersona}
            />

            {/* Conversational Stream */}
            <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[var(--background)] relative">
              <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
                <div className="max-w-2xl mx-auto">
                  {activeConversation.messages.length === 0 ? (
                    /* Clean Gemini-Style Student Empty State */
                    <div className="py-10 sm:py-14 text-center space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-2.5">
                        <div className="inline-flex items-center justify-center w-14 h-14 mb-1">
                          <img
                            src={currentTheme === 'dark' ? '/logo.png' : '/logo-dark.png'}
                            alt="CampusOne"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)] tracking-tight">
                          Hello, Alex
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                          What can I help you resolve across campus today? Ask once and get routed to the right university department.
                        </p>
                      </div>

                      {/* Suggestion Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2 text-left">
                        {STARTER_PROMPTS.slice(0, 4).map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(prompt.text)}
                            className="p-4 rounded-2xl bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-all text-xs flex flex-col justify-between gap-3 group cursor-pointer shadow-xs border border-[var(--border-subtle)]"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                                {getPromptIcon(idx)}
                              </div>
                              <span className="text-[11px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
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
                    /* Message Thread with Balanced Vertical Spacing */
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
                      {isProcessing && (
                        <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] my-5 pl-1 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                          <span className="text-xs">CampusOne is checking 2026 institutional policies...</span>
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
