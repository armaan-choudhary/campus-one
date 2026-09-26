export type {
  UserRole,
  Persona,
  Citation,
  ClarificationOption,
  HandoffTicket,
  Message,
  ConversationItem,
  StarterPrompt,
  PolicyChunkSample,
  PolicyChunk,
  PolicyDocument,
  ConfusionMatrixCell,
  ConfusionMatrixData,
  LiveAuditLog,
  AnalyticsData,
} from '@/types';

import type {
  UserRole,
  Persona,
  ConversationItem,
  StarterPrompt,
  HandoffTicket,
  PolicyDocument,
  AnalyticsData,
} from '@/types';

export const PERSONAS: Record<UserRole, Persona> = {
  student: {
    id: 'student',
    name: 'Alex Rivera',
    title: '3rd Year Computer Science',
    department: 'Undergraduate College',
    avatar: 'AR',
    badge: 'Student',
  },
  admin: {
    id: 'admin',
    name: 'System Administrator',
    title: 'Central IT Administration',
    department: 'Central IT Administration',
    avatar: 'SA',
    badge: 'Admin',
  },
};

export const INITIAL_CONVERSATIONS: ConversationItem[] = [];

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    text: 'How do I reset my university password?',
    domain: 'IT Support',
    domainKey: 'it' as const,
  },
  {
    text: 'Where can I check my semester fee payment status?',
    domain: 'Finance',
    domainKey: 'finance' as const,
  },
  {
    text: 'Report an air conditioning leak in Hostel Block B',
    domain: 'Facilities',
    domainKey: 'facilities' as const,
  },
  {
    text: 'How do I request an official bonafide study certificate?',
    domain: 'Student Affairs',
    domainKey: 'administration' as const,
  },
  {
    text: 'What are the minimum credit requirements for Fall 2026 graduation?',
    domain: 'Academics',
    domainKey: 'academics' as const,
  }
];

export const AGENT_TICKETS: HandoffTicket[] = [];

export const KNOWLEDGE_DOCUMENTS: PolicyDocument[] = [];

export const ANALYTICS_SUMMARY: AnalyticsData = {
  routingAccuracy: '0%',
  routingAccuracyDelta: '0%',
  resolutionRate: '0%',
  resolutionRateDelta: '0%',
  clarificationRate: '0%',
  handoffRate: '0%',
  sourceCoverage: '0%',
  p50Latency: '0s',
  p95Latency: '0s',
  activeSessions: 0,
};

export const CONFUSION_MATRIX: Array<{
  actual: string;
  it: string;
  fin: string;
  fac: string;
  acad: string;
  admin: string;
}> = [];

export const LIVE_AUDIT_LOGS: Array<{
  time: string;
  session: string;
  domain: string;
  latency: string;
  confidence: string;
  status: string;
}> = [];
