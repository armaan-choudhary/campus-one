import { AuthTokenResponse, LoginCredentials, AuthUser, UserRole } from '@/types';
import { PERSONAS } from '@/lib/demoFixtures';

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
  metadata?: Record<string, any>;
}

export interface BackendChatResponse {
  answer: string;
  thread_id: string;
  ticket_id?: string | null;
  ticket?: Record<string, any> | null;
  detected_domains: string[];
  intent?: string | null;
  routing_confidence: number;
  solved: boolean;
  human_required: boolean;
  handoff_reason?: string | null;
  sources: string[];
  retrieved_chunks: BackendRetrievedChunk[];
  metadata?: Record<string, any>;
}

export async function sendChatMessageApi(
  accessToken: string,
  message: string
): Promise<BackendChatResponse> {
  let token = accessToken;

  let res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
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
          body: JSON.stringify({ message }),
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

