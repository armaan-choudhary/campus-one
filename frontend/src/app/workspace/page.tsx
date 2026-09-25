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
import { useAuth } from '@/context/AuthContext';
import { STARTER_PROMPTS, PERSONAS } from '@/lib/demoFixtures';
import { UserRole, Citation } from '@/types';
import { KeyRound, CreditCard, Wrench, Compass, ShieldAlert } from 'lucide-react';

interface WorkspaceContentProps {
  defaultRole: UserRole;
}

function WorkspaceContent({ defaultRole }: WorkspaceContentProps) {
  const { user, role: authRole, switchDemoPersona } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const currentRole = selectedRole ?? authRole ?? defaultRole;

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
    thinkingStage,
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
        onRoleChange={(r) => setSelectedRole(r)}
        currentTheme={currentTheme}
        onToggleTheme={toggleTheme}
        onNewChat={newChat}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace - Persona Tailored Views */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* RBAC Barrier: Rendered if active principal lacks required role clearance */}
        {currentRole !== 'student' && authRole !== currentRole && authRole !== 'admin' ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[var(--background)]">
            <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-center space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  HTTP 403 Forbidden &bull; RBAC Barrier
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
                  Role Clearance Required
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Your active principal (<span className="text-[var(--foreground)] font-medium">{user?.displayName || PERSONAS[authRole]?.name}</span>) possesses the <span className="capitalize font-semibold text-[var(--accent)]">{PERSONAS[authRole]?.badge}</span> role, which is not permitted to access the <span className="capitalize font-semibold text-[var(--foreground)]">{PERSONAS[currentRole]?.badge}</span> console.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  onClick={() => {
                    setSelectedRole(null);
                    switchDemoPersona(currentRole);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Authenticate as {PERSONAS[currentRole]?.name}
                </button>
                <button
                  onClick={() => setSelectedRole(authRole)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] text-xs font-medium border border-[var(--border-subtle)] transition-all active:scale-95 cursor-pointer"
                >
                  Return to My Workspace
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                                  {thinkingStage === 0
                                    ? 'Detecting intent & routing domain authority...'
                                    : thinkingStage === 1
                                    ? 'Querying institutional policy corpus via pgvector MMR...'
                                    : 'Synthesizing verified response with citations...'}
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
          </>
        )}
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
