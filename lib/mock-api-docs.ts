export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type EndpointStatus = "stable" | "beta" | "deprecated";

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  tag: string;
  summary: string;
  description: string;
  status: EndpointStatus;
  requiresAuth: boolean;
  requestBody?: ApiParam[];
  responses: { code: number; description: string }[];
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "login",
    method: "POST",
    path: "/auth/login",
    tag: "Authentication",
    summary: "Authenticate and obtain tokens",
    description: "Validates credentials and returns a short-lived JWT access token plus a longer-lived opaque refresh token. After 5 failed attempts the account is soft-locked for 15 minutes.",
    status: "stable",
    requiresAuth: false,
    requestBody: [
      { name: "email",       type: "string",  required: true,  description: "User email address",          example: "admin@example.com" },
      { name: "password",    type: "string",  required: true,  description: "Minimum 8 characters",        example: "Admin@1234" },
      { name: "remember_me", type: "boolean", required: false, description: "Extends refresh TTL to 30d",  example: "false" },
    ],
    responses: [
      { code: 200, description: "Login successful — returns TokenResponse" },
      { code: 401, description: "Invalid credentials" },
      { code: 422, description: "Validation error — missing or malformed fields" },
      { code: 423, description: "Account locked due to repeated failures" },
      { code: 500, description: "Internal server error" },
    ],
  },
  {
    id: "refresh",
    method: "POST",
    path: "/auth/refresh",
    tag: "Authentication",
    summary: "Exchange refresh token for a new token pair",
    description: "Issues a new access token and rotates the refresh token. The old token is immediately revoked. Replay detection: if a previously revoked token is submitted, all sessions are cleared.",
    status: "stable",
    requiresAuth: false,
    requestBody: [
      { name: "refresh_token", type: "string", required: true, description: "Opaque UUID refresh token", example: "550e8400-e29b-41d4-a716-446655440000" },
    ],
    responses: [
      { code: 200, description: "New token pair issued" },
      { code: 401, description: "Token invalid, expired, revoked, or replayed" },
      { code: 422, description: "Validation error" },
      { code: 500, description: "Internal server error" },
    ],
  },
  {
    id: "logout",
    method: "POST",
    path: "/auth/logout",
    tag: "Authentication",
    summary: "Revoke session and invalidate refresh token",
    description: "Revokes the provided refresh token. The access token remains valid until natural expiry (15 min). Set logout_all_devices: true to terminate all active sessions.",
    status: "stable",
    requiresAuth: true,
    requestBody: [
      { name: "refresh_token",      type: "string",  required: true,  description: "The refresh token to revoke" },
      { name: "logout_all_devices", type: "boolean", required: false, description: "If true, revokes ALL sessions for this user", example: "false" },
    ],
    responses: [
      { code: 204, description: "Logout successful" },
      { code: 401, description: "Missing or invalid access token" },
      { code: 422, description: "Validation error" },
      { code: 500, description: "Internal server error" },
    ],
  },
  {
    id: "getMe",
    method: "GET",
    path: "/auth/me",
    tag: "Session",
    summary: "Get current authenticated user profile",
    description: "Returns the profile of the currently authenticated user, derived from the JWT access token claims. No request body needed.",
    status: "stable",
    requiresAuth: true,
    responses: [
      { code: 200, description: "Returns UserProfileResponse" },
      { code: 401, description: "Missing, expired, or invalid access token" },
      { code: 403, description: "Insufficient permissions" },
      { code: 500, description: "Internal server error" },
    ],
  },
];

export const API_SCHEMAS = [
  {
    name: "LoginRequest",
    fields: [
      { name: "email",       type: "string (email)",  required: true  },
      { name: "password",    type: "string (≥8 chars)", required: true  },
      { name: "remember_me", type: "boolean",          required: false },
    ],
  },
  {
    name: "TokenResponse",
    fields: [
      { name: "access_token",      type: "string (JWT)",   required: true  },
      { name: "refresh_token",     type: "string (UUID)",  required: true  },
      { name: "token_type",        type: "Bearer",         required: true  },
      { name: "expires_in",        type: "integer (sec)",  required: true  },
      { name: "refresh_expires_in",type: "integer (sec)",  required: true  },
    ],
  },
  {
    name: "UserProfileResponse",
    fields: [
      { name: "id",         type: "string (UUID)",     required: true  },
      { name: "email",      type: "string (email)",    required: true  },
      { name: "roles",      type: "string[]",          required: true  },
      { name: "created_at", type: "string (ISO 8601)", required: true  },
    ],
  },
];
