# RoboForge - Copilot Instructions

## Project Overview

Next.js 16 app with Supabase authentication (email/password + OAuth via Google/GitHub). Deployed on Vercel with automatic CI/CD.

# RoboForge - Copilot Instructions

## Overview
- Next.js 16 + Tailwind app with Supabase auth (OAuth Google/GitHub). Deployed on Vercel.
- No tests yet; lint/build via npm scripts. README is placeholder.

## Auth flow
- Supabase clients live in `lib/supabase/`: `server.ts` for Server Components (uses `cookies()`), `client.ts` for Client Components, `proxy.ts` for middleware refresh.
- OAuth callback + email OTP handled in `app/auth/confirm/route.ts` (`GET` only). It exchanges `code` for a session or verifies `token_hash`/`type`, then redirects (defaults to `/home`).
- Middleware entrypoint `proxy.ts` calls `updateSession` (lib/supabase/proxy) to refresh JWT cookies and redirect unauthenticated users; current redirect target is `/auth/login` (route missing right now—adjust if you add a login page).
- Server-side checks typically use `supabase.auth.getUser()`; client-side uses `createClient()` from `lib/supabase/client`.

## Routing / pages
- `app/layout.tsx`: sets metadata, Geist font, ThemeProvider, and `suppressHydrationWarning` on html/body.
- `app/page.tsx`: landing. Creates server client, redirects to `/home` if authenticated, otherwise renders `AuthButton` (OAuth buttons) only.
- `app/home/page.tsx`: currently just renders `Navbar`; was intended as protected area. `UserDetails` helper redirects to `/` on auth failure but is unused.
- `app/auth/error/page.tsx`: simple error message.

## Components
- `components/google-sign.tsx` and `components/github-sign.tsx`: client OAuth triggers with `redirectTo: ${window.location.origin}/auth/confirm`. Use `startTransition` to avoid blocking UI.
- `components/logout-button.tsx`: client sign-out then `router.push("/")`.
- `components/Navbar.tsx` + `components/profile.tsx`: server components showing nav links and avatar + logout.
- `components/ui/button.tsx`: shadcn button variant utility using `cn` from `lib/utils`.

## Middleware details
- `lib/supabase/proxy.ts` creates a server client per request (never global). Uses `hasEnvVars` guard to no-op when envs missing. After `getClaims`, redirects to `/auth/login` unless path is `/`, `/login`, or `/auth/*`. Copy cookies from `supabaseResponse` if you craft a custom response.

## Commands
- `npm run dev` (dev server), `npm run build`, `npm run lint`.

## Conventions / pitfalls
- Always create Supabase clients per request/render (Fluid compute safe).
- Keep OAuth `redirectTo` relative to `window.location.origin` for both localhost and Vercel.
- Avoid `export const dynamic` in route handlers (Turbopack issue noted). Route handlers stay static.
- Ensure `suppressHydrationWarning` remains on html/body to dodge extension noise.
- Env vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (set in Vercel and local).

## Gaps to know
- Middleware redirects to `/auth/login`, but that route/page does not exist; landing page handles sign-in today. Update matcher/redirect if you add a login page.
- README is empty; rely on this file for project guidance for now.

components/
