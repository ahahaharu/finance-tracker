# CLAUDE.md

Personal finance tracker. Read this file fully before writing any code.

## Documents

| File                    | Contents                                       |
| ----------------------- | ---------------------------------------------- |
| `docs/spec.md`          | requirements, numbered FR-x.y and NFR-x.y      |
| `docs/data-model.md`    | database schema, constraints, design decisions |
| `docs/api.md`           | REST contract, response and error formats      |
| `docs/design-system.md` | colors, typography, density, component rules   |
| `docs/tasks.md`         | task breakdown                                 |

Every task references FR numbers. When a task is ambiguous, the referenced
requirement wins. When a requirement is ambiguous, ask — do not decide silently.

## Stack

Next.js 16 (App Router) · TypeScript strict · Prisma · PostgreSQL 16 ·
Auth.js v5 (Credentials, JWT session) · Zod · next-intl · Vitest ·
Tailwind · shadcn/ui · Recharts

Do not add dependencies without asking. Never install Redux, Zustand,
React Query, or SWR — list state lives in the URL, data loading is done
by server components.

## Architecture

```
app/[locale]/(app)/**   UI. Server components read via services.
                        Mutations go through server actions.
app/api/v1/**           REST route handlers (FR-11.1).
lib/services/**         ALL business logic. Unit tests live next to it.
lib/repositories/**     The only place allowed to call prisma.*
lib/schemas/**          Zod schemas — shared by API, actions and forms.
lib/auth/**             Auth.js config, session helpers, guards.
prisma/                 schema.prisma, migrations, seed.ts
messages/               ru.json, en.json
```

### Hard rules

1. Business logic lives only in `lib/services/`. Route handlers and server
   actions do four things: parse input with a Zod schema, get the session,
   call a service, map the result or error to a response.
2. `prisma.*` is called only from `lib/repositories/`. Anywhere else is a
   review failure.
3. Every service that reads or writes user-owned data checks ownership as its
   first statement (NFR-1.1). Never rely on middleware for authorization —
   middleware only redirects unauthenticated visitors.
4. Every admin service checks the role explicitly (NFR-1.2).
5. Server actions call services directly. They must never `fetch()` the app's
   own REST API.
6. Any operation touching more than one row runs inside `prisma.$transaction`
   (NFR-2.1).

## Money

- Amounts are integers in minor units (kopecks, cents). Never float, never
  `parseFloat`, never `toFixed` for arithmetic.
- Formatting happens only at render time, through `Intl.NumberFormat`.
- Conversion rate, converted amount and rate date are written into the
  transaction at creation and never recomputed (FR-4.6, FR-7.6).
- Rounding on conversion: half up, to the minor unit.
- Cross rates are computed through BYN. Never store a non-BYN target rate.

## Errors

- Services throw typed domain errors carrying a machine-readable `code` from
  the table in `docs/api.md`.
- Route handlers map those codes to HTTP status codes. No ad-hoc status codes.
- `message` is always English and is for logs. User-facing text is resolved on
  the client from `code` and the active locale (FR-11.5).
- Requesting another user's resource returns 404, never 403.

## i18n

- No string literals in JSX. Every visible string goes through `t('...')`.
- Both `messages/ru.json` and `messages/en.json` are updated in the same
  commit that adds a key. A key missing from either file is a broken build.
- Locale sits in the URL: `/ru/...`, `/en/...`. Default is `ru`.
- API responses are never translated.

## Design

`docs/design-system.md` is binding. Summary of the prohibitions:

- Colors only from CSS variables. `slate-*`, `gray-*`, `blue-500` and friends
  are forbidden.
- No gradients anywhere.
- No `box-shadow` except popovers and dropdowns.
- Radius is always `var(--radius)`. No `rounded-xl`, `rounded-2xl`,
  `rounded-full`.
- `font-weight` is 400 or 500 only.
- No emoji in the UI. Icons are `lucide-react` at 16px, only where the glyph
  carries meaning. No icons next to headings.
- Data lists are tables, not card grids.
- Money renders only through `<Amount />`.
- No pie or donut charts.
- Animations max 150ms, `opacity` and `transform` only.

Do not propose an alternative aesthetic. The direction is fixed.

## Testing

- Every function added to `lib/services/` gets a test beside it as
  `<name>.test.ts`, in the same pull request.
- Services are tested against a mocked repository. Tests do not need a live
  database.
- Required coverage (NFR-4.3): balance calculation, category aggregation,
  budget usage, currency conversion and rounding, transfer invariants,
  ownership checks.
- `pnpm run test` and `pnpm run lint` must pass before a pull request is opened.

## Commands

```bash
pnpm run dev              # dev server
pnpm run test             # vitest
pnpm run lint             # eslint + tsc --noEmit
pnpm run db:up            # docker compose up -d postgres
pnpm run db:migrate       # prisma migrate dev
pnpm run db:seed          # demo data
pnpm run db:studio        # prisma studio
```

## Git

- One vertical slice per branch, one branch per pull request.
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.
- Commit messages, code, identifiers and comments are English. UI copy is
  Russian and English via `messages/`.
- Squash and merge into `main`. Never push to `main` directly.

## Working style

- Before a task, state in one or two sentences what you are going to change
  and which files it touches. Wait for confirmation on anything that touches
  the schema, auth, or the money path.
- Change only what the task asks for. Do not refactor adjacent code, do not
  reformat untouched files, do not "improve" things nobody asked about.
- When a requirement and the existing code disagree, stop and say so instead
  of picking one.
- Never write a migration that drops a column or table without saying so
  explicitly first.
- Never commit `.env`, secrets, or generated files.

## Definition of done

A pull request is finished when: types pass, lint passes, tests pass, new
services have tests, both locale files are updated, empty and loading and
error states exist for any new list, and the referenced FR numbers are
satisfied.
