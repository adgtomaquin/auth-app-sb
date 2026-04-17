# auth-app-sb

A full-stack **JWT authentication dashboard** built with Next.js 15, React 18, and TypeScript. Features role-based access control (ADMIN / USER), a complete REST API client, and seven feature modules covering user management, audit logs, notifications, system settings, and an interactive API explorer.

> **Live repo:** https://github.com/adgtomaquin/auth-app-sb

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15.5.15 | React framework — App Router, file-based routing |
| React | 18.x | UI library — hooks, context, client components |
| TypeScript | 5.x | Type safety across all files |
| Tailwind CSS | 3.x | Utility-first CSS (minimal usage — mostly inline styles) |
| lucide-react | latest | Icon library |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/adgtomaquin/auth-app-sb.git
cd auth-app-sb

# 2. Install dependencies
npm install

# 3. Set API base URL (edit .env.local)
# NEXT_PUBLIC_API_URL=http://localhost:8080

# 4. Start development server
npm run dev
```

Open **http://localhost:3000** — the app redirects to `/login` automatically.

> **Windows PowerShell users:** If you get a script execution error, run this first:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@example.com | Admin@1234 |
| USER | user@example.com | User@1234 |

---

## Environment Variables

| File | Variable | Default | Description |
|---|---|---|---|
| `.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API base URL for local development |
| `.env.production` | `NEXT_PUBLIC_API_URL` | `https://api.example.com` | Backend API base URL for production |

---

## Available Scripts

```bash
npm run dev      # Start dev server with hot reload at http://localhost:3000
npm run build    # Create optimised production build
npm run start    # Serve the production build locally
npm run lint     # Run ESLint to check for code issues
```

---

## Routes

| URL | Access | Description |
|---|---|---|
| `/` | Public | Smart redirect → `/login` or appropriate dashboard |
| `/login` | Public | Login form |
| `/dashboard/admin` | ADMIN | Overview with stats and activity feed |
| `/dashboard/admin/users` | ADMIN | User management — list, invite, edit, delete |
| `/dashboard/admin/users/[id]` | ADMIN | Individual user detail and edit |
| `/dashboard/admin/audit-logs` | ADMIN | Filterable audit event history |
| `/dashboard/admin/settings` | ADMIN | System-wide configuration |
| `/dashboard/user` | USER | Personal overview with token info |
| `/dashboard/user/notifications` | USER | In-app notification centre |
| `/dashboard/user/settings` | USER | Personal preferences |
| `/api-docs` | Both | Interactive OpenAPI endpoint explorer |

---

## Project Structure

```
auth-app-sb/
│
├── app/                                # Next.js App Router — every folder = a route
│   ├── layout.tsx                      # Root layout
│   ├── globals.css                     # CSS design tokens + Tailwind directives
│   ├── page.tsx                        # Root redirect (/ → login or dashboard)
│   ├── login/
│   │   └── page.tsx                    # Login page
│   ├── api-docs/
│   │   └── page.tsx                    # API explorer (both roles)
│   └── dashboard/
│       ├── admin/
│       │   ├── page.tsx                # Admin overview
│       │   ├── users/
│       │   │   ├── page.tsx            # User management list
│       │   │   └── [id]/
│       │   │       └── page.tsx        # User detail / edit
│       │   ├── audit-logs/
│       │   │   └── page.tsx            # Audit log viewer
│       │   └── settings/
│       │       └── page.tsx            # System settings
│       └── user/
│           ├── page.tsx                # User overview
│           ├── notifications/
│           │   └── page.tsx            # Notifications centre
│           └── settings/
│               └── page.tsx            # User preferences
│
├── components/                         # Shared UI components
│   ├── NavBar.tsx                      # Top navigation bar
│   └── ui/
│       ├── Badge.tsx                   # Status / role colour chips
│       ├── EmptyState.tsx              # Empty list placeholder
│       ├── Modal.tsx                   # Overlay dialog
│       └── Pagination.tsx              # Page controls
│
├── lib/                                # Business logic and data layer
│   ├── api.ts                          # Central API client (all fetch calls)
│   ├── auth-context.tsx                # Global auth state (React Context)
│   ├── api-docs-meta.ts                # Re-export for API explorer metadata
│   ├── mock-api-docs.ts                # Static OpenAPI endpoint metadata
│   └── hooks/
│       ├── useNotifications.ts         # Notification state + actions hook
│       └── usePagination.ts            # Reusable pagination state hook
│
├── openapi.yaml                        # Full OpenAPI 3.0 specification
├── .env.local                          # Local dev environment variables
├── .env.production                     # Production environment variables
├── next.config.mjs                     # Next.js configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
└── package.json                        # Dependencies and scripts
```

---

## Detailed File Explanations

### `app/layout.tsx`
The **root layout** that wraps every page in the application. Loads Google Fonts (DM Serif Display, DM Mono, DM Sans), wraps the app in `<AuthProvider>` so every page can access the session, and sets the HTML `<head>` metadata. Runs on every route without re-mounting between navigations.

---

### `app/globals.css`
Defines the **design system** as CSS custom properties. All colours, fonts, and spacing tokens live here so the entire app can be re-themed by changing one file. Also contains `@tailwind` directives, scrollbar styles, and `animate-fade-up` / `stagger-N` animation classes used for page-load entrance effects.

Key tokens: `--bg`, `--surface`, `--surface-2` (background layers) · `--text`, `--text-muted`, `--text-dim` (text hierarchy) · `--accent` (gold highlight) · `--admin` (purple) · `--user` (green) · `--danger`, `--success`, `--warning` (status colours).

---

### `app/page.tsx`
The **root redirect**. Reads the session from `AuthContext` and immediately redirects — no session goes to `/login`, ADMIN role goes to `/dashboard/admin`, otherwise `/dashboard/user`. Nothing is visibly rendered; it shows a spinner while `isLoading` is true.

---

### `app/login/page.tsx`
The **login form**. Handles email/password input with show/hide toggle and a Remember Me checkbox (extends refresh token TTL to 30 days). On submit calls `authApi.login()`, saves the returned session to `sessionStorage` via `saveSession()`, updates `AuthContext`, then redirects based on roles. Displays error messages for wrong credentials, account lockout (423), and network failures.

---

### `app/dashboard/admin/page.tsx`
The **admin overview dashboard**. Fetches `GET /admin/stats` on mount showing four KPI cards (total users, active today, new this week, system load), a recent activity feed with colour-coded status icons, and a token configuration summary panel. A Refresh button re-fetches without a page reload. Protected — redirects non-admin users to the user dashboard.

---

### `app/dashboard/admin/users/page.tsx`
The **user management list**. Fetches `GET /users` with optional `status` and `search` query parameters. Features: real-time search, status filter tabs with live counts, 7-row pagination via `usePagination`, an Invite User modal (`POST /users`), an Edit User modal (`PATCH /users/{id}`) with inline error display, a lock/unlock toggle, and a two-step delete confirmation (`DELETE /users/{id}`).

---

### `app/dashboard/admin/users/[id]/page.tsx`
The **user detail page**. Uses Next.js dynamic routing — `[id]` receives the user ID from the URL. Fetches `GET /users/{id}`, displays stat cards (login count, last login, member since), and an edit form. Save calls `PATCH /users/{id}`. The Back button returns to the users list.

---

### `app/dashboard/admin/audit-logs/page.tsx`
The **audit log viewer**. Fetches `GET /audit-logs` and `GET /audit-logs/stats` simultaneously via `Promise.all`. Displays severity stats chips, a severity filter, a text search bar, and an expandable row table (click a row to reveal device and detail). Handles multiple response shapes — plain array, `{ logs, total }`, and Spring Boot's `Page<T>` format `{ content, totalElements }`.

---

### `app/dashboard/admin/settings/page.tsx`
The **system settings page**. Fetches `GET /settings/system` on mount, saves via `PATCH /settings/system`. Four tabs: Authentication, Token Policy, User Policy, System. Contains inline sub-components `Row`, `Toggle`, and `NumInput`. Save button shows a checkmark animation on success; Reset restores hardcoded defaults without calling the API.

---

### `app/dashboard/user/page.tsx`
The **user personal dashboard**. Fetches `GET /auth/me` for live profile data. Displays a profile card, an access token panel with a live countdown timer (updates every second, turns red under 25%), a copy-to-clipboard button, and a 7-day login activity bar chart.

---

### `app/dashboard/user/notifications/page.tsx`
The **notifications centre**. Uses the `useNotifications` hook which calls `GET /notifications` on mount and after mutations. Shows unread count badge, All / Unread filter tabs, and notification cards with type icons. Each card has Mark as Read (`PATCH /notifications/{id}`) and Delete (`DELETE /notifications/{id}`) actions. Mark All as Read calls `POST /notifications/read-all`.

---

### `app/dashboard/user/settings/page.tsx`
The **user preferences page**. Loads `GET /preferences` on mount. Three tabs: Profile (display name, timezone, language — email and department are read-only), Notifications (email alert toggles), and Appearance (theme picker). Saves via `PATCH /preferences`, stripping read-only fields before sending.

---

### `app/api-docs/page.tsx`
The **interactive API explorer**. Reads static metadata from `lib/mock-api-docs.ts`. Shows Endpoints tab (collapsible with parameter tables and response codes) and Schemas tab. The "Try It Out" panel sends real `fetch()` requests to `NEXT_PUBLIC_API_URL` and displays the live response. Accessible to both roles.

---

### `components/NavBar.tsx`
The **top navigation bar**. Highlights the active link via `usePathname()`. Fetches unread notification count from `GET /notifications` on mount and after route changes, showing a red badge on the Notifications link. Renders different link sets for ADMIN vs USER. The avatar dropdown shows role badges and a Sign Out button that calls `authApi.logout()` before clearing the session.

---

### `components/ui/Badge.tsx`
A **reusable status chip**. Accepts a `variant` prop (`admin`, `user`, `active`, `inactive`, `locked`, `pending`, `info`, `warning`, `danger`, `success`, `neutral`) and applies the matching colour scheme. Used across all modules for role labels, account status, notification type, and audit severity.

---

### `components/ui/Modal.tsx`
A **focus-trapped overlay dialog**. Closes on backdrop click or `Escape` key. Accepts `open`, `onClose`, `title`, `children`, and optional `width` props. Used for Invite, Edit, and Delete Confirmation flows. Animates in with a scale-and-fade entrance.

---

### `components/ui/Pagination.tsx`
**Page controls** with smart ellipsis. Works directly with `usePagination` — receives `page`, `totalPages`, `onPrev`, `onNext`, `onPage`, `total`, and `pageSize`. The active page uses the accent colour.

---

### `components/ui/EmptyState.tsx`
A **centred empty-list placeholder**. Accepts `icon`, `title`, `description`, and optional `action`. Shown when filtered results return zero items.

---

### `lib/api.ts`
The **central API client** — the most important file in the project. Every network call goes through here.

- `API_BASE` — reads `NEXT_PUBLIC_API_URL` (fallback: `http://localhost:8080`)
- `request<T>()` — generic typed fetch wrapper with auth headers, JSON parsing, 204 handling, error extraction, and dev-mode console logging
- `saveSession()`, `getSession()`, `clearSession()` — session management via `sessionStorage`
- All TypeScript interfaces mirroring the OpenAPI spec: `UserProfile`, `ManagedUser`, `Notification`, `AuditLog`, `SystemSettings`, `UserPreferences`, etc.
- API namespaces: `authApi`, `usersApi`, `notificationsApi`, `auditApi`, `settingsApi`, `preferencesApi`
- Static reference data: `departments`, `timezones`, `languages`

To connect a different backend, change `.env.local` only — no page code changes required.

---

### `lib/auth-context.tsx`
The **global authentication state** via React Context. `AuthProvider` wraps the app in `layout.tsx`. On first render it reads from `sessionStorage`. `useAuth()` exposes `session`, `setSession`, `logout`, and `isLoading`. Calling `logout()` clears storage and sets `session` to `null`, triggering re-renders across all subscribed components.

---

### `lib/hooks/useNotifications.ts`
A **React hook** for notification state. Takes the current `access_token` as its argument. Manages `items`, `unreadCount`, `loading`, and `error`. Exposes `refresh()`, `read(id)`, `readAll()`, and `remove(id)` — each calls the API then re-fetches the full list. Used by the notifications page and the NavBar badge.

---

### `lib/hooks/usePagination.ts`
A **reusable pagination hook**. Takes an array and page size, returns `page`, `totalPages`, `pageItems` (current page slice via `useMemo`), `setPage`, `hasPrev`, `hasNext`, `prev`, and `next`. Used by the users list and audit logs pages.

---

### `lib/mock-api-docs.ts`
**Static API explorer metadata** — not mock data. Contains `API_ENDPOINTS` (method, path, tag, description, parameters, response codes) and `API_SCHEMAS` (request/response shapes) derived from `openapi.yaml`. The only non-API file intentionally kept as static data since endpoint documentation is not served by the backend.

---

### `openapi.yaml`
The **full OpenAPI 3.0 specification** — 14 paths, 28 schemas, 7 tag groups. Paste into [editor.swagger.io](https://editor.swagger.io) or import into Postman to generate an interactive API client. Keep in sync with your backend implementation.

---

## API Overview

All endpoints require `Authorization: Bearer <access_token>` except `/auth/login` and `/auth/refresh`.

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate, receive token pair |
| POST | `/auth/refresh` | Public | Rotate tokens |
| POST | `/auth/logout` | Any | Revoke session |
| GET | `/auth/me` | Any | Current user profile |
| GET | `/users` | ADMIN | List users |
| POST | `/users` | ADMIN | Invite user |
| GET | `/users/{id}` | ADMIN | User detail |
| PATCH | `/users/{id}` | ADMIN | Update user |
| DELETE | `/users/{id}` | ADMIN | Delete user |
| GET | `/notifications` | Any | User notifications |
| POST | `/notifications/read-all` | Any | Mark all read |
| PATCH | `/notifications/{id}` | Any | Mark one read |
| DELETE | `/notifications/{id}` | Any | Delete notification |
| GET | `/audit-logs` | ADMIN | Audit log list |
| GET | `/audit-logs/stats` | ADMIN | Severity counts |
| GET | `/settings/system` | ADMIN | System settings |
| PATCH | `/settings/system` | ADMIN | Update settings |
| GET | `/preferences` | Any | User preferences |
| PATCH | `/preferences` | Any | Update preferences |
| GET | `/admin/stats` | ADMIN | Dashboard statistics |

See `openapi.yaml` for full request/response schemas.

---

## Contributing

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, then stage and commit
git add .
git commit -m "feat: describe your change"

# Push and open a pull request
git push origin feature/your-feature-name
```

