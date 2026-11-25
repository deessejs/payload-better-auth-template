# Payload + Better Auth SaaS template

A single Next.js app with Payload 3 for content and trusted CMS administration, and Better Auth for customer accounts. Both live in `apps/app`; they use separate authentication systems and own separate PostgreSQL schemas.

The public homepage, Better Auth screens, and dashboard use shadcn/ui with Tailwind CSS v4. Shared primitives, tokens, stylesheet, and PostCSS setup live in `packages/ui` as `@template/ui`. Payload's required admin CSS stays isolated in its own route group.

## Requirements

- Node.js `^22.23.5`, `^24.22.3`, or `>=26.13.1`
- pnpm 12
- PostgreSQL

Payload and its used Payload packages are pinned together at 3.94.2. This template deliberately stays on Payload 3.

## Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. Export those root environment variables in the shell before CLI commands (for example, `set -a; . ./.env; set +a`). Next dev/build also reads the app environment; the example is kept at the repository root.
3. Ensure the database role can create the `auth` schema and its tables. If it cannot, create the schema and grant the role access before applying Better Auth's migration.
4. Run `pnpm --filter @template/app auth:migrate` to create Better Auth's tables in the `auth` schema.
5. Start the app with `pnpm dev --filter @template/app` (or `pnpm --filter @template/app dev`). In development, Payload's Postgres adapter manages its schema in PostgreSQL's `public` schema.

`DATABASE_URL` is shared. Payload owns collections and migrations in `public`; Better Auth's built-in Kysely adapter uses its documented `database.schemaName: 'auth'` setting for runtime queries and CLI migrations. The two migration systems do not manage one another's tables. This is a documented arrangement of separate adapters, not a vendor-certified Payload + Better Auth integration.

## Routes

- `/` public homepage
- `/login` Better Auth sign-in
- `/sign-up` Better Auth registration
- `/dashboard` protected by a server-side Better Auth session check
- `/admin` Payload Admin Panel, authenticated only with Payload's native `admins` collection
- `/api/auth/*` Better Auth handler
- `/api/examples` Payload REST endpoint, available to authenticated Payload admins only

## Frontend UI

The `(frontend)` root layout imports `@template/ui/globals.css` once. Shared Button, Card, Input, Label, and `cn` exports live in `packages/ui`; app-specific pages and the Better Auth form stay in `apps/app`. The shared Tailwind v4 stylesheet scans both workspaces. Payload's vendor stylesheet is imported only by the separate `(payload)` layout and is not part of the frontend design system.

Both `apps/app/components.json` and `packages/ui/components.json` are configured for the shadcn monorepo CLI with matching `radix-nova`, neutral, and Lucide settings. Run the CLI from `apps/app` to add app-facing components; shared primitives are routed to `packages/ui`.

The sample dashboard reads and creates a small `examples` record through Payload's Local API. Local API calls bypass Payload access control, so the DAL verifies Better Auth independently and the query filters on the session's user ID; writes derive `ownerId` from the verified session. A Better Auth session is not a Payload user and never grants access to `/admin`.

## Payload administration and migrations

The first trusted CMS administrator is bootstrapped using Payload's native first-user setup at `/admin`. There is no public admin registration flow. Provision additional Payload admins from the authenticated Payload Admin Panel; do not create them from Better Auth users.

Payload's blank-template convention keeps the generated Admin import map out of Git. The app recreates it from `payload.config.ts` before development, production builds, and type checks; do not edit that generated file by hand. Generated `payload-types.ts` and migration files are checked in. Useful commands from the repository root:

```sh
pnpm --filter @template/app payload:types
pnpm --filter @template/app payload:migrate:create
pnpm --filter @template/app payload:migrate
pnpm --filter @template/app payload:migrate:status
pnpm --filter @template/app auth:migrate
pnpm --filter @template/app dev
pnpm --filter @template/app build
pnpm lint
pnpm typecheck
pnpm format:check
```

GraphQL is explicitly disabled. Payload uses its development schema-push workflow while developing. Generate and commit migrations for deployed environments, then apply them with Payload's CLI. Better Auth owns its own schema migration through its CLI. Keep both workflows pointed at the same database URL; Better Auth creates/uses only `auth`, and Payload stays on `public`.

## Compatibility references

- [Payload 3.94.2 installation requirements](https://github.com/payloadcms/payload/blob/v3.94.2/docs/getting-started/installation.mdx)
- [Payload 3.94.2 releases](https://github.com/payloadcms/payload/releases/tag/v3.94.2)
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth PostgreSQL adapter and schemaName](https://better-auth.com/docs/adapters/postgresql)
- [Next.js authentication and DAL guidance](https://nextjs.org/docs/app/guides/authentication)
