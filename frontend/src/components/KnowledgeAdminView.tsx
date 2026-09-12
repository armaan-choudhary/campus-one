'use client';

import React, { useState } from 'react';
import { KNOWLEDGE_DOCUMENTS, PolicyDocument, PolicyChunk } from '@/lib/demoFixtures';
import {
  BookOpen,
  Database,
  Upload,
  RefreshCw,
  CheckCircle2,
  FileText,
  Building2,
  Sparkles,
  Plus,
  X,
  Search,
  Layers,
  ShieldCheck,
  Binary,
} from 'lucide-react';

export const KnowledgeAdminView: React.FC = () => {
  const [documents, setDocuments] = useState<PolicyDocument[]>(KNOWLEDGE_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReindexing, setIsReindexing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<PolicyDocument | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState<'it' | 'finance' | 'facilities' | 'academics' | 'administration'>('academics');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    showToast(`"${newDoc.title}" published and indexed into vector corpus.`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6 transition-all">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-[var(--surface-1)] border border-[var(--accent)] text-[var(--foreground)] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
                  Knowledge Base & Policy Corpus
                </h2>
                <span className="text-xs font-medium text-[var(--accent)] bg-[var(--surface-2)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                  Registrar Console
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] pl-0.5">
            Authoritative institutional policies backing hybrid pgvector semantic retrieval and grounding
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReindex}
            disabled={isReindexing}
            className="flex items-center gap-2 text-xs font-semibold px-4.5 py-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${isReindexing ? 'animate-spin' : ''}`} />
            <span>{isReindexing ? 'Re-indexing Embeddings...' : 'Re-index pgvector'}</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#131314] transition-colors shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Publish Document</span>
          </button>
        </div>
      </div>

      {/* Corpus Health Cards with Generous Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Published Documents</span>
          <div className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
            {documents.filter((d) => d.status === 'published').length}
          </div>
          <span className="text-[11px] text-[var(--accent)] font-medium flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Vector Synced
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Vector Chunk Indices</span>
          <div className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
            {documents.reduce((acc, d) => acc + d.chunks, 0)}
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono block pt-1">
            pgvector HNSW (m=16, ef=64)
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Authoritative Domains</span>
          <div className="text-3xl font-bold text-[var(--foreground)] tracking-tight">5 Units</div>
          <span className="text-[11px] text-[var(--text-tertiary)] block pt-1">
            IT, Fin, Fac, Acad, Admin
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Draft Staged Docs</span>
          <div className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
            {documents.filter((d) => d.status === 'draft').length}
          </div>
          <span className="text-[11px] text-amber-400 font-medium block pt-1">
            Pending Registrar Verification
          </span>
        </div>
      </div>

      {/* Document Catalog Section with Search & Generous Spacing */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-7 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              Active Institutional Policy Corpus
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policy titles, codes..."
              className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-9 pr-4 py-2 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] font-mono text-[11px]">
                <th className="py-3.5 px-4 font-semibold uppercase">Document Title</th>
                <th className="py-3.5 px-3 font-semibold uppercase">Domain</th>
                <th className="py-3.5 px-3 font-semibold uppercase">Chunks</th>
                <th className="py-3.5 px-3 font-semibold uppercase">Status</th>
                <th className="py-3.5 px-3 font-semibold uppercase">Effective Date</th>
                <th className="py-3.5 px-3 font-semibold uppercase">Custodian Authority</th>
                <th className="py-3.5 px-4 text-right font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/60">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-sm text-[var(--foreground)]">{doc.title}</div>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      {doc.id} · {doc.version}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="capitalize text-[11px] font-medium text-[var(--accent)] bg-[var(--surface-2)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                      {doc.domain}
                    </span>
                  </td>
                  <td className="py-4 px-3 font-mono text-[var(--foreground)] font-medium">
                    {doc.chunks > 0 ? `${doc.chunks} chunks` : 'Unindexed'}
                  </td>
                  <td className="py-4 px-3">
                    {doc.status === 'published' ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Published
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold">Draft</span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-[var(--text-secondary)]">
                    {doc.effectiveDate}
                  </td>
                  <td className="py-4 px-3 text-[var(--text-secondary)]">
                    {doc.custodian}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setInspectingDoc(doc)}
                      className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold px-3 py-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors border border-[var(--border-subtle)] cursor-pointer"
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

      {/* Interactive Chunk Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
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
                  <span className="font-semibold text-sm text-[var(--accent)] font-mono">≥ 0.65 Cosine</span>
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
                        <span className="text-[var(--text-tertiary)]">{chunk.vectorId} · {chunk.tokens} tokens</span>
                      </div>
                      <h4 className="font-semibold text-[var(--foreground)] text-xs">{chunk.section}</h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--surface-1)] p-3 rounded-xl border border-[var(--border-subtle)]">
                        "{chunk.preview}"
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
            className="w-full max-w-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200"
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
                  placeholder="e.g., Student Code of Conduct & Honor Regulations 2026"
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
                  onChange={(e) => setNewDomain(e.target.value as any)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3 text-xs text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                >
                  <option value="it">IT Support</option>
                  <option value="finance">Finance & Student Accounts</option>
                  <option value="facilities">Campus Facilities & Hostels</option>
                  <option value="academics">Academic Registrar</option>
                  <option value="administration">Administration & Student Affairs</option>
                </select>
              </div>

              <div className="p-6 border-2 border-dashed border-[var(--border-medium)] rounded-3xl text-center space-y-2 bg-[var(--surface-2)]/30">
                <Upload className="w-8 h-8 text-[var(--accent)] mx-auto" />
                <p className="text-xs text-[var(--foreground)] font-semibold">Upload PDF, Markdown or DOCX</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Automated sentence-boundary chunking & 1536-dim embeddings generation
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
