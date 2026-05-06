# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                 # Start Next.js dev server
npm run build               # Production build (runs generate:api via prebuild unless VERCEL is set)
npm run start               # Run production server
npm run lint                # ESLint (eslint-config-next)
npm run generate:api        # Regenerate all Orval clients from OpenAPI specs
npm run generate:api:watch  # Watch OpenAPI specs and regenerate on change
```

Auth-gated specs (`org`, `user`) require `API_AUTH_TOKEN` in env when regenerating; `requisition`, `billing`, and `payment` do not. The `prebuild` step runs `generate:api` on every `npm run build` outside Vercel — don't skip it locally if the API surface has changed.

There is no test runner configured.

## Architecture

Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui, consuming five OpenAPI-backed backends via Orval-generated React Query hooks.

### Backends and routing

Five services are configured in `orval.config.ts` and mirrored in `src/lib/api-client.ts` under `API_CONFIG`:
`requisition`, `org`, `user`, `billing`, `payment`. Four use remote OpenAPI URLs; `payment` reads from local `payment-openapi.json`.

Each service has its own Orval mutator exported from `src/lib/api-client.ts` (`requisitionRequest`, `orgRequest`, `userRequest`, `billingRequest`, `paymentRequest`). The mutator fixes the `baseURL` per service — generated hooks don't need to know which service they belong to. `getBaseUrl()` exists as a path-prefix fallback but the per-service mutator path is the primary one.

### Generated code contract

`src/lib/generated/<service>/` is produced by Orval (`mode: "tags-split"`, `client: "react-query"`, `httpClient: "axios"`). Do not hand-edit — regenerate instead. Hook names match OpenAPI operationIds verbatim, so they are long (e.g. `useListKaizen AdminsApiV1Kaizen AdminsGet`). `src/services/index.ts` re-exports a curated subset with friendlier aliases where helpful; prefer importing from `@/services` when the symbol exists there, otherwise import directly from `@/lib/generated/...`.

The `generated/` directory is **not** in `.gitignore` despite what legacy docs (README, CONTEXT.md, API_SETUP.md) claim — it is committed. Regeneration produces diffs in the working tree; treat them like any other code change.

### Auth and token lifecycle

- Zustand store at `src/stores/auth-store.ts` (persisted to localStorage under key `auth-storage`) holds `user`, `token`, `isAuthenticated`. `useAuth()` in `src/hooks/use-auth.ts` is the consumer hook.
- Low-level token I/O goes through `src/lib/auth/token-storage.ts` — the store and the axios interceptor both call it.
- `src/lib/api-client.ts` request interceptor attaches `Bearer <token>` from `tokenStorage`. The response interceptor delegates 401 handling to `src/lib/auth/token-refresh.ts`, which uses a `failedQueue` pattern to dedupe concurrent refreshes, retries the original request, and on refresh failure redirects to `/login?redirect=...` unless already on an auth page.
- `devLogin()` on the auth store injects a mock user for working against a broken backend — do not wire into production flows.

### Route groups

Three route groups under `src/app/`:
- `(auth)` — public (login, signup, forgot/reset-password, otp-confirmation, pricing, payment-success, terms, privacy).
- `(dashboard)` — protected, wrapped in `ProtectedRoute` + `ApplicationShell` (sidebar + header). Layout at `src/app/(dashboard)/layout.tsx` also gates access on subscription status via `SubscriptionService.checkSubscriptionStatus` and honors a `requisition_payment_grace` sessionStorage grace period after checkout. Platform admins (org type `PLATFORM_ADMIN` or permission `platform:admin`) are redirected to `/admin`.
- `(admin)` — platform admin portal with its own layout.

The root layout (`src/app/layout.tsx`) wires providers in this order: `ThemeProvider` → `ReactQueryProvider` → `CurrencyProvider`, plus `Toaster` (sonner) and `CookieConsentProvider`.

### State management split

- **Server state** → React Query via generated hooks. Query keys are tuples produced by Orval; invalidate using the same shape the hook uses internally (check the generated file if in doubt).
- **Client state** → Zustand stores in `src/stores/` (`auth`, `ui`, `form`, `preferences`), re-exported from `src/stores/index.ts`.

### UI conventions

- shadcn/ui style `radix-mira`, base color `neutral`, icon library `lucide` (see `components.json`). Component aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- Feature components live in `src/components/<feature>/` (e.g. `requisitions/`, `vendors/`, `approvals/`, `chat/`, `dashboard/`, `subscription/`). Shared primitives in `src/components/ui/`.
- The app shell is `src/components/application-shell.tsx` — sidebar navigation, header, user menu. `application-shell1.tsx` is a legacy duplicate; prefer `application-shell.tsx`.
- Components that use hooks, context, or browser APIs need `"use client"` — a recent commit (`b1235c4`) was specifically to add this directive to chat components, so double-check when creating new interactive components.

### Path alias

`@/*` → `src/*` (see `tsconfig.json`). Strict mode is on.

## Docs to cross-reference

Several markdown docs in the repo root (`CONTEXT.md`, `ARCHITECTURE.md`, `API_SETUP.md`, `SCREENS.md`, `WEB_SCREENS.md`) contain deeper context on intended features and older setup notes. They predate parts of the current state (billing/payment services, the `services/` re-export layer, the token-refresh machinery, committed `generated/` directory) — use them for intent, not as ground truth.
