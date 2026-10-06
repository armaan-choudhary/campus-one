'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { Sidebar } from '@/components/Sidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageComposer } from '@/components/MessageComposer';
import { CitationDrawer } from '@/components/CitationDrawer';
import { StudentTicketsView } from '@/components/StudentTicketsView';
import { CampusLoader } from '@/components/ui/CampusLoader';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { TicketProvider, useTickets } from '@/context/TicketContext';
import { PERSONAS } from '@/lib/demoFixtures';
import { Citation, Message } from '@/types';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const SUGGESTED_SCENARIOS = [
  'I missed my midterm after being hospitalised. What can I do?',
  'Can I get a refund for my hostel fee?',
  "Wi-Fi isn't working in my hostel.",
  'I lost my ID card, how do I get a new one?',
];

function WorkspaceContent() {
  const { user, role: authRole } = useAuth();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q');
  const tabParam = searchParams.get('tab');
  const initialQueryHandled = useRef(false);
  const [studentTab, setStudentTab] = useState<'chat' | 'tickets'>(
    tabParam === 'tickets' ? 'tickets' : 'chat'
  );
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
    if (saved) {
      setCurrentTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setCurrentTheme('light');
    }
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null | 'closed'>(null);
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
    togglePin,
    selectClarification,
  } = useChat();

  const activeCitation: Citation | null =
    selectedCitation === 'closed'
      ? null
      : selectedCitation ||
        activeConversation?.messages
          ?.slice()
          .reverse()
          .find((m: Message) => m.role === 'assistant' && m.citations && m.citations.length > 0)
          ?.citations?.[0] ||
        null;

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

  // Handle initial query from landing page or shared URL
  useEffect(() => {
    if (queryParam && !initialQueryHandled.current && !isProcessing) {
      initialQueryHandled.current = true;
      sendMessage(queryParam);
    }
  }, [queryParam, isProcessing, sendMessage]);

  const handleNewChat = () => {
    setStudentTab('chat');
    newChat();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B0B0B] text-[#F5F3ED] overflow-hidden transition-colors duration-200">
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
        <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-indigo-300 shrink-0">
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
              onTogglePin={togglePin}
            />

            {/* Conversational Stream */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0D] relative min-w-0 transition-all duration-200">
              {/* Subtle ambient warm backlight */}
              <div
                className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(255,122,0,0.06),transparent_70%)]"
                aria-hidden="true"
              />

              {/* Clean Universal Header */}
              <div className="shrink-0 px-4 sm:px-8 pt-5 pb-4 border-b border-[#1E1E24] bg-[#0A0A0D]/90 backdrop-blur-md relative z-10">
                <div className="max-w-[840px] mx-auto">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA]">
                    <span className="w-2 h-2 rounded-full bg-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.8)] animate-pulse" />
                    <span className="text-[#FF7A00] font-semibold">Student Assistant</span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F3ED] tracking-tight mt-1.5">
                    Let’s figure it out<span className="text-[#FF7A00]">.</span>
                  </h1>
                </div>
              </div>

              {/* Scrollable Container */}
              <div
                role="log"
                aria-live="polite"
                aria-label="Conversation with CampusOne"
                className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scroll-smooth scrollbar-none flex flex-col relative z-10"
              >
                <div className="mx-auto w-full max-w-[840px] flex-1 flex flex-col justify-center pb-4">
                  {activeConversation.messages.length === 0 ? (
                    /* Clean Welcome State with warm accent sprinkles */
                    <div className="animate-in fade-in duration-200 space-y-6">
                      <p className="font-sans text-base sm:text-lg text-[#C8C6BE] leading-relaxed">
                        Ask any campus question. We’ll guide you to the{' '}
                        <span className="text-[#F5F3ED] font-medium border-b border-[#FF7A00]/40 pb-0.5">
                          right policy, form, or department
                        </span>
                        .
                      </p>

                      {/* Common Scenarios Card Grid (Above Input Section) */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 font-mono text-xs text-[#8D8A83]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]" />
                          <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">
                            Common questions
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {SUGGESTED_SCENARIOS.map((query, idx) => (
                            <button
                              key={idx}
                              onClick={() => sendMessage(query)}
                              className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/50 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 shadow-md hover:shadow-[0_4px_24px_rgba(255,122,0,0.08)] overflow-hidden"
                            >
                              {/* Faint orange hover top-edge sheen */}
                              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                              <span className="text-sm font-sans text-[#E5E3DC] group-hover:text-white leading-relaxed">
                                &ldquo;{query}&rdquo;
                              </span>

                              <div className="flex items-center justify-between pt-2.5 border-t border-[#1C1D24] group-hover:border-[#FF7A00]/25 text-xs font-mono transition-colors">
                                <span className="text-[11px] text-[#8D8A83] group-hover:text-[#A1A1AA]">
                                  Inquiry
                                </span>
                                <span className="text-xs text-[#FF7A00] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                  <span>Ask</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#FF7A00]" />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Active Message Thread */
                    <div className="pb-4 space-y-6">
                      {activeConversation.messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          onOpenCitation={setSelectedCitation}
                          onSelectClarification={selectClarification}
                          onSelectFollowUp={sendMessage}
                        />
                      ))}

                      {/* Loading State */}
                      {isProcessing && (
                        <div className="my-6 space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center gap-2 text-xs font-mono text-[#8D8A83]">
                            <span className="text-[#FF7A00] font-bold">—</span>
                            <span>
                              {thinkingStage === 0
                                ? 'Routing to department authority...'
                                : thinkingStage === 1
                                ? 'CampusOne is checking the university sources...'
                                : 'Synthesizing verified response...'}
                            </span>
                          </div>
                          <div className="h-0.5 w-36 bg-[#292929] overflow-hidden rounded-full">
                            <div className="h-full bg-[#FF7A00] animate-pulse w-full" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Docked Message Composer at Bottom */}
              <div className="shrink-0 w-full bg-[#0A0A0D]/95 backdrop-blur-md border-t border-[#1C1C24] px-4 sm:px-8 py-3 relative z-10 before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-1/3 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#FF7A00]/30 before:to-transparent">
                <div className="max-w-[840px] mx-auto">
                  <MessageComposer
                    onSendMessage={sendMessage}
                    disabled={isProcessing}
                    onClearContext={() => setSelectedCitation('closed')}
                  />
                </div>
              </div>
            </main>

            {/* Docked Official Record Inspector Panel */}
            <CitationDrawer
              citation={activeCitation}
              onClose={() => setSelectedCitation('closed')}
              onProceedForm={() => {
                if (activeCitation?.associatedForm && activeCitation?.sourceUri) {
                  window.open(activeCitation.sourceUri, '_blank');
                } else if (activeCitation?.associatedForm) {
                  sendMessage(`I would like to proceed with official filing for ${activeCitation.associatedForm}.`);
                } else if (activeCitation?.sourceUri) {
                  window.open(activeCitation.sourceUri, '_blank');
                } else {
                  sendMessage('I would like to proceed with this request.');
                }
              }}
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

