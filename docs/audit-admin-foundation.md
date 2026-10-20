# LAURREL SERVICES — CUSTOM ADMIN PLATFORM
## Module 01 Audit: Administration Foundation, Authentication & Application Shell

**Date:** 2026-10-16  
**Repository Commit:** `9d54412` (*feat(cms): connect Sanity project 5nupsg0g, configure on-demand revalidation, enhance schemas, and generate seed dataset*)  
**Scope:** Review of existing administrative codebase, security analysis, reusable components, and migration roadmap for Module 01.

---

### 1. Existing Implementation Inventory

| Component / File | Current Status & Behavior | Reuse / Migration Decision |
|---|---|---|
| `src/app/admin/page.tsx` | Single 844-line client-side page combining inline login, password recovery modal, metrics counters, enquiries split-view list, and AI handoff tab. | Refactor into modular architecture: separate dedicated `/admin/login`, modular sidebar/header shell, dedicated `/admin` Overview page. |
| `src/app/api/admin/auth/login/route.ts` | Next.js API route verifying against Render backend or fallback `ADMIN_OWNER_PASSWORD`. Sets HttpOnly cookie `laurrel_admin_session`. | Harden: remove static credentials fallback in production, enforce Argon2id/scrypt verification via backend, add IP/email rate limiting & lockout. |
| `src/app/api/admin/auth/logout/route.ts` | Clears `laurrel_admin_session` cookie with expired date. | Retain and extend: invalidate server session token / revocation record if applicable. |
| `src/app/api/admin/auth/me/route.ts` | Decodes HMAC session cookie and returns `{ authenticated, user }`. | Retain and expand to include granular user role and permission matrix. |
| `src/app/api/admin/auth/recover/route.ts` | Returns generic neutral message; forwards to backend. | Update to conform to strict requirement: if transactional email is not configured, do not simulate delivery; mark clearly as unavailable. |
| `src/app/api/admin/[...slug]/route.ts` | Catch-all proxy forwarding requests to Render backend with `x-admin-token` header, with local JSON file fallback. | Update: enforce server session validation, pass authenticated user identity & role headers to backend rather than treating API secret as user identity. |
| `src/lib/auth/session.ts` | Signs/verifies base64url HMAC token using `crypto.createHmac('sha256')`. Has hardcoded fallback secret if env is unset. | Critical Fix: eliminate predictable fallback secret. Enforce cryptographically strong signing key with strict environment validation. |
| `backend/src/routes/admin.ts` | Express router handling `/api/admin/auth/login`, `/stats`, `/enquiries`, `/enquiries/:id/status`, and `/handoffs`. | Upgrade: add role-based permission middleware (RBAC), rate limiting, and decouple server-to-server token from employee identity. |
| `backend/src/middleware/auth.ts` | Verifies `ADMIN_API_SECRET` from `Authorization: Bearer` or `x-admin-token`. | Split into two layers: (1) Server-to-server gateway token verification (`x-admin-token`), and (2) Employee session identity and RBAC permission checks. |
| `backend/src/database/schema.sql` | Contains tables for `admin_users`, `enquiries`, `enquiry_notes`, `ai_handoffs`, `quotes`, `invoices`, and `audit_logs`. | Safe extension: alter `admin_users` table to support extended roles (`owner`, `admin`, `content_editor`, `operations_staff`, `viewer`) and session lockout counters. |
| `backend/src/database/adminRepo.ts` | Uses Node `scryptSync` with salt:hash format. Auto-overwrites existing owner on conflict. | Critical Fix: Upgrade to Argon2id / verified scrypt with timing-safe comparison, prevent overwriting existing accounts (`ON CONFLICT (email) DO NOTHING`), implement deliberate CLI/script bootstrap. |
| `backend/src/database/enquiryRepo.ts` | Parameterized SQL queries with Postgres pool + local JSON fallback. Fully preserves status updates and internal notes. | Retain intact; ensures zero loss of existing enquiry records. |
| Shared Design Tokens | `tailwind.config.ts`, `globals.css`: Primary purple `#390044`, Lime accent `#C8E80B`, Warm white `#F8F7F4`, Dark ink `#202024`, font `Manrope`. | Reused directly without modifying global brand values or introducing unauthorized display fonts. |

---

### 2. Critical Security Risks & Deficiencies Identified

1. **Predictable Fallback Signing Secret:**  
   `src/lib/auth/session.ts` line 24 defaults to `'laurrel-operations-fallback-session-secret-2026'` if `ADMIN_SESSION_SECRET` is undefined. In production, this allows forged session cookies.  
   *Mitigation:* Fail securely with an explicit startup error if no strong signing secret is configured in production.

2. **Shared API Secret Used as User Identity:**  
   The catch-all proxy in Next.js forwards `x-admin-token: process.env.ADMIN_API_SECRET`. Backend routes currently assume any request with this token is an authorized admin without verifying the specific employee's role.  
   *Mitigation:* The frontend proxy must pass the verified user session (ID, email, name, role) in authenticated request headers (e.g. `x-admin-user-id`, `x-admin-role`), and backend routes must enforce role permissions.

3. **Account Overwrite Vulnerability in Repository:**  
   `backend/src/database/adminRepo.ts` executes `INSERT INTO admin_users ... ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`. Any startup with an environment variable could wipe a real owner's updated password.  
   *Mitigation:* Switch to `ON CONFLICT (email) DO NOTHING`. Bootstrapping must only execute when zero owner accounts exist or via explicit CLI bootstrap command.

4. **Absence of Rate Limiting & Account Lockout:**  
   The login endpoint lacks brute-force throttling, exposing administrator accounts to automated dictionary attacks.  
   *Mitigation:* Implement IP and account-level attempt tracking with exponential backoff / temporary lockout after 5 failed attempts.

5. **Coupled Login and Dashboard Screen:**  
   Currently, loading `/admin` displays a loading spinner and then dynamically switches between the login form and dashboard on the client side.  
   *Mitigation:* Build a dedicated `/admin/login` page with accessible form validation, password visibility toggle, and server-side redirect if already authenticated.

---

### 3. Reusable Components & Architectural Assets

- **Neon PostgreSQL Connection Pool & Schema:** The database connection is healthy, SSL configured, and `admin_users`, `enquiries`, `ai_handoffs`, and `audit_logs` are pre-provisioned.
- **Enquiry Domain Logic:** The status transition logic (`new` -> `reviewed` -> `quoted` -> `scheduled` -> `closed`) and internal note recording are solid and parameterized.
- **Brand Tokens & Typography:** Centralized in `tailwind.config.ts` and `src/app/globals.css` with Google Fonts `Manrope`.
- **Lucide Icons:** Authentic established iconography already imported throughout.

---

### 4. Migration & Implementation Approach (Module 01)

1. **Database Schema & Model Extension:**  
   Extend `admin_users` table with standard roles: `owner`, `admin`, `content_editor`, `operations_staff`, `viewer`, plus failed login attempt counters and lockout timestamps. Ensure migration is non-destructive and forward-compatible.

2. **Production-Grade Password Hashing & Bootstrapping:**  
   Use standard, cryptographically secure password hashing (Argon2id or production-hardened scrypt with high work factor). Provide a dedicated bootstrap script (`npm run admin:bootstrap`) that creates the initial owner account without printing secrets or hardcoding passwords.

3. **Authentication API & Session Hardening:**  
   - Enforce HttpOnly, Secure, SameSite=Lax session cookies with HMAC signatures.
   - Implement login rate limiting and lockout.
   - Log security events (login success, failure, lockout, logout) to `audit_logs` table without recording passwords or tokens.
   - Dedicated `/admin/login` page with full accessibility and password visibility toggle.

4. **Server-Side Role-Based Access Control (RBAC):**  
   Define permissions matrix for each of the 5 roles. Backend checks permissions before executing queries (e.g. `viewer` cannot edit status; only `owner` and `admin` can manage team/settings).

5. **Admin Application Shell & Overview Page:**  
   - Left collapsible navigation sidebar (240–260px desktop) with designated 12 modules (active modules functional, future modules clearly disabled without fake UIs).
   - Compact upper header with account dropdown and quick actions.
   - Dedicated `/admin` Overview page rendering real counts from backend: Total enquiries, New enquiries, Enquiries under review, Pending AI handoffs, and recent enquiries table.
   - Responsive drawer for mobile (360px–768px).
