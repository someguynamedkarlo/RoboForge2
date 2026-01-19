# RoboForge - Copilot Instructions

## Project Overview

Next.js 16 app with Supabase authentication (email/password + OAuth via Google/GitHub). Deployed on Vercel with automatic CI/CD.

## Architecture

### Authentication Flow

- **Supabase clients**: Three separate clients in `lib/supabase/`:
  - `server.ts` - Server Components (uses `cookies()`)
  - `client.ts` - Client Components (browser client)
  - `proxy.ts` - Middleware session refresh
- **OAuth callback**: `app/auth/confirm/route.ts` handles both OAuth code exchange AND email OTP verification
- **Session storage**: JWT tokens stored in cookies, auto-refreshed by middleware

### Key Patterns

```typescript
// Server Component - check auth
const supabase = await createClient(); // from lib/supabase/server
const { data } = await supabase.auth.getClaims(); // Fast JWT decode
// OR
const {
  data: { user },
} = await supabase.auth.getUser(); // Full user data

// Client Component - must be "use client"
const supabase = createClient(); // from lib/supabase/client
```

### Route Protection

- Middleware in `proxy.ts` + `lib/supabase/proxy.ts` redirects unauthenticated users to `/auth/login`
- Exceptions: `/`, `/auth/*`, `/login` paths are public
- Protected pages should still verify auth and redirect if `getClaims()` fails

## File Structure

```
app/
  auth/confirm/route.ts  # OAuth + OTP verification endpoint
  auth/login/page.tsx    # Login page
  home/page.tsx          # Post-login landing (protected)
  protected/             # Legacy protected route
components/
  google-sign.tsx        # OAuth buttons (client components)
  github-sign.tsx
  login-form.tsx         # Email/password form
  Navbar.tsx             # Navigation
  ui/                    # shadcn/ui components
lib/supabase/            # Supabase client factories
```

## Commands

```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run lint   # ESLint
```

## Important Conventions

- **Never use `export const dynamic`** in route handlers - causes Turbopack build errors
- **Always create fresh Supabase client** per request (no global instances)
- **OAuth redirect**: Use `window.location.origin` for `redirectTo` to support both localhost and Vercel
- **Add `suppressHydrationWarning`** to `<html>` and `<body>` tags to avoid browser extension conflicts

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Must be set in Vercel dashboard for production.

## Styling

- Tailwind CSS with custom CSS variables in `globals.css`
- shadcn/ui components in `components/ui/`
- Custom glow effects: `.text-glow-white`, `.text-glow-accent`
