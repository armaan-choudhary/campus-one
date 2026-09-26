'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { TopNav } from '@/components/TopNav';
import { Sidebar } from '@/components/Sidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageComposer } from '@/components/MessageComposer';
import { CitationDrawer } from '@/components/CitationDrawer';
import { StudentTicketsView } from '@/components/StudentTicketsView';
import { KnowledgeMeshHero } from '@/components/vectors/KnowledgeMeshHero';
import { CampusLoader } from '@/components/ui/CampusLoader';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { TicketProvider, useTickets } from '@/context/TicketContext';
import { STARTER_PROMPTS, PERSONAS } from '@/lib/demoFixtures';
import { Citation } from '@/types';
import { KeyRound, CreditCard, Wrench, Compass, ShieldCheck, ArrowRight } from 'lucide-react';

function WorkspaceContent() {
  const { user, role: authRole } = useAuth();
  const [studentTab, setStudentTab] = useState<'chat' | 'tickets'>('chat');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { addTicket } = useTickets();

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

  // Auto-register any escalated handoff tickets produced by the assistant
  useEffect(() => {
    const msgs = activeConversation?.messages || [];
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.handoff) {
      addTicket(lastMsg.handoff);
    }
  }, [activeConversation?.messages, addTicket]);

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

  const activePersona = PERSONAS[authRole] || PERSONAS.student;

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

  const handleNewChat = () => {
    setStudentTab('chat');
    newChat();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden transition-colors duration-200">
      {/* Top App Bar for Student Portal */}
      <TopNav
        currentRole={authRole}
        activeStudentTab={studentTab}
        onStudentTabChange={(t) => setStudentTab(t)}
        currentTheme={currentTheme}
        onToggleTheme={toggleTheme}
        onNewChat={handleNewChat}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Admin Quick Banner (if active session is Admin visiting Student Portal) */}
      {authRole === 'admin' && (
        <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Logged in as Administrator (<strong>{user?.displayName || 'Central IT'}</strong>). Previewing Student Assistant view.
            </span>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
          >
            <span>Open Dedicated Admin Console</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Main Student Workspace: Assistant Chats OR My Tickets */}
      <div className="flex flex-1 overflow-hidden relative">
        {studentTab === 'tickets' ? (
          <StudentTicketsView onGoToChat={() => setStudentTab('chat')} />
        ) : (
          <>
            {/* Inquiry History Navigation Drawer */}
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
            <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[var(--background)] relative min-w-0 transition-all duration-200">
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

                      {/* Staged Thinking Indicator */}
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
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<CampusLoader fullscreen label="Loading Student Workspace..." />}>
      <TicketProvider>
        <WorkspaceContent />
      </TicketProvider>
    </Suspense>
  );
}
