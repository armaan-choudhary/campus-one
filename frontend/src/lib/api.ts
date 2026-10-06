import { AuthTokenResponse, LoginCredentials, AuthUser, UserRole } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const SEEDED_CREDENTIALS: Record<UserRole, LoginCredentials> = {
  student: {
    email: 'student@example.edu',
    password: 'demo-password',
  },
  admin: {
    email: 'admin@example.edu',
    password: 'demo-password',
  },
};

const SEEDED_PERMISSIONS: Record<UserRole, string[]> = {
  student: [
    'conversations:own',
    'messages:create',
    'knowledge:read_public',
    'handoff:create_own',
  ],
  admin: ['*'],
};

function normalizeRole(backendRole: string): UserRole {
  return backendRole?.toLowerCase() === 'admin' ? 'admin' : 'student';
}

export async function loginWithApi(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Login failed with status ${res.status}`);
  }

  return await res.json();
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch current user (${res.status})`);
  }

  const data = await res.json();
  const role = normalizeRole(data.role);
  return {
    id: data.id,
    email: data.email,
    role,
    department: data.department,
    displayName: data.display_name,
    permissions: data.permissions || SEEDED_PERMISSIONS[role],
  };
}

export async function logoutApi(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Best-effort logout
  }
}

export interface BackendRetrievedChunk {
  content: string;
  source: string;
  page?: number;
  metadata?: Record<string, unknown>;
}

export interface BackendChatResponse {
  answer: string;
  thread_id: string;
  ticket_id?: string | null;
  ticket?: Record<string, unknown> | null;
  detected_domains: string[];
  intent?: string | null;
  routing_confidence: number;
  solved: boolean;
  human_required: boolean;
  handoff_reason?: string | null;
  sources: string[];
  retrieved_chunks: BackendRetrievedChunk[];
  metadata?: Record<string, unknown>;
}

export async function sendChatMessageApi(
  accessToken: string,
  message: string,
  conversationId?: string
): Promise<BackendChatResponse> {
  let token = accessToken;
  const requestBody = JSON.stringify({
    message,
    ...(conversationId ? { conversation_id: conversationId } : {}),
  });

  let res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: requestBody,
  });

  // If token is invalid or expired (e.g. stale dummy token from localStorage), re-authenticate and retry once
  if (res.status === 401) {
    try {
      const activeRole = (typeof window !== 'undefined' ? localStorage.getItem('campusone_active_role') : null) as UserRole | null;
      const creds = SEEDED_CREDENTIALS[activeRole && activeRole in SEEDED_CREDENTIALS ? activeRole : 'student'];
      const auth = await loginWithApi(creds);
      if (auth?.access_token) {
        token = auth.access_token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('campusone_access_token', auth.access_token);
          localStorage.setItem('campusone_refresh_token', auth.refresh_token);
        }
        res = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: requestBody,
        });
      }
    } catch {
      // Re-login failed, let the error handling below handle it
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Chat request failed with status ${res.status}`);
  }

  return await res.json();
}

export interface StreamHandlers {
  onStage?: (stageInfo: { stage: string; label?: string; detected_domains?: string[]; confidence?: number }) => void;
  onToken?: (token: string) => void;
  onDone?: (response: BackendChatResponse) => void;
  onError?: (error: Error) => void;
}

export async function sendChatMessageStreamApi(
  accessToken: string,
  message: string,
  conversationId?: string,
  handlers?: StreamHandlers
): Promise<BackendChatResponse> {
  let token = accessToken;
  const requestBody = JSON.stringify({
    message,
    ...(conversationId ? { conversation_id: conversationId } : {}),
  });

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: requestBody,
    });
  } catch {
    return sendChatMessageApi(accessToken, message, conversationId);
  }

  if (res.status === 401) {
    try {
      const activeRole = (typeof window !== 'undefined' ? localStorage.getItem('campusone_active_role') : null) as UserRole | null;
      const creds = SEEDED_CREDENTIALS[activeRole && activeRole in SEEDED_CREDENTIALS ? activeRole : 'student'];
      const auth = await loginWithApi(creds);
      if (auth?.access_token) {
        token = auth.access_token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('campusone_access_token', auth.access_token);
          localStorage.setItem('campusone_refresh_token', auth.refresh_token);
        }
        res = await fetch(`${API_BASE_URL}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: requestBody,
        });
      }
    } catch {
      // Re-login failed
    }
  }

  if (!res.ok || !res.body) {
    return sendChatMessageApi(accessToken, message, conversationId);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResponse: BackendChatResponse | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        if (!block.trim()) continue;
        const eventMatch = block.match(/event:\s*([^\n]+)/);
        const dataMatch = block.match(/data:\s*([^\n]+)/);
        const event = eventMatch ? eventMatch[1].trim() : 'message';
        const dataStr = dataMatch ? dataMatch[1].trim() : '';

        if (!dataStr) continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (event === 'stage') {
            handlers?.onStage?.(parsed);
          } else if (event === 'token') {
            handlers?.onToken?.(parsed.delta || '');
          } else if (event === 'done') {
            finalResponse = parsed as BackendChatResponse;
            handlers?.onDone?.(finalResponse);
          } else if (event === 'error') {
            handlers?.onError?.(new Error(parsed.error || 'Stream error'));
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }
  } catch (err: any) {
    handlers?.onError?.(err);
    if (!finalResponse) {
      return sendChatMessageApi(accessToken, message, conversationId);
    }
  }

  if (finalResponse) {
    return finalResponse;
  }
  return sendChatMessageApi(accessToken, message, conversationId);
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  environment: string;
  auth_provider: string;
}

export async function checkHealthApi(): Promise<BackendHealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }

  return await res.json();
}

export async function refreshAuthTokenApi(refreshToken: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Token refresh failed with status ${res.status}`);
  }

  return await res.json();
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export async function registerWithApi(payload: RegisterPayload): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Registration failed with status ${res.status}`);
  }

  return await res.json();
}

export interface BackendHistoryMessage {
  role: 'user' | 'assistant' | string;
  content: string;
}

export interface BackendChatHistoryResponse {
  thread_id: string;
  messages: BackendHistoryMessage[];
}

export async function fetchChatHistoryApi(accessToken: string): Promise<BackendChatHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/chat/history`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to load conversation history (${res.status})`);
  }

  return await res.json();
}

export interface QuickRepliesResponse {
  templates: string[];
  source: string;
}

export async function fetchQuickRepliesApi(
  accessToken: string,
  department: string,
  issueSummary: string,
  conversationSummary?: string,
  target: 'ticket_resolution' | 'chat_followup' = 'ticket_resolution'
): Promise<QuickRepliesResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/quick-replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        department,
        issue_summary: issueSummary,
        conversation_summary: conversationSummary,
        target,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch AI quick replies:', err);
  }

  return {
    templates: [
      `Verified with ${department} office. Action completed and recorded.`,
      `Work order dispatched to ${department} operational team.`,
      `Student profile and service configuration refreshed.`,
    ],
    source: 'client_fallback',
  };
}

