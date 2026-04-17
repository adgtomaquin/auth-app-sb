// lib/api.ts
// All API calls go through this file.
// Base URL is set by NEXT_PUBLIC_API_URL (see .env.local / .env.production).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 204) return { status: 204 };

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: json.message ?? json.error ?? "Request failed",
        status: res.status,
      };
    }

    return { data: json as T, status: res.status };
  } catch (err) {
    return { error: "Network error — is the API server running?", status: 0 };
  }
}

// ─── Types (mirrors OpenAPI spec) ────────────────────────────────────────────
export type Role = "ADMIN" | "USER";
export type UserStatus = "active" | "inactive" | "locked" | "pending";
export type NotifType = "security" | "system" | "info" | "warning";
export type AuditSeverity = "info" | "warning" | "critical";
export type AuditAction =
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "LOGOUT_ALL"
  | "TOKEN_REFRESH" | "TOKEN_EXPIRED" | "PASSWORD_CHANGE" | "PASSWORD_RESET"
  | "USER_CREATED" | "USER_UPDATED" | "USER_DELETED" | "USER_LOCKED" | "USER_UNLOCKED"
  | "SETTINGS_CHANGED" | "INVITE_SENT";
export type Theme = "dark" | "light" | "system";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  roles: Role[];
  department?: string;
  lastLogin?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_expires_in: number;
}

export interface LoginResponseData extends TokenResponse {
  user: UserProfile;
}

export interface Session {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  department: string;
  joined: string;
  lastLogin: string;
  avatar: string;
  loginCount: number;
}

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  userId: string;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  severity: AuditSeverity;
  actor: string;
  target?: string;
  ip: string;
  location: string;
  device: string;
  timestamp: string;
  details: string;
}

export interface SystemSettings {
  lockoutThreshold: number;
  lockoutDurationMinutes: number;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  rememberMeTtlDays: number;
  requireMfa: boolean;
  allowedDomains: string;
  sessionConcurrencyLimit: number;
  auditRetentionDays: number;
}

export interface UserPreferences {
  displayName: string;
  email: string;
  department: string;
  timezone: string;
  language: string;
  emailOnNewLogin: boolean;
  emailOnPasswordChange: boolean;
  emailOnTokenExpiry: boolean;
  compactMode: boolean;
  theme: Theme;
}

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  systemLoad: number;
  recentActivity: {
    id: number;
    user: string;
    action: string;
    time: string;
    status: "success" | "failed" | "warning";
  }[];
}

export interface AuditStats {
  total: number;
  info: number;
  warning: number;
  critical: number;
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string, remember_me = false) =>
    request<LoginResponseData>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember_me }),
    }),

  refresh: (refresh_token: string) =>
    request<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  logout: (token: string, refresh_token: string, logout_all_devices = false) =>
    request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token, logout_all_devices }),
    }, token),

  me: (token: string) =>
    request<UserProfile>("/auth/me", { method: "GET" }, token),
};

// ─── Session helpers (sessionStorage) ────────────────────────────────────────
export function saveSession(data: LoginResponseData): Session {
  const session: Session = {
    user: data.user,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  if (typeof window !== "undefined") {
    sessionStorage.setItem("auth_session", JSON.stringify(session));
  }
  return session;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("auth_session");
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { return null; }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("auth_session");
  }
}

// ─── User management endpoints ────────────────────────────────────────────────
export const usersApi = {
  list: (token: string, params?: { status?: UserStatus; search?: string; page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status)    qs.set("status", params.status);
    if (params?.search)    qs.set("search", params.search);
    if (params?.page)      qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString() ? `?${qs}` : "";
    return request<{ users: ManagedUser[]; total: number }>(`/users${query}`, { method: "GET" }, token);
  },

  getById: (token: string, id: string) =>
    request<ManagedUser>(`/users/${id}`, { method: "GET" }, token),

  invite: (token: string, data: { name: string; email: string; department: string; roles: Role[] }) =>
    request<ManagedUser>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  update: (token: string, id: string, patch: Partial<ManagedUser>) =>
    request<ManagedUser>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }, token),

  delete: (token: string, id: string) =>
    request(`/users/${id}`, { method: "DELETE" }, token),

  getAdminStats: (token: string) =>
    request<AdminStats>("/admin/stats", { method: "GET" }, token),
};

// ─── Notifications endpoints ──────────────────────────────────────────────────
export const notificationsApi = {
  list: (token: string, unread_only = false) => {
    const qs = unread_only ? "?unread_only=true" : "";
    return request<{ notifications: Notification[]; unreadCount: number }>(
      `/notifications${qs}`, { method: "GET" }, token
    );
  },

  markRead: (token: string, id: string) =>
    request(`/notifications/${id}`, { method: "PATCH" }, token),

  markAllRead: (token: string) =>
    request("/notifications/read-all", { method: "POST" }, token),

  delete: (token: string, id: string) =>
    request(`/notifications/${id}`, { method: "DELETE" }, token),
};

// ─── Audit logs endpoints ─────────────────────────────────────────────────────
export const auditApi = {
  list: (token: string, params?: {
    severity?: AuditSeverity | "all";
    action?: AuditAction | "all";
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.severity && params.severity !== "all") qs.set("severity", params.severity);
    if (params?.action && params.action !== "all")     qs.set("action", params.action);
    if (params?.search)    qs.set("search", params.search);
    if (params?.page)      qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString() ? `?${qs}` : "";
    return request<{ logs: AuditLog[]; total: number }>(`/audit-logs${query}`, { method: "GET" }, token);
  },

  stats: (token: string) =>
    request<AuditStats>("/audit-logs/stats", { method: "GET" }, token),
};

// ─── System settings endpoints ────────────────────────────────────────────────
export const settingsApi = {
  get: (token: string) =>
    request<SystemSettings>("/settings/system", { method: "GET" }, token),

  update: (token: string, patch: Partial<SystemSettings>) =>
    request<SystemSettings>("/settings/system", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }, token),
};

// ─── User preferences endpoints ───────────────────────────────────────────────
export const preferencesApi = {
  get: (token: string) =>
    request<UserPreferences>("/preferences", { method: "GET" }, token),

  update: (token: string, patch: Partial<Omit<UserPreferences, "email" | "department">>) =>
    request<UserPreferences>("/preferences", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }, token),
};

// ─── Static reference data (not from API) ────────────────────────────────────
export const departments = [
  "Engineering", "Marketing", "Sales", "Finance", "IT",
  "HR", "Legal", "Design", "Product", "Operations",
];

export const timezones = [
  "Asia/Manila", "Asia/Singapore", "Asia/Tokyo", "Asia/Bangkok",
  "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris",
];

export const languages = [
  { code: "en",  label: "English" },
  { code: "fil", label: "Filipino" },
  { code: "ja",  label: "Japanese" },
  { code: "zh",  label: "Chinese (Simplified)" },
];
