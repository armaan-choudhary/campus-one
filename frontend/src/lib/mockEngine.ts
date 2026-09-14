import { Message } from '@/types';
import { createUniqueId } from '@/lib/utils';

export interface AssistantResponseOptions {
  text: string;
  onStageChange?: (stage: number) => void;
}

/**
 * Simulates multi-stage thinking and response generation for demo mode.
 * Designed to mirror the FastAPI SSE streaming event lifecycle:
 * Stage 0: Routing & Area Identification
 * Stage 1: Knowledge Retrieval & Handbook Verification
 * Stage 2: Synthesis & Grounding Token Generation
 */
export async function simulateAssistantResponse({
  text,
  onStageChange,
}: AssistantResponseOptions): Promise<Message> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lower = text.toLowerCase();

  // Stage 0: Routing
  onStageChange?.(0);
  await new Promise((resolve) => setTimeout(resolve, 450));

  // Stage 1: Retrieving
  onStageChange?.(1);
  await new Promise((resolve) => setTimeout(resolve, 450));

  // Stage 2: Generating
  onStageChange?.(2);
  await new Promise((resolve) => setTimeout(resolve, 450));

  let assistantMsg: Message;

  if (
    lower.includes('password') ||
    lower.includes('eduroam') ||
    lower.includes('login') ||
    lower.includes('wi-fi')
  ) {
    assistantMsg = {
      id: createUniqueId('asst'),
      role: 'assistant',
      domain: 'it',
      domainLabel: 'IT Support',
      confidence: 0.96,
      timestamp,
      content:
        'You can reset your university password and re-issue your **Eduroam Wi-Fi certificate** through the Identity Management self-service portal [1]. Once updated, credentials synchronize across all campus networks within **3 minutes**.',
      portalLink: {
        label: 'Open Password Reset Portal (iam.example.edu)',
        url: 'https://iam.example.edu/reset',
      },
      citations: [
        {
          id: createUniqueId('cit'),
          marker: '[1]',
          title: 'IT Account Recovery Guide (v2026.1)',
          section: 'Section 2.1: Self-Service Identity Management',
          version: 'v2026.1',
          excerpt:
            'Students and faculty may reset expired or compromised Active Directory credentials via the Identity & Access Management (IAM) self-service portal.',
          groundingScore: 0.99,
          custodian: 'Central IT Network & Security Services',
        },
      ],
    };
  } else if (
    lower.includes('submarine') ||
    lower.includes('marine') ||
    lower.includes('off-campus')
  ) {
    assistantMsg = {
      id: createUniqueId('asst'),
      role: 'assistant',
      domain: 'administration',
      domainLabel: 'Department Escalation',
      confidence: 0.28,
      timestamp,
      content:
        'I could not find official university documentation regarding research submarine leases in our published institutional corpus. Rather than guessing, I have routed your inquiry directly to the **Registrar & Academic Administration** for human assistance.',
      handoff: {
        ticketId: '#HND-9921',
        department: 'Office of the Registrar / Academic Administration',
        reason: 'Specialty Asset Inquiry',
      },
    };
  } else if (lower.includes('account') && lower.includes('problem')) {
    assistantMsg = {
      id: createUniqueId('asst'),
      role: 'assistant',
      domain: 'it',
      domainLabel: 'Disambiguation',
      confidence: 0.52,
      timestamp,
      content:
        'Your question touches both technical campus login access and student fee accounts. Please choose the option that matches what you need:',
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
      id: createUniqueId('asst'),
      role: 'assistant',
      domain: 'finance',
      domainLabel: 'Finance & Student Accounts',
      confidence: 0.93,
      timestamp,
      content:
        'University NEFT/RTGS electronic fund transfers require **24 to 48 banking business hours** to reconcile into the Student Information System (SIS) ledger [1]. If payment was made within this window, pending status is standard settlement latency.',
      checklist: [
        'Verify the 16-digit **UTR transaction reference number** on your payment receipt.',
        'Download the provisional payment confirmation slip from the Finance Portal.',
        'Check real-time clearance status under "Fee Dues & History".',
      ],
      citations: [
        {
          id: createUniqueId('cit'),
          marker: '[1]',
          title: 'Fee Payment & Refund Policy (v2026.1)',
          section: 'Section 3.2: Payment Reconciliation SLAs',
          version: 'v2026.1',
          excerpt:
            'All electronic fund transfers require an automated clearinghouse settlement cycle of 24 to 48 banking business hours before reconciliation into the Student SIS Ledger.',
          groundingScore: 0.98,
          custodian: 'Office of the University Bursar & Comptroller',
        },
      ],
      followUps: [
        'What if my fee payment is still pending after 48 hours?',
        'Where do I upload the bank payment proof?',
      ],
    };
  }

  return assistantMsg;
}
