# TeachAlike frontend

Next.js (App Router) + Tailwind CSS frontend for the TeachAlike Flask backend (`Teach-api`),
built from `TeachAlike_Frontend_Spec.md`.

## Setup

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your Flask backend
npm run dev
```

Runs at http://localhost:3000. Point `NEXT_PUBLIC_API_URL` at wherever `core` (the
Flask backend) is running, e.g. `http://localhost:5000`.

## What's here

- `lib/api.ts` — single axios instance: attaches the bearer token on every request,
  and on a `401` silently refreshes once (via `/api/auth/refresh`) and retries the
  original request. Forces logout + redirect to `/login` if refresh also fails.
- `lib/auth-context.tsx` — React Context for the logged-in account (parent/teacher/admin),
  login/register/logout, and role helpers (`isAdmin`, `isTeacher`, `isParent`).
- `lib/endpoints.ts` — thin per-resource wrapper functions over every endpoint in the spec.
- `components/layout/AuthGuard.tsx` — redirects unauthenticated users to `/login`; gates
  `/admin/*` behind `role === "admin"`.
- `app/(app)/layout.tsx` — the sidebar + topbar shell for all authenticated routes; the
  sidebar becomes a slide-in drawer on small screens.
- Every route from the spec's route map is implemented under `app/`, including the
  public landing/login/register pages and the full authenticated app shell.

## Known gaps (flagged in the spec itself)

- **Teacher "add child" form** takes a plain numeric parent account ID — there's no
  backend endpoint yet for a teacher to search/select an existing parent by name.
- **Voice profile creation** records audio in the browser and uploads it as multipart
  form data to the authenticated API endpoint.
- **`/api/sync`** is available through `syncApi.push` for offline clients; there is
  not yet a dedicated offline-first UI screen.

## Brand

Colors, spacing, and copy tone follow section 3 of the spec (`brand-900` / `brand-600`
/ `brand-400`, calm sentence-case copy, plain-verb buttons). Tailwind theme tokens live
in `tailwind.config.ts`.
