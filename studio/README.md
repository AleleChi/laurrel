# LAURREL SERVICES — SANITY CMS STUDIO

This standalone Sanity Studio provides content management for the Laurrel Services website while avoiding peer-dependency conflicts with Next.js 14 and React 18 in the main application.

---

## 1. Local Development Setup

To run the Sanity Studio locally:

1. Open your terminal and navigate to this directory:
   ```bash
   cd studio
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your project ID and dataset in your environment or in `.env`:
   ```env
   SANITY_STUDIO_PROJECT_ID=your_project_id_here
   SANITY_STUDIO_DATASET=production
   ```
4. Start the Studio development server:
   ```bash
   npm run dev
   ```
5. Open your browser to:
   ```
   http://localhost:3333
   ```

---

## 2. Administrator Authentication

Sanity Studio uses secure OAuth-based authentication directly through Sanity Cloud:
- When visiting `http://localhost:3333` (or the deployed studio URL), you will see the Sanity Sign-in prompt.
- Administrators sign in using:
  - Google account
  - GitHub account
  - Or email login with a one-time magic link / password.
- No passwords or administrative credentials are stored in code or repository files.

---

## 3. Inviting Team Members & Editors

To grant access to additional team members:
1. Log in to [Sanity Management](https://www.sanity.io/manage).
2. Select your Laurrel Services project.
3. Click the **Members** tab.
4. Click **Invite new members**.
5. Enter the user's email address and assign their role:
   - **Administrator**: Full project control, billing, schema deployments, and content editing.
   - **Editor**: Edit, review, and publish website content without administrative/billing permissions.
   - **Viewer**: Read-only access to drafts and documents.
6. The invited user will receive an email invitation to create an account and join the studio.

---

## 4. Deploying the Studio to Cloud

Sanity provides free hosted deployment for the Studio:
```bash
cd studio
npx sanity deploy
```
Choose a hostname (e.g., `laurrel.sanity.studio`).
Once deployed, team members can access the studio anywhere at:
```
https://laurrel.sanity.studio
```

---

## 5. Website Connection & Publishing

When editors publish updates in the Studio:
1. Ensure `NEXT_PUBLIC_SANITY_PROJECT_ID` in `.env.local` matches your Sanity project ID.
2. The website's Sanity client (`src/sanity/client.ts`) queries the published documents with ISR (revalidating every 60 seconds).
3. If the project ID is not set or network fails, the website cleanly falls back to `siteConfig` without downtime or console crashes.
