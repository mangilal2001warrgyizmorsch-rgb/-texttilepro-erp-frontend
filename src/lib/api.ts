const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://texttilepro-erp-backend.onrender.com/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API Error: ${res.status}`);
  }

  return res.json();
}

// Convenience methods
export const api = {
  get: <T = unknown>(endpoint: string) => apiFetch<T>(endpoint),
  post: <T = unknown>(endpoint: string, data: unknown) =>
    apiFetch<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: <T = unknown>(endpoint: string, data: unknown) =>
    apiFetch<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T = unknown>(endpoint: string, data: unknown) =>
    apiFetch<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T = unknown>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: "DELETE" }),
};
