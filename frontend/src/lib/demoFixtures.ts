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
  agent: {
    id: 'agent',
    name: 'Sarah Jenkins',
    title: 'Senior Support Specialist',
    department: 'Central IT & Triage Queue',
    avatar: 'SJ',
    badge: 'Support Agent',
  },
  knowledge_admin: {
    id: 'knowledge_admin',
    name: 'Dr. Patricia Cole',
    title: 'Associate University Registrar',
    department: 'Registrar & Policy Administration',
    avatar: 'PC',
    badge: 'Knowledge Admin',
  },
  executive: {
    id: 'executive',
    name: 'Dr. Marcus Vance',
    title: 'Director of Academic Technology',
    department: 'Vice Chancellor Office',
    avatar: 'MV',
    badge: 'Executive Evaluator',
  },
};

export const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-1',
    title: 'Semester fee dues & portal lockout',
    status: 'resolved',
    domainKey: 'finance',
    updatedAt: '2m ago',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Also, where can I check my semester fees? I paid yesterday but it still shows unpaid.',
        timestamp: '14:24',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        domain: 'finance',
        domainLabel: 'Finance & Accounts',
        confidence: 0.94,
        timestamp: '14:24',
        content: 'University NEFT/RTGS electronic fund transfers require 24 to 48 banking business hours to reconcile into the Student Information System (SIS) ledger. If payment was made within this window, a pending status is normal settlement latency.',
        checklist: [
          'Verify the 16-digit UTR transaction reference number on your bank receipt.',
          'Download the provisional payment acknowledgement slip from the Finance Portal.',
          'Check real-time ledger clearance under "Fee Dues & History".'
        ],
        citations: [
          {
            id: 'cit-fin-1',
            marker: '[1]',
            title: 'Fee Payment & Refund Policy (v2026.1)',
            section: 'Section 3.2: Payment Reconciliation SLAs',
            version: 'v2026.1',
            excerpt: 'All electronic fund transfers (NEFT/RTGS/IMPS) require an automated clearinghouse settlement cycle of 24 to 48 banking business hours before reconciliation into the Student SIS Ledger. Students will receive provisional confirmation instantly, but billing status remains "Processing" until batch reconciliation executes daily at 18:00 EST.',
            groundingScore: 0.98,
            custodian: 'Office of the University Bursar & Comptroller',
            sourceUri: 'https://finance.example.edu/policies/refunds-2026.pdf'
          }
        ],
        followUps: [
          'How do I download the provisional receipt?',
          'What happens if the payment fails?',
          'Can I pay via campus credit card?'
        ]
      },
      {
        id: 'msg-3',
        role: 'assistant',
        domain: 'it',
        domainLabel: 'Routing Ambiguity',
        confidence: 0.54,
        timestamp: '14:25',
        content: 'I noticed your account may also be affected by access restrictions. Let me clarify:',
        clarification: {
          prompt: 'Could you clarify which account you are having difficulty accessing?',
          options: [
            {
              id: 'opt-it',
              label: 'University Portal & Email Login (IT Support)',
              domain: 'it'
            },
            {
              id: 'opt-fin',
              label: 'Tuition Fee Balance & Ledger Account (Finance)',
              domain: 'finance'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'conv-2',
    title: 'Wi-Fi Eduroam certificate renewal',
    status: 'resolved',
    domainKey: 'it',
    updatedAt: 'Yesterday',
    messages: [
      {
        id: 'msg-201',
        role: 'user',
        content: 'How do I reset my university password or Eduroam certificate?',
        timestamp: 'Yesterday',
      },
      {
        id: 'msg-202',
        role: 'assistant',
        domain: 'it',
        domainLabel: 'IT Support',
        confidence: 0.96,
        timestamp: 'Yesterday',
        content: 'You can reset your university password and re-issue your Eduroam 802.1X certificate through the Self-Service Identity Management portal. Once updated, changes propagate to campus Wi-Fi and university email within 3 minutes.',
        portalLink: {
          label: 'Self-Service Password Reset (iam.example.edu)',
          url: 'https://iam.example.edu/reset'
        },
        citations: [
          {
            id: 'cit-it-1',
            marker: '[1]',
            title: 'IT Account Recovery Guide (v2026.1)',
            section: 'Section 2.1: Self-Service Identity Management',
            version: 'v2026.1',
            excerpt: 'Students and faculty may reset expired or compromised Active Directory credentials via the Identity & Access Management (IAM) self-service portal. Eduroam device profiles must be renewed every 365 days using the campus certificate installer.',
            groundingScore: 0.99,
            custodian: 'Central IT Network & Security Services',
            sourceUri: 'https://it.example.edu/guides/account-recovery'
          }
        ],
        followUps: [
          'How do I install the Eduroam Wi-Fi profile on iPhone/Android?',
          'What if my password reset email is delayed?',
          'Where is the physical IT Helpdesk located?'
        ]
      }
    ]
  },
  {
    id: 'conv-3',
    title: 'Hostel Block B climate maintenance',
    status: 'handoff',
    domainKey: 'facilities',
    updatedAt: '3d ago',
    messages: [
      {
        id: 'msg-301',
        role: 'user',
        content: 'Air conditioning in Hostel Block B Room 304 is leaking water.',
        timestamp: '3d ago',
      },
      {
        id: 'msg-302',
        role: 'assistant',
        domain: 'facilities',
        domainLabel: 'Campus Facilities',
        confidence: 0.98,
        timestamp: '3d ago',
        content: 'Maintenance request #FAC-8812 has been automatically lodged with Campus Facilities HVAC triage team.',
        handoff: {
          ticketId: '#FAC-8812',
          department: 'Hostel Maintenance Operations',
          reason: 'Physical Infrastructure Work Order'
        },
        followUps: [
          'Track status of work order #FAC-8812',
          'Request an emergency maintenance visit',
          'Check hostel maintenance turnaround SLAs'
        ]
      }
    ]
  }
];

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
    text: 'Can I lease a research submarine for marine studies?',
    domain: 'Registrar',
    domainKey: 'administration' as const,
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

export const AGENT_TICKETS: HandoffTicket[] = [
  {
    ticketId: '#HND-9921',
    studentName: 'Alex Rivera (ST-4491)',
    department: 'Office of the Registrar / Academic Admin',
    reason: 'Unsupported Research Equipment Lease Inquiry',
    urgency: 'normal',
    createdAt: '12m ago',
    status: 'pending',
    preview: 'Student requested guidance on leasing a submarine for marine studies. Query exceeded published policies; autonomous breaker initiated safe escalation.'
  },
  {
    ticketId: '#FIN-4402',
    studentName: 'Elena Rostova (ST-2290)',
    department: 'Student Accounts & Finance',
    reason: 'Payment Hold Blocking Canvas Exam Portal',
    urgency: 'urgent',
    createdAt: '28m ago',
    status: 'pending',
    preview: 'Bank RTGS completed 72 hours ago, but ERP course registration portal remains locked by financial delinquency flag. Manual reconciliation required.'
  },
  {
    ticketId: '#FAC-8812',
    studentName: 'Jordan Taylor (ST-9182)',
    department: 'Facilities & Dorm Maintenance',
    reason: 'Hostel HVAC Water Leakage Inhabitant Hazard',
    urgency: 'high',
    createdAt: '1h ago',
    status: 'in_progress',
    preview: 'Water leakage in Hostel Block B Room 304 reported directly via conversational door. Work order generated and assigned to Facilities HVAC crew.'
  },
  {
    ticketId: '#IT-3109',
    studentName: 'Devon Miller (ST-7731)',
    department: 'Central IT Network Helpdesk',
    reason: 'Eduroam 802.1X Certificate Invalidation',
    urgency: 'normal',
    createdAt: '3h ago',
    status: 'resolved',
    preview: 'Device certificate failed renewal post OS update. Student sent self-service root cert URL.'
  },
];

export const KNOWLEDGE_DOCUMENTS: PolicyDocument[] = [
  {
    id: 'DOC-FIN-001',
    title: 'Fee Payment, Installments & Refund Regulations',
    domain: 'finance',
    version: 'v2026.1',
    chunks: 14,
    status: 'published',
    effectiveDate: 'Jan 15, 2026',
    custodian: 'Office of the University Bursar',
    lastIndexed: '2 days ago',
    chunkSamples: [
      {
        chunkId: 'chk_fin_01',
        section: 'Section 3.2: Electronic Fund Transfer Reconciliation',
        tokens: 384,
        preview: 'All electronic fund transfers (NEFT/RTGS/IMPS) require an automated clearinghouse settlement cycle of 24 to 48 banking business hours before reconciliation into the Student SIS Ledger...',
        vectorId: 'vec_7f991b_dim1536',
      },
      {
        chunkId: 'chk_fin_02',
        section: 'Section 4.1: Late Payment Assessment & Appeals',
        tokens: 412,
        preview: 'A penalty grace period of 5 calendar days is granted post fee deadline. Students facing acute distress may petition the Bursar for installment restructuring...',
        vectorId: 'vec_2c114e_dim1536',
      },
    ],
  },
  {
    id: 'DOC-IT-002',
    title: 'Campus Identity, Wi-Fi 802.1X & Multi-Factor Authentication',
    domain: 'it',
    version: 'v2026.2',
    chunks: 11,
    status: 'published',
    effectiveDate: 'Feb 01, 2026',
    custodian: 'Central IT Services',
    lastIndexed: '4 hours ago',
    chunkSamples: [
      {
        chunkId: 'chk_it_01',
        section: 'Section 2.1: Self-Service Identity Management',
        tokens: 356,
        preview: 'Students and faculty may reset expired or compromised Active Directory credentials via the Identity & Access Management (IAM) self-service portal...',
        vectorId: 'vec_8a339d_dim1536',
      },
      {
        chunkId: 'chk_it_02',
        section: 'Section 2.4: Eduroam Device Configuration Profiles',
        tokens: 440,
        preview: 'Eduroam operates on WPA2/WPA3 Enterprise 802.1X EAP-TTLS encryption. Root certificates must be re-signed annually through the automated profile generator...',
        vectorId: 'vec_11bc90_dim1536',
      },
    ],
  },
  {
    id: 'DOC-ACAD-003',
    title: 'Academic Standing, Attendance Mandates & Grade Overrides',
    domain: 'academics',
    version: 'v2025.4',
    chunks: 9,
    status: 'published',
    effectiveDate: 'Aug 20, 2025',
    custodian: 'Academic Senate & Registrar',
    lastIndexed: '1 week ago',
  },
  {
    id: 'DOC-FAC-004',
    title: 'Residential Hostels, Maintenance SLAs & Noise Code',
    domain: 'facilities',
    version: 'v2026.1',
    chunks: 8,
    status: 'published',
    effectiveDate: 'Jan 10, 2026',
    custodian: 'Directorate of Campus Operations',
    lastIndexed: '3 days ago',
  },
  {
    id: 'DOC-ADM-005',
    title: 'Bonafide Certificates, Visas & Student Identity Dossiers',
    domain: 'administration',
    version: 'v2026.1',
    chunks: 6,
    status: 'published',
    effectiveDate: 'Jan 05, 2026',
    custodian: 'Dean of Student Affairs',
    lastIndexed: '5 days ago',
  },
  {
    id: 'DOC-ACAD-006',
    title: 'Summer 2026 Independent Research & Marine Fieldwork (Draft)',
    domain: 'academics',
    version: 'v2026.3-rc',
    chunks: 0,
    status: 'draft',
    effectiveDate: 'Pending Approval',
    custodian: 'Faculty of Marine Sciences',
    lastIndexed: 'Never',
  },
];

export const ANALYTICS_SUMMARY: AnalyticsData = {
  routingAccuracy: '88.4%',
  routingAccuracyDelta: '+2.1%',
  resolutionRate: '76.2%',
  resolutionRateDelta: '+4.3%',
  clarificationRate: '11.8%',
  handoffRate: '9.1%',
  sourceCoverage: '98.6%',
  p50Latency: '1.84s',
  p95Latency: '4.21s',
  activeSessions: 42,
};

export const CONFUSION_MATRIX = [
  { actual: 'IT', it: '96.2%', fin: '0.8%', fac: '1.1%', acad: '0.4%', admin: '1.5%' },
  { actual: 'Finance', it: '3.8%', fin: '93.4%', fac: '0.2%', acad: '1.6%', admin: '1.0%' },
  { actual: 'Facilities', it: '3.1%', fin: '0.4%', fac: '91.0%', acad: '0.8%', admin: '4.7%' },
  { actual: 'Academics', it: '1.2%', fin: '4.2%', fac: '0.3%', acad: '89.5%', admin: '4.8%' },
  { actual: 'Admin', it: '2.4%', fin: '1.8%', fac: '3.2%', acad: '4.8%', admin: '87.8%' },
];

export const LIVE_AUDIT_LOGS = [
  { time: '14:24:12', session: 'SESS-8812', domain: 'Finance', latency: '184ms', confidence: '0.94', status: 'Resolved (Autonomous)' },
  { time: '14:23:45', session: 'SESS-8811', domain: 'IT Support', latency: '210ms', confidence: '0.96', status: 'Resolved' },
  { time: '14:22:18', session: 'SESS-8810', domain: 'IT / Finance', latency: '340ms', confidence: '0.54', status: 'Clarification Triggered' },
  { time: '14:21:02', session: 'SESS-8809', domain: 'Administration', latency: '192ms', confidence: '0.31', status: 'Handoff #HND-9921' },
  { time: '14:19:55', session: 'SESS-8808', domain: 'Facilities', latency: '175ms', confidence: '0.98', status: 'Work Order Dispatched' },
];
