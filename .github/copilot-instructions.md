# RoboForge — Copilot Instructions

## What this project is
A robotics-project sharing platform (Next.js latest + Tailwind v4 + Supabase). Users sign in via OAuth (Google/GitHub), then create/edit/delete robotics projects (with steps, components, wiring diagrams, code files) and fundraising campaigns. Deployed on Vercel.

## Architecture at a glance
```
app/             → Next.js App Router (all routes are Server Components unless marked "use client")
components/      → Shared UI; server components (Navbar, profile, auth-button) and client components (ProjectForm, FundraisingForm, ProjectCard, mobile-nav, OAuth buttons, logout)
lib/supabase/    → All Supabase client factories and data-access helpers
  server.ts      → Server Component client (uses cookies())
  client.ts      → Browser client (createBrowserClient)
  proxy.ts       → Middleware session refresh (createServerClient per request)
  projects.ts    → CRUD for projects (publishProject, updateProject, deleteProject, getUserProjects, getProjects)
  storage.ts     → File upload/delete helpers for 3 buckets: images, code_files, misc_files
  admin.ts       → isAdmin() server-side helper (queries `admins` table)
proxy.ts         → Root middleware entrypoint → calls lib/supabase/proxy.updateSession
sql/             → Manual migration snippets run against Supabase directly
```

## Supabase tables (inferred from queries)
- `projects` — main project record (`profile_id`, `title`, `short_description`, `logic_explanation`, `cover_image_url`, `wiring_diagram_url`, `video_url`, `total_cost`, `published`)
- `project_steps` — ordered build steps per project (`project_id`, `step_order`, `title`, `instructions`, `image_url`)
- `project_components` — BOM items (`project_id`, `name`, `quantity`, `cost`, `link`)
- `project_files` — uploaded code/misc files (`project_id`, `file_url`, `file_name`, `file_size`, `file_type: "code"|"misc"`)
- `fundraising_projects` — funding campaigns (`profile_id`, `project_name`, `short_description`, `long_description`, `amount_needed`, `payment_info`, `donation_link`, `image_urls`)
- `profiles` — user profiles joined via `profile_id` (has `username`, `full_name`, `avatar_url`, `role`). Set `role = 'admin'` to grant admin access.

Storage buckets: `images`, `code_files`, `misc_files`. Path convention: `{projectId}/{uuid}.{ext}`.

## Auth flow
1. Landing (`app/page.tsx`): unauthenticated users see OAuth buttons; authenticated users redirect to `/home`.
2. OAuth buttons (`components/google-sign.tsx`, `github-sign.tsx`): call `supabase.auth.signInWithOAuth` with `redirectTo: ${window.location.origin}/auth/confirm`.
3. Callback (`app/auth/confirm/route.ts`): exchanges `code` for session or verifies email OTP `token_hash`, then checks `profiles.role` — admins redirect to `/admin`, others to `/home`.
4. Middleware (`proxy.ts` → `lib/supabase/proxy.ts`): refreshes JWT cookies via `getClaims()`; redirects unauthenticated users to `/auth/login` (route does not exist yet — landing page handles login today).
5. Protected pages check auth with `supabase.auth.getUser()` and `redirect("/")` on failure.
6. Admin dashboard (`app/admin/page.tsx`): client component that queries `admins` table on mount; non-admins are redirected to `/home`.

## Commands
- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run lint` — build & lint
- No test framework is set up yet.

## Key conventions
- **Never store Supabase clients globally.** Always create per-request (`await createClient()` server-side) or per-render (`createClient()` client-side). This is required for Fluid compute safety.
- **Server vs Client split:** pages that only fetch + render are async Server Components importing from `lib/supabase/server`. Interactive forms/cards are `"use client"` and import from `lib/supabase/client`.
- **Data-access layer lives in `lib/supabase/projects.ts`** (client-side helper used from Client Components). Fundraising writes happen inline in `FundraisingForm.tsx` — there's no separate data-access file for fundraising yet.
- **shadcn/ui (new-york style):** UI primitives in `components/ui/`. Add new ones via `npx shadcn@latest add <component>`. Uses `cn()` from `lib/utils`.
- **Icons:** Lucide React (`lucide-react`).
- **Theming:** CSS variables in `app/globals.css` (`--background`, `--accent`, `--primary`, `--secondary`). Custom `@utility` classes for glow effects (`text-glow-accent`, `box-glow-primary`). Dark-only design; `next-themes` ThemeProvider wraps the app but default theme is system.
- **Dynamic route params** are `Promise<{ id: string }>` (Next.js 15+ convention): always `await params` before use.
- **Keep `suppressHydrationWarning`** on `<html>` and `<body>` in `app/layout.tsx`.
- **OAuth `redirectTo`** must use `window.location.origin` to work on both localhost and Vercel.
- **Inline Croatian comments** appear throughout the codebase (e.g. `// uzmi sve projekte`). Preserve them when editing existing code.

## Env vars (required)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — set in `.env.local` and Vercel dashboard.

## Known gaps
- Middleware redirects to `/auth/login` but that page doesn't exist; sign-in is on the landing page (`/`).
- No test suite, no CI beyond Vercel build.
- SQL migrations in `sql/` are manual snippets — no migration tool.
- No separate data-access module for fundraising; writes happen directly in `FundraisingForm`.
