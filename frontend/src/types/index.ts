export type UserRole = 'student' | 'agent' | 'knowledge_admin' | 'executive' | 'admin';

export interface Persona {
  id: UserRole;
  name: string;
  title: string;
  department: string;
  avatar: string;
  badge: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  department?: string;
  displayName?: string;
  permissions: string[];
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: string;
    department?: string;
    display_name?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Citation {
  id: string;
  marker: string;
  title: string;
  section: string;
  version: string;
  excerpt: string;
  groundingScore: number;
  sourceUri?: string;
  custodian?: string;
}

export interface ClarificationOption {
  id: string;
  label: string;
  domain: string;
}

export interface HandoffTicket {
  ticketId: string;
  department: string;
  reason: string;
  studentName?: string;
  urgency?: 'normal' | 'high' | 'urgent';
  createdAt?: string;
  status?: 'pending' | 'in_progress' | 'resolved';
  preview?: string;
}

export interface MessagePortalLink {
  label: string;
  url: string;
}

export interface MessageClarification {
  prompt: string;
  options: ClarificationOption[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  domain?: 'it' | 'finance' | 'facilities' | 'academics' | 'administration';
  domainLabel?: string;
  confidence?: number;
  timestamp: string;
  citations?: Citation[];
  clarification?: MessageClarification;
  handoff?: HandoffTicket;
  checklist?: string[];
  portalLink?: MessagePortalLink;
  followUps?: string[];
}

export interface ConversationItem {
  id: string;
  title: string;
  status: 'resolved' | 'open' | 'clarification' | 'handoff';
  domainKey: string;
  updatedAt: string;
  messages: Message[];
}

export interface StarterPrompt {
  domain: string;
  domainKey?: string;
  text: string;
}

export interface PolicyChunkSample {
  chunkId: string;
  section: string;
  tokens: number;
  preview: string;
  vectorId: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  domain: 'it' | 'finance' | 'facilities' | 'academics' | 'administration';
  version: string;
  chunks: number;
  status: 'published' | 'draft' | 'archived';
  effectiveDate: string;
  custodian: string;
  lastIndexed: string;
  chunkSamples?: PolicyChunkSample[];
}

export interface ConfusionMatrixCell {
  actual: string;
  predicted: string;
  count: number;
  pct: number;
  isCorrect: boolean;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: ConfusionMatrixCell[][];
  macroAccuracy: number;
  resolutionRate: number;
}

export interface LiveAuditLog {
  time: string;
  session: string;
  domain: string;
  confidence: number;
  latency: string;
  status: string;
}

export type PolicyChunk = PolicyChunkSample;

export interface AnalyticsData {
  routingAccuracy: string;
  routingAccuracyDelta: string;
  resolutionRate: string;
  resolutionRateDelta: string;
  clarificationRate: string;
  handoffRate: string;
  sourceCoverage: string;
  p50Latency: string;
  p95Latency: string;
  activeSessions: number;
}

