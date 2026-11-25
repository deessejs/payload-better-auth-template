---
name: local-app-testing
description: Bootstrap and functionally test the Payload + Better Auth template in one isolated local worktree.
---

# Test the app locally

Read [the local agent testing guide](../../../docs/local-agent-testing.md) for prerequisites, database isolation, and credential handling.

1. Run `pnpm agent:prepare` and confirm `pnpm agent:status` names the current worktree's loopback database.
2. Run `pnpm agent:credentials` only when credentials are needed for a real local UI login. Do not copy them elsewhere.
3. Run `pnpm agent:start` and inspect `/`, `/login`, `/sign-up`, `/dashboard`, and `/admin` through the browser.
4. Run `pnpm agent:test` for signup, login, dashboard persistence, and the independent Payload admin/API boundary. This command owns a separate run-scoped database and removes it after the run.
5. Run `pnpm test:agent-infra`, lint, typecheck, formatting, and build checks as relevant to the change.
6. Report the actual browser and database evidence, along with anything that was unavailable. Do not infer auth or browser behavior from a build or a `curl` response alone.

Use only the guarded `pnpm agent:reset -- --yes` or `pnpm agent:clean -- --yes` commands when the task authorizes destructive local fixture operations. Never use this workflow with production or shared databases.
