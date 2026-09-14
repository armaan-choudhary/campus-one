'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { Sidebar } from '@/components/Sidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageComposer } from '@/components/MessageComposer';
import { CitationDrawer } from '@/components/CitationDrawer';
import { AnalyticsView } from '@/components/AnalyticsView';
import { AgentQueueView } from '@/components/AgentQueueView';
import { KnowledgeAdminView } from '@/components/KnowledgeAdminView';
import { KnowledgeMeshHero } from '@/components/vectors/KnowledgeMeshHero';
import { CampusLoader } from '@/components/ui/CampusLoader';
import { useChat } from '@/hooks/useChat';
import { STARTER_PROMPTS, PERSONAS } from '@/lib/demoFixtures';
import { UserRole, Citation } from '@/types';
import { KeyRound, CreditCard, Wrench, Compass } from 'lucide-react';

interface WorkspaceContentProps {
  defaultRole: UserRole;
}

function WorkspaceContent({ defaultRole }: WorkspaceContentProps) {
  const [currentRole, setCurrentRole] = useState<UserRole>(defaultRole);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    activeConvId,
    setActiveConvId,
    activeConversation,
    isProcessing,
    sendMessage,
    newChat,
    deleteConversation,
    selectClarification,
  } = useChat();

  // Synchronize theme with html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('campusone-theme', next);
      return next;
    });
  };

  const activePersona = PERSONAS[currentRole];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, activeConversation?.messages?.length, isProcessing]);

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
        onNewChat={newChat}
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
              onDeleteConversation={deleteConversation}
            />

            {/* Conversational Stream */}
            <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[var(--background)] relative min-w-0 transition-all duration-200">
              <div
                role="log"
                aria-live="polite"
                aria-label="Conversation with CampusOne"
                className="flex-1 overflow-y-auto px-4 py-6 pb-24"
              >
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
                            onClick={() => sendMessage(prompt.text)}
                            className="p-4 rounded-2xl bg-[var(--surface-1)] hover:bg-[var(--surface-2)] hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]/40 active:scale-[0.98] transition-all duration-200 text-xs flex flex-col justify-between gap-3 group cursor-pointer border border-[var(--border-subtle)]"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
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
                          onSelectClarification={selectClarification}
                          onSelectFollowUp={sendMessage}
                        />
                      ))}

                      {/* Staged 3-Dot Thinking Indicator */}
                      {isProcessing && (
                        <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] my-5 pl-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="flex items-center gap-1 bg-[var(--surface-2)] px-3 py-1.5 rounded-full border border-[var(--border-subtle)] shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="text-[11px] text-[var(--text-secondary)] pl-2 font-medium">
                              Checking university evidence &amp; routing...
                            </span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Pill Message Composer */}
              <MessageComposer
                onSendMessage={sendMessage}
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

function WorkspaceWrapper() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole | null;
  const initialRole = roleParam && roleParam in PERSONAS ? roleParam : 'student';

  return <WorkspaceContent key={initialRole} defaultRole={initialRole} />;
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<CampusLoader fullscreen label="Loading CampusOne Workspace..." />}>
      <WorkspaceWrapper />
    </Suspense>
  );
}
