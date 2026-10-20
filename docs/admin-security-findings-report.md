# LAURREL SERVICES — CUSTOM ADMIN PLATFORM
## Module 01 Security Findings & Architecture Audit Report

**Date:** 2026-10-20  
**Branch:** `feat/admin-module-01`  
**Scope:** Pre-implementation security audit of existing administrative authentication, session management, routing, and database patterns.

---

### Executive Summary

An in-depth review of the current administration implementation was conducted across `src/app/admin`, `src/app/api/admin`, `src/lib/auth`, and `backend/src`. While foundational tables and routes exist, several critical architectural and security vulnerabilities were identified that must be remediated for production-grade operational security.

---

### Detailed Findings & Remediations

| # | Vulnerability / Deficiency | Location | Severity | Concrete Remediation Plan |
|---|---|---|---|---|
| **1** | **Deterministic Fallback Session Secret** | `src/lib/auth/session.ts` (line 24) | **Critical** | Fail closed in production: throw an explicit error if `ADMIN_SESSION_SECRET` is unset. In local development without configuration, use an ephemeral cryptographically generated key per process. |
| **2** | **Hardcoded Env-Variable Login Bypass** | `src/app/api/admin/auth/login/route.ts` & `backend/src/routes/admin.ts` | **High** | Remove runtime environment-variable passwords (`ADMIN_OWNER_PASSWORD`). All authentication must query the Neon PostgreSQL database. Implement a one-time, deliberate bootstrap CLI command (`npm run admin:bootstrap`) that never overwrites existing passwords. |
| **3** | **Plaintext Token Logging** | `backend/src/routes/admin.ts` (line 86) | **High** | Completely eliminate password reset token printing in logs. Store only SHA-256 hashes of single-use, time-limited tokens in the database. |
| **4** | **Misleading Password Recovery Feedback** | `src/app/api/admin/auth/recover/route.ts` & `backend/src/routes/admin.ts` | **Medium** | When transactional email (Resend/SMTP) is not configured, do not claim recovery emails were delivered. Return an honest response that self-service recovery is currently disabled and direct the user to authorized staff. |
| **5** | **Client-Controlled Author Identity** | `src/app/api/admin/[...slug]/route.ts` & `backend/src/routes/admin.ts` | **High** | Do not accept `author` or `user` fields from request payloads. Derive author identity strictly from the verified session token on the server. Forward verified identity headers (`x-admin-user-id`, `x-admin-role`) from Next.js server to backend. |
| **6** | **Missing Server-Side Role Enforcement** | `backend/src/routes/admin.ts` & `backend/src/middleware/auth.ts` | **High** | Implement strict Role-Based Access Control (RBAC) middleware verifying permissions against 5 defined roles: `owner`, `admin`, `content_editor`, `operations_staff`, `viewer`. Map legacy `dispatcher` to `operations_staff`. |
| **7** | **Permissive Wildcard CORS Fallthrough** | `backend/src/index.ts` (lines 32–35) | **High** | Replace open `callback(null, true)` with a strict explicit allowlist: `https://laurrel.netlify.app`, `process.env.FRONTEND_ORIGIN`, `http://localhost:3000`, `http://127.0.0.1:3000`. Reject arbitrary `.netlify.app` subdomains. |
| **8** | **Concealing Outages via Local File Fallbacks** | `src/app/api/admin/[...slug]/route.ts` | **Medium** | Eliminate silent fallback to local JSON files when backend requests fail. Return genuine HTTP 502/503 errors and display an honest error banner with a retry button in the admin interface. |
| **9** | **Irrevocable Stateless Sessions** | `src/lib/auth/session.ts` | **High** | Introduce an `admin_sessions` table in PostgreSQL. Store session IDs, user IDs, expiration, and revocation timestamps. Allow immediate revocation on logout or account deactivation. |
| **10** | **Unbounded/Truncated Aggregation Queries** | `backend/src/routes/admin.ts` (line 103) | **Low** | Replace in-memory array filtering of 500 records with genuine database SQL aggregation (`SELECT status, count(*) FROM enquiries GROUP BY status`). |

---

### Additional Architectural Requirements

- **Route Restructuring:** Split monolithic `src/app/admin/page.tsx` into:
  - `/admin/login`: Dedicated editorial login interface with show/hide password toggle.
  - `/admin`: Authenticated Business Overview dashboard with real DB aggregation.
  - `/admin/enquiries`: Preserved and reorganised customer enquiries & AI handoff management.
- **Application Shell:** Reusable layout with ~248px left sidebar, official Laurrel logo, compact top header, and role-based navigation.
- **Hide Public Assistant:** Suppress `LaurrelAssistantLauncher` on all administrative routes (`/admin/*`).
- **Brand Consistency:** Strict adoption of official approved `#49056B` (Brand Purple), `#FE6000` (Orange), `#F8F7F4` (Warm White), and Manrope typography.
