'use client';

import React, { useState } from 'react';
import { KNOWLEDGE_DOCUMENTS, PolicyDocument } from '@/lib/demoFixtures';
import {
  BookOpen,
  Database,
  Upload,
  RefreshCw,
  CheckCircle2,
  Plus,
  X,
  Search,
  Layers,
  Sparkles,
  Terminal,
  ShieldCheck,
} from 'lucide-react';

interface RetrievalMatch {
  docTitle: string;
  section: string;
  similarity: number;
  tokens: number;
  excerpt: string;
  domain: string;
}

const SAMPLE_RETRIEVALS: Record<string, RetrievalMatch[]> = {
  default: [
    {
      docTitle: 'Fee Payment & Refund Policy (v2026.1)',
      section: 'Section 3.2: Payment Reconciliation SLAs',
      similarity: 0.948,
      tokens: 380,
      excerpt: 'All electronic fund transfers require an automated clearinghouse settlement cycle of 24 to 48 banking business hours before reconciliation into the Student SIS Ledger.',
      domain: 'Finance',
    },
    {
      docTitle: 'IT Account Recovery & Eduroam Authentication Guide (v2026.1)',
      section: 'Section 2.1: Self-Service Identity Management',
      similarity: 0.892,
      tokens: 410,
      excerpt: 'Students and faculty may reset expired or compromised Active Directory credentials via the Identity & Access Management (IAM) self-service portal.',
      domain: 'IT',
    },
    {
      docTitle: 'Academic Standing, Attendance & Course Add/Drop Regulations (v2026.1)',
      section: 'Section 4.1: Minimum Attendance Mandates',
      similarity: 0.814,
      tokens: 350,
      excerpt: 'Undergraduate candidates must maintain an aggregate physical attendance threshold of not less than 75% per registered academic module.',
      domain: 'Academics',
    },
  ],
};

export const KnowledgeAdminView: React.FC = () => {
  const [documents, setDocuments] = useState<PolicyDocument[]>(KNOWLEDGE_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReindexing, setIsReindexing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<PolicyDocument | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState<'it' | 'finance' | 'facilities' | 'academics' | 'administration'>('academics');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'sandbox'>('documents');
  const [sandboxQuery, setSandboxQuery] = useState('How long does fee payment take to clear in student ledger?');
  const [sandboxResults, setSandboxResults] = useState<RetrievalMatch[]>(SAMPLE_RETRIEVALS.default);
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    return (
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.custodian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReindex = () => {
    setIsReindexing(true);
    setTimeout(() => {
      setIsReindexing(false);
      showToast('pgvector HNSW indexes successfully recomputed across 48 policy chunks.');
    }, 1200);
  };

  const handlePublishNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: PolicyDocument = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      domain: newDomain,
      version: 'v2026.1',
      chunks: 7,
      status: 'published',
      effectiveDate: 'Sep 12, 2026',
      custodian: 'Office of the Registrar',
      lastIndexed: 'Just now',
      chunkSamples: [
        {
          chunkId: `chk_gen_${Date.now().toString().slice(-3)}`,
          section: 'Section 1.0: Executive Purpose & Scope',
          tokens: 360,
          preview: `${newTitle.trim()} applies across all matriculated students and faculty members...`,
          vectorId: `vec_${Math.random().toString(36).substring(2, 8)}_dim1536`,
        },
      ],
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setNewTitle('');
    showToast(`&ldquo;${newDoc.title}&rdquo; published and indexed into vector corpus.`);
  };

  const handleRunSandbox = () => {
    if (!sandboxQuery.trim()) return;
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSandboxResults(SAMPLE_RETRIEVALS.default);
      showToast('Vector distance computed across 48 chunks using cosine metric.');
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-[1440px] mx-auto space-y-6 transition-all">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-[var(--surface-1)] border border-[var(--accent)] text-[var(--foreground)] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] tracking-tight">
                  Knowledge Base &amp; Policy Registry
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)] bg-[var(--surface-2)] px-3 py-1 rounded-full border border-[var(--border-subtle)] whitespace-nowrap shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Grounding Authority
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] pl-0.5">
            Manage institutional policy handbooks, sentence boundary chunking, and pgvector HNSW embeddings
          </p>
        </div>

        {/* Action Controls & Tab Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-full text-xs border border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              Corpus Documents
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Retrieval Sandbox</span>
            </button>
          </div>

          <button
            onClick={handleReindex}
            disabled={isReindexing}
            className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${isReindexing ? 'animate-spin' : ''}`} />
            <span>{isReindexing ? 'Re-indexing...' : 'Re-index pgvector'}</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 text-xs font-semibold px-4.5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] transition-colors shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Publish Policy</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Published Documents</span>
          <div className="text-2xl font-bold text-[var(--foreground)] tracking-tight font-mono">{documents.length}</div>
          <span className="text-[11px] text-[var(--accent)] font-medium">5 core departments</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Indexed Chunks</span>
          <div className="text-2xl font-bold text-[var(--foreground)] tracking-tight font-mono">48</div>
          <span className="text-[11px] text-[var(--text-tertiary)]">512 token target size</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Vector Dimensions</span>
          <div className="text-2xl font-bold text-[var(--foreground)] tracking-tight font-mono">1,536</div>
          <span className="text-[11px] text-emerald-400 font-medium">pgvector HNSW (m=16)</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Registry SLA</span>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">100%</div>
          <span className="text-[11px] text-emerald-400 font-medium">Zero stale citations</span>
        </div>
      </div>

      {activeTab === 'documents' ? (
        <>
          {/* Search and Table */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                  Official Institutional Corpus
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Handbooks audited by the Registrar. Modified documents automatically trigger vector recalculation.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, domain..."
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-9 pr-3.5 py-2 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] font-mono text-[11px]">
                    <th className="py-3 px-3 uppercase">Document ID</th>
                    <th className="py-3 px-3 uppercase">Title &amp; Authority</th>
                    <th className="py-3 px-3 uppercase">Domain</th>
                    <th className="py-3 px-3 uppercase">Chunks</th>
                    <th className="py-3 px-3 uppercase">Last Indexed</th>
                    <th className="py-3 px-3 text-right uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                      <td className="py-4 px-3 font-mono font-semibold text-[var(--accent)]">
                        {doc.id}
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-semibold text-xs text-[var(--foreground)]">{doc.title}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{doc.custodian}</div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="capitalize bg-[var(--surface-2)] text-[var(--foreground)] px-2.5 py-1 rounded-full font-mono text-[10.5px] border border-[var(--border-subtle)]">
                          {doc.domain}
                        </span>
                      </td>
                      <td className="py-4 px-3 font-mono text-[var(--text-secondary)]">
                        {doc.chunks}
                      </td>
                      <td className="py-4 px-3 text-[var(--text-tertiary)] font-mono text-[11px]">
                        {doc.lastIndexed}
                      </td>
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => setInspectingDoc(doc)}
                          className="px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-medium text-[var(--accent)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                        >
                          View Chunks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Retrieval Sandbox Tab */
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--accent)]" />
              <span>Semantic Retrieval &amp; Grounding Sandbox</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Simulate student inquiry vector search against the pgvector HNSW index to verify similarity boundaries before publishing policy updates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
              <input
                type="text"
                value={sandboxQuery}
                onChange={(e) => setSandboxQuery(e.target.value)}
                placeholder="Enter a test student inquiry..."
                className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-10 pr-4 py-2.5 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all shadow-xs"
              />
            </div>
            <button
              onClick={handleRunSandbox}
              disabled={isSimulating}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#131314] transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Querying Index...' : 'Run Vector Search'}</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] block">
              Top-K Ranked Retrieved Policy Chunks (Cosine Similarity)
            </span>
            {sandboxResults.map((res, rIdx) => (
              <div
                key={rIdx}
                className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-[var(--accent)]">
                      {rIdx + 1}
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">{res.docTitle}</span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {(res.similarity * 100).toFixed(1)}% Match
                  </span>
                </div>

                <div className="text-xs font-semibold text-[var(--accent)]">{res.section}</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--surface-1)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
                  &ldquo;{res.excerpt}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-mono pt-1">
                  <span>Domain: {res.domain}</span>
                  <span>Tokens: {res.tokens} &bull; Embedding: text-embedding-3-small</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Chunk Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">{inspectingDoc.id}</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
                  Vector Chunks: {inspectingDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] block">Total Chunks</span>
                  <span className="font-semibold text-sm text-[var(--foreground)]">{inspectingDoc.chunks} Chunks (512 token target)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] block">Similarity Threshold</span>
                  <span className="font-semibold text-sm text-[var(--accent)] font-mono">&ge; 0.65 Cosine</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] block">
                  Indexed Embedding Chunks
                </span>
                {inspectingDoc.chunkSamples && inspectingDoc.chunkSamples.length > 0 ? (
                  inspectingDoc.chunkSamples.map((chunk) => (
                    <div
                      key={chunk.chunkId}
                      className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[var(--accent)] font-semibold">{chunk.chunkId}</span>
                        <span className="text-[var(--text-tertiary)]">{chunk.vectorId} &bull; {chunk.tokens} tokens</span>
                      </div>
                      <h4 className="font-semibold text-[var(--foreground)] text-xs">{chunk.section}</h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--surface-1)] p-3 rounded-xl border border-[var(--border-subtle)]">
                        &ldquo;{chunk.preview}&rdquo;
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-[var(--surface-2)] text-center text-xs text-[var(--text-tertiary)]">
                    No chunk preview available for draft/unindexed document.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handlePublishNew}
            className="w-full max-w-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2.5 tracking-tight">
                <Upload className="w-5 h-5 text-[var(--accent)]" />
                <span>Publish New Policy Document</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Student Code of Conduct &amp; Honor Regulations 2026"
                  required
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3 text-xs text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">
                  Governing Domain
                </label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value as 'it' | 'finance' | 'facilities' | 'academics' | 'administration')}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3 text-xs text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                >
                  <option value="it">IT Support</option>
                  <option value="finance">Finance &amp; Student Accounts</option>
                  <option value="facilities">Campus Facilities &amp; Hostels</option>
                  <option value="academics">Academic Registrar</option>
                  <option value="administration">Administration &amp; Student Affairs</option>
                </select>
              </div>

              <div className="p-6 border-2 border-dashed border-[var(--border-medium)] rounded-3xl text-center space-y-2 bg-[var(--surface-2)]/30">
                <Database className="w-8 h-8 text-[var(--accent)] mx-auto" />
                <p className="text-xs text-[var(--foreground)] font-semibold">Upload PDF, Markdown or DOCX</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Automated sentence-boundary chunking &amp; 1536-dim embeddings generation
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[#131314] hover:bg-[var(--accent-hover)] transition-colors shadow-md cursor-pointer"
              >
                Publish to pgvector Corpus
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
