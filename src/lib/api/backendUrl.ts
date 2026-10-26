/**
 * LAURREL SERVICES — BACKEND API URL RESOLVER WITH PREVIEW ISOLATION GUARD
 *
 * Resolves the backend API URL for Next.js API routes and server components.
 * Enforces strict isolation in preview environments:
 * Prevents Deploy Preview #5 from ever falling back to the production Render backend.
 */

export const PRODUCTION_RENDER_BACKEND = 'https://laurrel-backend-api.onrender.com';
export const STAGING_RENDER_BACKEND = 'https://laurrel-backend-staging.onrender.com';

export function isDeployPreviewEnvironment(): boolean {
  return (
    process.env.CONTEXT === 'deploy-preview' ||
    Boolean(process.env.PUBLIC_SITE_URL && process.env.PUBLIC_SITE_URL.includes('deploy-preview')) ||
    Boolean(process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.includes('deploy-preview')) ||
    Boolean(process.env.URL && process.env.URL.includes('deploy-preview'))
  );
}

export function getBackendApiUrl(): string {
  const rawUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const backendUrl = rawUrl.trim().replace(/\/$/, '');

  if (isDeployPreviewEnvironment()) {
    // Strictly prevent deploy previews from contacting the production Render backend
    if (backendUrl.includes('laurrel-backend-api.onrender.com')) {
      throw new Error(
        'Deploy preview safety block: BACKEND_API_URL targets the production backend (laurrel-backend-api.onrender.com). ' +
        'Deploy Preview #5 must be configured with BACKEND_API_URL=https://laurrel-backend-staging.onrender.com to isolate staging.'
      );
    }
  }

  return backendUrl;
}
