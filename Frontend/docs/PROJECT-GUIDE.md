# VEDORA Frontend — Project Guide

Structure, conventions and rules for everyone working in `Frontend/`. If a rule here is in your
way, discuss it with the team and change this file — don't quietly break it.

## 1. Scope

- Everything frontend lives in `Frontend/`. **Do not edit `Backend/`** — it is owned by the
  backend developer. Frontend talks to it only over HTTP under `/api`.
- Two portals in one app:
  - **Admin Control Panel** (`/admin/*`) — Root Admin `VED108`.
  - **Partner & Founder portal** (`/partner/*`) — one shared portal; Founders see their own
    Founder ID.
  - **Login** (`/login`) — shared entry for all roles.

## 2. Domain glossary

| Term         | Meaning                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------- |
| VEDORA ID    | Login ID, e.g. `VED000418`. Shown in monospace.                                                 |
| Root Admin   | `VED108`. Oversight only, earns no income.                                                      |
| Founders     | `VED000001`–`VED000003`. Permanent IDs, cannot be reassigned.                                   |
| Partners     | IDs auto-generated from `VED000004`.                                                            |
| BV           | Business Volume. `1 BV = ₹1`. Each product sale = 1,000 BV.                                     |
| Direct slots | Max 20 BV-eligible direct partners per ID. A 21st+ is valid in the tree but earns no BV income. |
| Genealogy    | The placement tree. Width 20, unlimited depth.                                                  |

Compensation numbers (₹200 direct, 10/10/10/5/5 % levels) are **calculated by the backend**.
The frontend only displays what the API returns — never recompute money on the client.

## 3. Folder structure

```
Frontend/
├─ docs/                    Project docs (this file)
├─ public/                  Static files served as-is (favicon, images)
├─ src/
│  ├─ main.tsx              Entry point — mounts <App />
│  ├─ App.tsx               <Providers> + <RouterProvider>
│  ├─ index.css             Tailwind import + theme tokens (colors, radius, fonts)
│  │
│  ├─ app/                  App-wide wiring (no UI)
│  │  ├─ providers.tsx      Theme, React Query, Tooltip, Toaster
│  │  ├─ router.tsx         All routes (pages are lazy-loaded)
│  │  └─ routes.ts          ROUTES constant — every URL lives here
│  │
│  ├─ layouts/              Page shells: auth-layout, admin-layout, partner-layout
│  │
│  ├─ pages/                One file per route. Thin: compose features + components.
│  │  ├─ auth/
│  │  ├─ admin/
│  │  └─ partner/
│  │
│  ├─ features/             Business logic grouped by domain (see §4)
│  │  └─ <feature>/         e.g. wallet/, genealogy/, withdrawals/
│  │     ├─ api.ts          Functions that call the backend
│  │     ├─ queries.ts      React Query hooks (useXxx)
│  │     ├─ schemas.ts      zod schemas for forms/validation
│  │     ├─ types.ts        Types for this feature's data
│  │     └─ components/     UI used only by this feature
│  │
│  ├─ components/
│  │  ├─ ui/                shadcn/ui primitives (generated — see §6)
│  │  └─ common/            Our own reusable components (StatCard, DataTable, …)
│  │
│  ├─ hooks/                Generic hooks not tied to a feature
│  ├─ lib/                  utils.ts (cn), api.ts (axios), query-client.ts, env.ts
│  └─ types/                Shared types used by more than one feature
├─ components.json          shadcn/ui config
├─ vite.config.ts           Vite + Tailwind plugin + `@` alias + /api dev proxy
└─ .env.example             Environment variables
```

**Where does new code go?**

| I'm adding…                           | Put it in                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------- |
| A new screen / URL                    | `pages/<portal>/x-page.tsx` + route in `app/router.tsx` + `app/routes.ts` |
| A backend call                        | `features/<feature>/api.ts`                                               |
| A hook that fetches data              | `features/<feature>/queries.ts`                                           |
| A component used by one feature       | `features/<feature>/components/`                                          |
| A component used by 2+ features       | `components/common/`                                                      |
| A basic UI primitive (button, dialog) | `components/ui/` via the shadcn CLI                                       |
| Sidebar/topbar/page frame             | `layouts/`                                                                |

## 4. Rules

### Code

1. **TypeScript strict; no `any`.** Type API responses in the feature's `types.ts`.
2. **Imports use the `@/` alias** (`@/components/ui/button`), never `../../..`. Relative imports
   only inside the same folder (`./types`).
3. **Files are `kebab-case`** (`stat-card.tsx`); **components are `PascalCase`** named exports
   (`export function StatCard`). Default exports only for `App.tsx`.
4. **Pages stay thin.** A page fetches via a feature hook and composes components. No
   business logic or raw `axios` in pages.
5. **One component per file**, props typed inline or with a `Props` type in the same file.
6. **Don't hard-code URLs.** Use `ROUTES` from `@/app/routes`.
7. **Feature isolation:** a feature may import from `components/`, `lib/`, `hooks/`, `types/`
   and `app/routes` — never from another feature's internals. Need to share? Move it up to
   `components/common` or `types/`.

### Data

8. **All backend calls go through `lib/api.ts`** (axios instance). Never `fetch`/`axios` in a
   component.
9. **Server data = TanStack Query.** Don't copy API data into `useState` or zustand. Query keys
   are arrays starting with the feature name: `["wallet", "transactions", filters]`.
10. **Mutations invalidate** the queries they affect and show a `toast` (sonner) on success/error.
11. **Forms = react-hook-form + zod** (`schemas.ts`). Validate on the client for UX, but the
    backend is the authority.
12. **Never compute commissions, BV, slot eligibility or wallet balances on the client.** Display
    API values only.
13. **Money and BV formatting** goes through one shared formatter in `lib/` (Indian grouping,
    ₹1,84,000). Don't sprinkle `toLocaleString` around.

### Styling

14. **Tailwind utilities + shadcn/ui only.** No CSS modules, no styled-components, no inline
    `style={{}}` (except truly dynamic values like a computed width).
15. **No hard-coded colors** (`#c9a24b`, `bg-green-900`). Use theme tokens defined in
    `src/index.css` (`bg-background`, `text-primary`, `border-border`, …). Changing the brand
    look must be a change in one file.
16. **Use `cn()`** from `@/lib/utils` to combine/conditionally apply class names.
17. **Responsive by default** — build mobile-first, then add `md:` / `lg:` variants. Partners
    will use phones.
18. **Icons: `lucide-react` only.**

### Quality

19. **Every list/table/page has loading, empty and error states** (use `Skeleton`, `Alert`).
20. **Accessibility basics:** labels on inputs (`Field`/`Label`), buttons that are only an icon
    get `aria-label`, keyboard-reachable dialogs (shadcn handles this — don't replace them).
21. **No `console.log` left in commits.** No commented-out code.
22. **No secrets in the repo.** `.env` is git-ignored; only `VITE_*` vars reach the browser, so
    never put a private key there.

### Git

23. Branch from `main`: `feat/<short-name>`, `fix/<short-name>`. Small PRs, one concern each.
24. Commit messages: imperative and specific — `Add wallet transaction table`.
25. Before a PR: `npm run lint && npm run typecheck && npm run format:check` must pass and
    `npm run build` must succeed.

## 5. shadcn/ui components

Already added: `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`,
`dialog`, `dropdown-menu`, `field`, `input`, `label`, `pagination`, `popover`, `progress`,
`scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`,
`table`, `tabs`, `textarea`, `tooltip`.

Need another? `npx shadcn@latest add <name>`. Don't copy components from random sites.

## 6. Editing `components/ui/`

These files are owned by shadcn — you _may_ edit them (that's the point of shadcn), but:

- Prefer changing theme tokens in `index.css` over editing component internals.
- Put brand variants (e.g. a gold `Button` variant) in the `cva` variants of that file, not as
  one-off class strings scattered across pages.
- Don't reformat or reorganize them; lint is relaxed for this folder.

## 7. Theming

- Dark theme is the default (`ThemeProvider` in `app/providers.tsx`, `defaultTheme="dark"`).
- Colors, radius and fonts are CSS variables in `src/index.css`. shadcn's neutral placeholder
  palette is currently active.
- **Planned (not yet applied):** brand look from the design PDF — dark green + gold, Cormorant
  Garamond (display) / Manrope (UI) / JetBrains Mono (VEDORA IDs). Exact brand hex codes are
  still pending from the client, so don't hard-code approximations; wait for the tokens.

## 8. Routes

Defined in `app/router.tsx`, URLs in `app/routes.ts`.

| Area    | Routes                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth    | `/login`                                                                                                                                    |
| Admin   | `/admin/` overview · partners · founders · manual-placement · genealogy · products · withdrawals · income-reports · transactions · settings |
| Partner | `/partner/` dashboard · genealogy · team · wallet · income-reports · products · profile · settings                                          |

Every page is currently a `PagePlaceholder`. To build one: replace the body of the file in
`pages/…`, keep the exported component name (the router imports it by name).

## 9. Not built yet (setup only)

- Real designs for all screens (`PagePlaceholder` everywhere).
- Auth: login flow, token storage, route guards per role (Admin / Founder / Partner). Needs the
  backend auth contract first.
- Shared money/BV formatter (rule 13).
- Partner self-registration with OTP, Partner Agreement acceptance, Rank & Achievement module,
  Level Capacity dashboard, Active/Inactive handling — listed as "not yet designed" in the
  design PDF.

## 10. Backend contract

The API shape is owned by the backend developer. Agree endpoints and response types with them
first, write the types in `features/<x>/types.ts`, then build the UI. Until an endpoint exists,
mock inside the feature's `api.ts` — never inside components — so swapping in the real call
changes one file.
