import { auth } from "@clerk/nextjs/server";

/**
 * Make authenticated backend requests using Clerk session token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { getToken } = await auth();
  
  // Get the session token
  const token = await getToken();
  
  if (!token) {
    throw new Error("No authentication token available");
  }
  
  // Add Authorization header with Bearer token
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  
  // Include other important headers
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper to make authenticated GET requests
 */
export async function authenticatedGet<T = unknown>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper to make authenticated POST requests
 */
export async function authenticatedPost<T = unknown>(
  url: string,
  body: unknown
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Verify a Clerk session token (for use in API routes)
 */
export async function verifyToken() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    throw new Error("Invalid token");
  }
  
  return {
    userId,
    sessionClaims,
  };
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const { sessionClaims, orgRole } = await auth();
  
  return (
    sessionClaims?.metadata?.role === role ||
    orgRole === `org:${role}`
  );
}

/**
 * Protect a server action or function with role-based access
 */
export async function requireRole(role: string) {
  const authorized = await hasRole(role);
  
  if (!authorized) {
    throw new Error(`Unauthorized: ${role} role required`);
  }
}

/**
 * Get organization-specific headers for backend requests
 */
export async function getOrgHeaders(): Promise<Headers> {
  const { orgId, orgSlug, orgRole } = await auth();
  
  const headers = new Headers();
  
  if (orgId) {
    headers.set('X-Organization-Id', orgId);
  }
  
  if (orgSlug) {
    headers.set('X-Organization-Slug', orgSlug);
  }
  
  if (orgRole) {
    headers.set('X-Organization-Role', orgRole);
  }
  
  return headers;
}