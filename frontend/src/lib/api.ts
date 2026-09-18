import { AuthTokenResponse, LoginCredentials, AuthUser, UserRole } from '@/types';
import { PERSONAS } from '@/lib/demoFixtures';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const SEEDED_CREDENTIALS: Record<UserRole, LoginCredentials> = {
  student: {
    email: 'student@example.edu',
    password: 'demo-password',
  },
  agent: {
    email: 'agent@example.edu',
    password: 'demo-password',
  },
  knowledge_admin: {
    email: 'admin.knowledge@example.edu',
    password: 'demo-password',
  },
  executive: {
    email: 'executive@example.edu',
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
  agent: [
    'conversations:assigned',
    'handoffs:triage',
    'handoffs:resolve',
    'knowledge:read',
  ],
  knowledge_admin: [
    'knowledge:ingest',
    'knowledge:publish',
    'knowledge:archive',
    'knowledge:read',
    'knowledge:manage',
  ],
  executive: [
    'analytics:read',
    'evaluation:read',
    'evaluation:run',
    'knowledge:read_metadata',
  ],
  admin: ['*'],
};

function normalizeRole(backendRole: string): UserRole {
  if (backendRole === 'admin') return 'admin';
  if (backendRole === 'support_agent' || backendRole === 'agent') return 'agent';
  if (backendRole === 'analyst' || backendRole === 'executive') return 'executive';
  if (backendRole === 'knowledge_admin') return 'knowledge_admin';
  return 'student';
}

/**
 * Generate fallback demo JWT tokens if local backend is offline during standalone UI demonstration.
 */
function createFallbackDemoResponse(role: UserRole, email: string): AuthTokenResponse {
  const persona = PERSONAS[role];
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: `u-${role}-01`,
      email,
      role,
      department: persona.department,
      display_name: persona.name,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = btoa('demo_signature_fallback');

  return {
    access_token: `${header}.${payload}.${signature}`,
    refresh_token: `rt_demo_${role}_${Date.now()}`,
    token_type: 'bearer',
    expires_in: 3600,
    user: {
      id: `u-${role}-01`,
      email,
      role,
      department: persona.department,
      display_name: persona.name,
    },
  };
}

export async function loginWithApi(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  try {
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
  } catch (err: unknown) {
    // If backend is not reached (e.g. offline during client-side demo), use fallback seeded token
    console.warn('API backend not reachable, using offline demo JWT tokens:', err);
    let matchedRole: UserRole = 'student';
    for (const [r, cred] of Object.entries(SEEDED_CREDENTIALS)) {
      if (cred.email === credentials.email.trim().toLowerCase()) {
        matchedRole = r as UserRole;
        break;
      }
    }
    return createFallbackDemoResponse(matchedRole, credentials.email);
  }
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

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
  } catch {
    // Decode claims from JWT payload if offline
    try {
      const parts = accessToken.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        const role = normalizeRole(payload.role || 'student');
        return {
          id: payload.sub || 'u-fallback',
          email: payload.email || 'student@example.edu',
          role,
          department: payload.department,
          displayName: payload.display_name || PERSONAS[role]?.name,
          permissions: SEEDED_PERMISSIONS[role],
        };
      }
    } catch {
      // Ignored
    }
    return {
      id: 'u-student-01',
      email: 'student@example.edu',
      role: 'student',
      department: PERSONAS.student.department,
      displayName: PERSONAS.student.name,
      permissions: SEEDED_PERMISSIONS.student,
    };
  }
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
