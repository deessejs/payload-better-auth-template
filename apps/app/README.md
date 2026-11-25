# App

Single Next.js app for the public homepage, Better Auth pages, protected dashboard, and isolated Payload Admin Panel.

The frontend uses shadcn/ui primitives from `@template/ui` and Tailwind CSS v4. The shared stylesheet is imported only from the `(frontend)` root layout. Payload's generated admin styling remains in the `(payload)` route group.

For isolated local fixtures and real browser checks, follow the repository's [local agent testing workflow](../../docs/local-agent-testing.md). The root `pnpm agent:*` commands provision worktree-owned loopback PostgreSQL data and never use a shared or remote database.
