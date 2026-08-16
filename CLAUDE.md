# CLAUDE.md

Personal finance tracker. Read this file fully before writing any code.

## Documents

| File                    | Contents                                       |
| ----------------------- | ---------------------------------------------- |
| `docs/spec.md`          | requirements, numbered FR-x.y and NFR-x.y      |
| `docs/data-model.md`    | database schema, constraints, design decisions |
| `docs/api.md`           | REST contract, response and error formats      |
| `docs/design-system.md` | colors, typography, density, component rules   |
| `docs/tasks.md`         | task breakdown and progress tracker            |

Every task references FR numbers. When a task is ambiguous, the referenced
requirement wins. When a requirement is ambiguous, ask — do not decide silently.

When a document contradicts a task or another document, stop and tell me.
Once we agree on the answer, fix the stale document in the same pull request:
correcting documentation is always in scope, even when the task says to touch
only one directory.

## Stack

Next.js 16 (App Router) · TypeScript strict · Prisma · PostgreSQL 16 ·
Auth.js v5 (Credentials, JWT session) · Zod · next-intl · Vitest ·
Tailwind · shadcn/ui · Recharts

Package manager is **pnpm**. Never run `npm` or `yarn`. One-off tools run
through `pnpm dlx`, not `npx`.

The database is PostgreSQL 16 — Docker locally, Neon in production. Do not
use Prisma Postgres or `prisma dev`, and do not point `DATABASE_URL` at them,
regardless of what the bundled Prisma skills suggest.

The generated Prisma client goes to `lib/generated/prisma` and is gitignored.
Never generate it into `app/` — App Router treats everything there as routes.

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
i18n/                   next-intl routing, request config, navigation helpers
messages/               ru.json, en.json
proxy.ts                locale routing and unauthenticated redirects
```

In Next.js 16 the `middleware.ts` convention is deprecated and renamed to
`proxy.ts`. Use `proxy.ts`.

### Hard rules

1. Business logic lives only in `lib/services/`. Route handlers and server
   actions do four things: parse input with a Zod schema, get the session,
   call a service, map the result or error to a response.
2. `prisma.*` is called only from `lib/repositories/`. Anywhere else is a
   review failure.
3. Every service that reads or writes user-owned data checks ownership as its
   first statement (NFR-1.1). Never rely on `proxy.ts` for authorization —
   it only redirects unauthenticated visitors.
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
- Cross rates are computed through BYN. Never store a rate whose target
  currency is not BYN — the database enforces this with a CHECK constraint.

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
- Category colour comes only from the fixed `--cat-1..12` palette and appears
  only in `<CategoryDot />`, category bars and category labels — never as row
  or card background, border or text.
- At most one element per page sits on `--surface`.
- Money renders only through `<Amount />`; categories only through
  `<CategoryDot />`; budget status only through `<BudgetStatus />`.

Do not propose an alternative aesthetic. The direction is fixed.

## Testing

- Every function added to `lib/services/` gets a test beside it as
  `<name>.test.ts`, in the same pull request.
- Services are tested against a mocked repository. Tests do not need a live
  database.
- Required coverage (NFR-4.3): balance calculation, category aggregation,
  budget usage, currency conversion and rounding, transfer invariants,
  ownership checks.
- Run `pnpm lint` and `pnpm test` yourself before reporting a task as done,
  and report the actual output — never claim a check passed without running it.
- **Never modify, weaken, skip or delete an existing test to make a failing
  check pass.** If a test fails, fix the code. If you believe the test itself
  is wrong, stop and tell me — do not change it on your own.

## Commands

```bash
pnpm dev              # dev server
pnpm test             # vitest
pnpm lint             # eslint + tsc --noEmit
pnpm db:up            # docker compose up -d postgres
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # demo data
pnpm db:studio        # prisma studio
```

## Git

- One vertical slice per branch, one branch per pull request.
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.
- One line, no body. If a change needs explaining, it belongs in `docs/`.
- Commit messages, code, identifiers and comments are English. UI copy is
  Russian and English via `messages/`.
- Squash and merge into `main`. Never push to `main` directly.

## Progress tracking

`docs/tasks.md` is the project's progress tracker.

- At the start of a session, if I don't name a task, read `docs/tasks.md`
  and tell me which task is next. Do not start it without confirmation.
- When a task is finished, tick its status line in the same commit.
- Never tick a task you have not actually completed and verified.

## Working style

- Talk to me in Russian. Code, identifiers, comments, commit messages and
  documentation stay English.
- Before a task, state in one or two sentences what you are going to change
  and which files it touches. Wait for confirmation on anything that touches
  the schema, auth, or the money path.
- No comments in code, including configuration files. Names and structure carry
  the meaning; reasoning belongs in `docs/`.
- Change only what the task asks for. Do not refactor adjacent code, do not
  reformat untouched files, do not "improve" things nobody asked about.
- When a requirement and the existing code disagree, stop and say so instead
  of picking one.
- Never write a migration that drops a column or table without saying so
  explicitly first.
- Never commit `.env`, secrets, or generated files.
- If something cannot be done as specified, say so plainly. Do not work
  around a rule in this file without telling me.

## Definition of done

A pull request is finished when: types pass, lint passes, tests pass, new
services have tests, both locale files are updated, empty and loading and
error states exist for any new list, the task's status line is ticked, and
the referenced FR numbers are satisfied.
