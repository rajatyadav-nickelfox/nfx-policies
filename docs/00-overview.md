# NFX Policies — Project Overview

## Purpose

Internal application for managing and tracking employee engagement with company policies and documents stored in Microsoft SharePoint/OneDrive. Employees log in with their org Microsoft account, read documents in a secure viewer, and acknowledge they have read each one. All activity is audit-logged in Supabase.

---

## Tech Stack

| Concern | Package | Version |
|---|---|---|
| Framework | `next` | 15.x |
| Language | `typescript` | 5.x (strict) |
| Auth | `next-auth` | ^5.0.0 |
| Microsoft Graph | `@microsoft/microsoft-graph-client` | ^3.0.7 |
| Database | `@supabase/supabase-js` + `@supabase/ssr` | ^2.x / ^0.5.x |
| PDF Viewer | `@react-pdf-viewer/core` + `pdfjs-dist` | ^3.12 / ^4.x |
| DOCX Viewer | `mammoth` | ^1.8.0 |
| HTML Sanitization | `dompurify` + `@types/dompurify` | ^3.x |
| Client State | `zustand` | ^5.0.0 |
| Server State | `@tanstack/react-query` | ^5.0.0 |
| Forms | `react-hook-form` + `@hookform/resolvers` | ^7.x / ^5.x |
| Validation | `zod` | ^4.0.0 |
| Styling | `tailwindcss` + `@tailwindcss/postcss` | ^4.x |
| Linting | `eslint` + `eslint-config-next` | ^9.x |
| Formatting | `prettier` + `prettier-plugin-tailwindcss` | ^3.x |
| Commit hooks | `husky` + `lint-staged` | ^9.x / ^15.x |
| Commit lint | `@commitlint/cli` + `@commitlint/config-conventional` | ^19.x |

---

## Folder Structure

```
nfx-policies/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # Microsoft SSO login screen
│   │   └── layout.tsx                  # Unauthenticated shell (centered card)
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Authenticated shell — AppShell wraps all dashboard pages
│   │   ├── page.tsx                    # Redirects to /policies
│   │   └── policies/
│   │       ├── page.tsx                # Policy list
│   │       └── [id]/page.tsx           # Document viewer
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── policies/route.ts
│   │   ├── policies/[id]/route.ts
│   │   ├── policies/[id]/html/route.ts
│   │   ├── read-events/route.ts
│   │   └── acknowledgements/route.ts
│   ├── globals.css
│   └── layout.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/LoginButton.tsx
│   │   ├── components/SessionGuard.tsx
│   │   └── hooks/useSession.ts
│   └── policies/
│       ├── components/
│       │   ├── PolicyList.tsx
│       │   ├── PolicyCard.tsx
│       │   ├── PolicyViewer.tsx
│       │   ├── PdfViewer.tsx
│       │   ├── DocxViewer.tsx
│       │   ├── AcknowledgementBanner.tsx
│       │   └── ReadBadge.tsx
│       ├── hooks/
│       │   ├── usePolicies.ts
│       │   ├── useAcknowledgements.ts
│       │   └── usePolicyViewer.ts
│       ├── queries/
│       │   ├── policyQueries.ts
│       │   └── acknowledgementQueries.ts
│       ├── mutations/
│       │   ├── useLogReadEvent.ts
│       │   └── useAcknowledge.ts
│       ├── store/policyStore.ts
│       └── validators/policySchema.ts
│
├── services/
│   ├── graph/
│   │   ├── graphClient.ts
│   │   ├── filesService.ts
│   │   └── tokenProvider.ts
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── EmptyState.tsx
│       └── LoadingSpinner.tsx
│
├── lib/
│   ├── auth.ts
│   ├── env.ts
│   ├── queryClient.ts
│   └── constants.ts
│
├── middleware.ts
│
├── types/
│   ├── policy.ts
│   ├── user.ts
│   └── next-auth.d.ts
│
├── utils/
│   ├── fileUtils.ts
│   └── dateUtils.ts
│
├── docs/                               # This folder — agent task docs
├── .env.example
└── tsconfig.json
```

---

## Coding Conventions

1. **No hardcoded colors or fonts** — use only CSS custom property tokens from `globals.css` via Tailwind classes
2. **TypeScript strict mode** — `noImplicitAny`, `strictNullChecks` enabled; no `any` types
3. **Zod validation at all boundaries** — API route inputs validated with Zod schemas; env vars validated at startup
4. **Feature-based folders** — code is organized by feature (`features/policies/`, `features/auth/`) not by type
5. **Server state via TanStack Query** — all API data fetching goes through Query hooks; no raw `fetch` in components
6. **UI state via Zustand** — only ephemeral state that does not need server sync (viewer open, sidebar state)
7. **No inline styles** — all styling via Tailwind utility classes mapped to design tokens
8. **Conventional Commits** — commit messages must follow `type(scope): subject` format

---

## State Management Guide

| What | Where | Why |
|---|---|---|
| Policy list from API | TanStack Query (`usePolicies`) | Cacheable, background refetch |
| User ack status | TanStack Query (`useAcknowledgements`) | Cacheable |
| Submit acknowledgement | TanStack Mutation (`useAcknowledge`) | Invalidates ack cache on success |
| Log read event | TanStack Mutation (`useLogReadEvent`) | Fire-and-forget mutation |
| Viewer open/closed | Zustand (`policyStore`) | UI-only, no server sync needed |
| Selected document | Zustand (`policyStore`) | UI-only |
| Sidebar collapsed | Zustand or local state | UI-only |

---

## Docs Reading Order for Implementation

Implement in this order — each doc builds on the previous:

1. `01-project-setup.md` — scaffold the project
2. `02-design-tokens.md` — establish design system
3. `04-database.md` — set up Supabase schema
4. `03-auth.md` — authentication layer
5. `05-graph-integration.md` — Microsoft Graph services
6. `06-api-routes.md` — API route handlers
7. `07-ui-components.md` — shared UI components
8. `09-state-and-queries.md` — state management layer
9. `08-policy-feature.md` — feature components
10. `10-deployment.md` — deployment configuration
