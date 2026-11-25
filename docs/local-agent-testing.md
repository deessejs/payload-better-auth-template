# Local agent testing

This workflow bootstraps and verifies one local worktree of the Payload + Better Auth template. It uses local PostgreSQL, a real Next.js development server, and a real Chromium browser. It does not use a remote or shared database.

## Requirements

- A Node.js version supported by the root `package.json` (`^22.23.5`, `^24.22.3`, or `>=26.13.1`) and pnpm 12.
- PostgreSQL with `psql`, listening only on loopback.
- Either non-interactive `sudo -n -u postgres` access or `AGENT_TEST_PG_ADMIN_URL` set in the shell to a PostgreSQL administrator URL for that same loopback server and port. The script refuses remote administrator URLs and checks the server's listener and port before any database change.
- Chromium and its system libraries. `pnpm agent:prepare` installs the Playwright Chromium build.

## Prepare and start

From the repository root:

```sh
pnpm agent:prepare
pnpm agent:status
pnpm agent:credentials
pnpm agent:start
```

`prepare` installs from the lockfile, derives a 12-character identity from the canonical worktree path, and creates a worktree-specific database and least-privilege role in the local PostgreSQL server. The database name and role are `payload_agent_<worktree-id>`. Credentials, fixture passwords, and the selected app port are stored in ignored `.local/agent-test.env`; `.local/` is mode `0700` and the env file is mode `0600`.

Better Auth tables are created with its own CLI migration in the `auth` schema. Initializing Payload through its Local API creates the Payload collection schema in `public`, following the development schema-push workflow. A Payload admin fixture is provisioned through the Payload Local API. The deterministic Better Auth user email is signed up through the app's `/api/auth/sign-up/email` handler, so the browser login fixture uses the same route as normal app traffic. The generated passwords stay stable for the life of this worktree env file and across a supported reset.

`pnpm agent:start` runs only the app for this worktree and prints its loopback URL. Use the guarded `pnpm agent:credentials` output to log in through `/login` or `/admin`. The ordinary user and Payload admin use different accounts, credentials, cookies, and auth handlers. The checked-in fixture credentials are never hard-coded.

## Browser acceptance run

```sh
pnpm agent:test
```

This creates a unique `payload_test_<worktree-id>_<run-id>` database and `payload_t_<worktree-id>_<run-id>` role. It runs Better Auth's migration, seeds the Payload admin with the Local API, verifies that both `auth.user` and `public.examples` exist, starts the app on a free loopback port, signs up the deterministic user through Better Auth, then runs the app's Playwright suite. The browser suite covers:

- `/dashboard` redirects to `/login` without a Better Auth session.
- Sign-up and login work through the actual forms.
- A signed-in user can create an example, and the record remains after reload.
- A Better Auth session does not authenticate the Payload REST endpoint or Admin Panel.
- A Payload admin can use Payload REST/Admin while the same browser context still has no Better Auth session, and cannot access `/dashboard`.

The runner captures and redacts database URLs, auth secrets, and fixture passwords from subprocess output. It verifies database ownership before cleanup and drops only the run-scoped database and role in a `finally` block. If the process is forcibly killed before cleanup, a run-scoped database may remain. Inspect the exact identity and owner before removing any orphan; the normal worktree reset and clean commands do not remove run-scoped databases.

Playwright output and failure traces are under ignored `.local/agent-test/`. Traces can contain rendered form values and browser state; keep this private and remove it after use if no longer needed.

## Reset and cleanup

```sh
pnpm agent:reset -- --yes
pnpm agent:clean -- --yes
```

Reset requires confirmation and drops/recreates only `payload_agent_<worktree-id>` after checking its owner and loopback server. It re-applies Better Auth's migration and recreates both fixtures using the saved passwords. Clean requires confirmation, drops only that database and its dedicated role, then removes the private fixture env file. Neither command targets the test run databases or any other worktree.

## Fixture credentials and integrations

`pnpm agent:credentials` prints the SaaS user, a separate sign-up fixture, and the Payload admin. It requires the current worktree's owned mode-0600 env file and verifies the local PostgreSQL server and database owner. The email addresses use the reserved `.test` domain. Passwords are generated per worktree and are intentionally disposable. Do not copy these values into shared or production environments.

The app has no email provider, uploads, or other external integration in this template. The tests do not configure or exercise any external service. They test the app's real local auth routes, server-side dashboard check, Server Action write, Payload Local API, REST API, and native Admin Panel.

## Commands and diagnostics

```sh
pnpm test:agent-infra
pnpm agent:prepare
pnpm agent:status
pnpm agent:credentials
pnpm agent:start
pnpm agent:test
pnpm lint
pnpm typecheck
pnpm format:check
pnpm --filter @template/app build
```

`pnpm test:agent-infra` covers deterministic worktree identities, local URL validation, and captured-output redaction without touching PostgreSQL. If setup refuses the database, check that PostgreSQL is listening only on `localhost`/loopback, that its port matches `DATABASE_URL`, and that either local admin method works. Do not work around a rejection by passing a remote database URL.
