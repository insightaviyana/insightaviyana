# Aviyana Ceylon Resort — Project Handoff

Digital Source of Truth / ORM (Online Reputation Management) web app for a luxury Sri Lankan resort, ahead of its August 2027 grand opening. Public-facing news/fact-check portal + internal staff content management, built on React + Supabase + Netlify.

Use this doc to bring a fresh Claude chat up to speed instantly — paste it in as the first message along with the project zip.

---

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS
- **Icons**: lucide-react
- **Database/Auth/Storage**: Supabase (PostgreSQL + Supabase Auth + Supabase Storage)
- **AI**: Google Gemini (`@google/genai`) — powers a "PR Assistant" that drafts responses to rumors/comments
- **Hosting**: Netlify (static build + serverless Functions)
- **Serverless**: Netlify Functions (TypeScript) for anything needing secrets that can't touch the browser

---

## Project Structure

```
aviyana/
├── src/
│   ├── App.tsx                  — root component, all top-level state, Supabase session listener
│   ├── types.ts                 — all TypeScript interfaces (User, ArticleItem, Milestone, etc.)
│   ├── data/initialData.ts      — mock/seed data (used until Supabase has real rows)
│   ├── lib/
│   │   ├── supabase.ts          — Supabase client singleton, isSupabaseConfigured flag
│   │   ├── supabaseAuth.ts      — sign up/in/out, Google OAuth, profile fetch/update, avatar upload
│   │   ├── articlesApi.ts       — CRUD for the `announcements` table
│   │   └── publicHubApi.ts      — CRUD for milestones, csr_impacts, voice_cuts, fact_checks tables
│   ├── components/
│   │   ├── Navbar.tsx           — role/login-aware nav (2-row layout, no search bar)
│   │   ├── PublicHubView.tsx    — public homepage: news feed, fleet, press statements, fact-checks
│   │   ├── AnnouncementsView.tsx— staff article writer/editor + public reader (Announcements tab)
│   │   ├── AuthModal.tsx        — real Sign In / Create Guest Account / Continue with Google
│   │   ├── ProfileEditModal.tsx — edit own name/title + real avatar upload
│   │   ├── UserManagementView.tsx — admin-only: list/add/edit/delete every account
│   │   ├── QuickCrudModal.tsx   — generic schema-driven form, reused for Milestones/CSR/VoiceCuts/FAQ
│   │   ├── SmartVideoPlayer.tsx — detects YouTube links (incl. unlisted) → iframe embed; else <video>
│   │   ├── DashboardView, GeminiAiAssistant, ContentPipelineView, SerpMonitoringView, FaqManagerView
│   │   │                        — internal staff tools (role-gated)
│   │   └── (various modals: Question, Registration, Theme, Document, Notifications)
│   └── assets/aviyana-logo-mark.png — the phoenix logo, used in navbar/favicon/hero
├── netlify/functions/
│   ├── gemini-generate-response.ts  — server-side Gemini call (dev-only Vite middleware doesn't work on Netlify)
│   ├── admin-create-user.ts         — creates staff/admin accounts using the service_role key
│   └── admin-delete-user.ts         — deletes accounts using the service_role key
├── netlify.toml                 — build config + API redirects + SPA fallback
├── supabase-setup.sql           — full DB schema (run in Supabase SQL Editor)
├── profiles-reset-and-diagnose.sql — troubleshooting/reset script for the accounts system
└── .env.example                 — required environment variables
```

---

## Account & Role Model (IMPORTANT — this changed significantly)

Three real account tiers (`accountType` field), backed by actual Supabase Auth (not a mock switcher):

| Type | How created | Access |
|---|---|---|
| **admin** | Promoted manually via SQL, or created by another admin in User Management | Everything, including User Management |
| **staff** | Created ONLY by an admin (User Management → Add User) | Role-based tabs via `staffRole` (IT_LEAD / STORY_HUNTER / SOCIAL_MANAGER / GUEST_COORDINATOR / HOTEL_SCHOOL_CREW) |
| **guest** | Self-registers (email+password or Google OAuth) | Public tabs only (Public Hub, Announcements, Education) |

Logged-out visitors see the same as `guest` (default `PUBLIC_USER` state in App.tsx).

**Nav tab visibility logic** lives in `Navbar.tsx`'s `NAV_ITEMS` array — each item can have `roles: UserRole[]` (staff-role gated) or `adminOnly: true`. Admins bypass role-array checks entirely.

---

## Supabase Schema

Tables (all with RLS enabled): `profiles`, `announcements`, `milestones`, `csr_impacts`, `voice_cuts`, `fact_checks`, `content_pipeline`.

- `profiles` is the account table — one row per `auth.users` row, auto-created by a `handle_new_user()` trigger on signup.
- A `avatars` Storage bucket (public read) holds profile pictures.
- Pattern: public SELECT policy (`USING (true)`) + anon-key ALL policy on the 6 content tables (small trusted team, in-app login handles who can reach the write UI at all). `profiles` has stricter policies: own-row read/write + an admin-bypass policy (`EXISTS` subquery checking the caller's own `account_type = 'admin'`).

**Full DDL is in `supabase-setup.sql`** — re-run anytime, it's idempotent (`DROP POLICY IF EXISTS` before every `CREATE POLICY`, `ON CONFLICT DO NOTHING` on the bucket insert).

---

## Environment Variables

```
# Client-side (safe to expose — anon key is protected by RLS)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GEMINI_API_KEY=

# Server-side ONLY (Netlify env var, NEVER prefix with VITE_)
SUPABASE_SERVICE_ROLE_KEY=
```

Local dev: put these in a `.env` file at the project root (already gitignored). Netlify: Site configuration → Environment variables — must be set separately, `.env` isn't read by Netlify's build.

---

## Deployment

**Recommended: GitHub → Netlify auto-deploy** (avoids Netlify CLI, which has been flaky/crashing in this project's testing — interactive prompts crash under some terminal/Node combos).

1. `git add .` → `git commit` → push to GitHub (via VS Code Source Control panel or CLI)
2. Netlify → Site configuration → Build & deploy → link the GitHub repo
3. Build command `npm run build`, publish dir `dist` — already set in `netlify.toml`
4. Add all 4 env vars above in Netlify dashboard
5. Every push to `main` auto-deploys

**Fallback if git is confusing:** `npm install && npm run build` locally, then drag the generated `dist` folder onto Netlify's Deploys tab drop zone. Downsides: no auto-deploy on future changes, and the two admin Netlify Functions won't work (drag-and-drop only uploads static files, not serverless functions) — so User Management add/delete needs a real Netlify deploy (git-connected or `netlify deploy --build`), not drag-and-drop.

---

## First-Time Setup Checklist

1. Run `supabase-setup.sql` in Supabase SQL Editor
2. Deploy to Netlify with all 4 env vars set
3. Sign up once through the app (Create Guest Account)
4. **Promote yourself to admin** — no admin exists on a fresh DB, must be done manually:
   ```sql
   UPDATE profiles SET account_type = 'admin' WHERE email = 'your@email.com';
   ```
   If this seems to do nothing, the auto-create trigger may not have fired — see `profiles-reset-and-diagnose.sql` for a full diagnose/fix/reset flow.
5. (Optional) Set up Google OAuth — requires creating a Google Cloud OAuth Client ID/Secret and pasting it into Supabase → Authentication → Providers → Google. Full walkthrough was given in chat; ask to regenerate if needed.

---

## Known Issues / Things Not Yet Done

- Admin promotion via SQL can silently affect 0 rows if the profile-creation trigger didn't fire for that signup — `profiles-reset-and-diagnose.sql` diagnoses and fixes this.
- Google OAuth needs manual Google Cloud Console setup (can't be done via code) — not yet configured/tested end-to-end by the user as of this handoff.
- Milestones/CSR Impacts/Voice Cuts/Fact Checks all write to Supabase now, but there's no image upload for THEIR cover images (still URL-only text fields) — only profile avatars have real upload.
- No code-splitting yet — the JS bundle is ~1.1MB (Vite warns about this at build time). Not urgent, but worth `dynamic import()` chunking eventually.
- Netlify CLI has been unreliable in this environment (crashes on interactive prompts, `JSONHTTPError: Not Found` from a stale linked site). GitHub-based deploy was the reliable path found.

---

## How to Continue in a New Chat

Upload the current project zip + this file, and say what you want done next. Claude should:
1. `view` this file first for full context
2. Extract the zip, `npm install`, `npx tsc --noEmit` to confirm current state before making changes
3. Everything above reflects the actual current code — no need to re-explain the architecture
