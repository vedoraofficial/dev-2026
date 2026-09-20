# VEDORA — Frontend

Admin Control Panel + Partner/Founder portal for the VEDORA direct-selling platform.

> Read **[docs/PROJECT-GUIDE.md](docs/PROJECT-GUIDE.md)** before writing code — it has the folder
> structure and the team rules.

## Stack

| Concern       | Choice                                                 |
| ------------- | ------------------------------------------------------ |
| Build / dev   | Vite 8, React 19, TypeScript 6                         |
| Styling       | Tailwind CSS v4 (CSS-first, no `tailwind.config`)      |
| UI components | shadcn/ui (Radix, style `radix-nova`) + lucide icons   |
| Routing       | React Router 7                                         |
| Server data   | TanStack Query + axios                                 |
| Forms         | react-hook-form + zod                                  |
| Client state  | zustand (only when Query/URL/local state isn't enough) |
| Toasts        | sonner                                                 |
| Lint / format | oxlint, Prettier (+ Tailwind class sorting)            |

## Getting started

Requires **Node 22+** (developed on Node 24) and npm.

```bash
cd Frontend
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
npm run dev              # http://localhost:5173
```

In dev, Vite proxies `/api/*` to `VITE_API_PROXY_TARGET` (default `http://localhost:8000`), so
there are no CORS issues while the backend runs separately.

## Scripts

| Command                | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Dev server with HMR                |
| `npm run build`        | Type-check + production build      |
| `npm run preview`      | Serve the production build locally |
| `npm run typecheck`    | TypeScript only                    |
| `npm run lint`         | oxlint                             |
| `npm run format`       | Prettier — write                   |
| `npm run format:check` | Prettier — check only              |

Before opening a PR: `npm run lint && npm run typecheck && npm run format:check`.

## Adding a shadcn component

```bash
npx shadcn@latest add <component>   # e.g. npx shadcn@latest add calendar
```

Files land in `src/components/ui/`. Config lives in `components.json`.
