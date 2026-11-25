#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  redactOutput,
  testDatabaseIdentity,
  validateLocalDatabaseURL,
  worktreeIdentity,
} from './agent-test-core.mjs';

const root = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const worktreeId = worktreeIdentity(root);
const localDir = path.join(root, '.local');
const envFile = path.join(localDir, 'agent-test.env');
const args = process.argv.slice(2);
const command = args[0] ?? 'help';
const persistentIdentity = {
  database: `payload_agent_${worktreeId}`,
  role: `payload_agent_${worktreeId}`,
};
const portSeed = Number.parseInt(worktreeId.slice(0, 8), 16);
const persistentPort = 41000 + (portSeed % 10000);
const appDir = path.join(root, 'apps/app');

function fail(message) {
  throw new Error(message);
}

function assertSupportedNode() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  const supported =
    (major === 22 && (minor > 23 || (minor === 23 && patch >= 5))) ||
    (major === 24 && (minor > 22 || (minor === 22 && patch >= 3))) ||
    major > 26 ||
    (major === 26 && (minor > 13 || (minor === 13 && patch >= 1)));
  if (!supported) {
    fail(
      `Node.js ${process.versions.node} is outside package.json engines.node. Use Node ^22.23.5, ^24.22.3, or >=26.13.1 before running this workflow.`,
    );
  }
}

function ensurePrivateDirectory() {
  mkdirSync(localDir, { recursive: true, mode: 0o700 });
  const stat = lstatSync(localDir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    fail('The local .local path must be a real directory.');
  }
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) {
    fail('The local .local directory must be owned by the current user.');
  }
  chmodSync(localDir, 0o700);
}

function assertPrivateFile(filename) {
  const stat = lstatSync(filename);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    fail('Local agent credentials must be stored in a regular, non-symlink file.');
  }
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) {
    fail('Local agent credentials must be owned by the current user.');
  }
  if ((stat.mode & 0o077) !== 0) {
    fail('Local agent credentials must have mode 0600. Move the file aside and rerun prepare.');
  }
}

function parseEnv(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function validateValues(values) {
  if (values.AGENT_TEST_WORKTREE_ID !== worktreeId) {
    fail('Local agent environment belongs to a different worktree.');
  }
  if (
    values.AGENT_TEST_DB_NAME !== persistentIdentity.database ||
    values.AGENT_TEST_DB_ROLE !== persistentIdentity.role ||
    Number(values.AGENT_TEST_PG_PORT) < 1
  ) {
    fail('Local agent database identity does not match this worktree.');
  }
  validateLocalDatabaseURL(values.DATABASE_URL, {
    ...persistentIdentity,
    port: Number(values.AGENT_TEST_PG_PORT),
  });
  const expectedURL = `http://127.0.0.1:${values.AGENT_TEST_APP_PORT}`;
  if (values.BETTER_AUTH_URL !== expectedURL) {
    fail('Local agent auth URL does not match the worktree app port.');
  }
  for (const key of [
    'AGENT_TEST_USER_EMAIL',
    'AGENT_TEST_USER_PASSWORD',
    'AGENT_TEST_SIGNUP_EMAIL',
    'AGENT_TEST_SIGNUP_PASSWORD',
    'AGENT_TEST_ADMIN_EMAIL',
    'AGENT_TEST_ADMIN_PASSWORD',
    'PAYLOAD_SECRET',
    'BETTER_AUTH_SECRET',
  ]) {
    if (!values[key]) fail(`Local agent environment is missing ${key}.`);
  }
  return values;
}

function makeValues() {
  ensurePrivateDirectory();
  if (existsSync(envFile)) {
    assertPrivateFile(envFile);
    return validateValues(parseEnv(readFileSync(envFile, 'utf8')));
  }
  const dbPassword = randomBytes(32).toString('base64url');
  const baseURL = `http://127.0.0.1:${persistentPort}`;
  const databaseURL = new URL(
    `postgresql://${persistentIdentity.role}:${dbPassword}@127.0.0.1:${process.env.AGENT_TEST_PG_PORT || 5432}/${persistentIdentity.database}`,
  );
  const values = {
    AGENT_TEST_MODE: '1',
    AGENT_TEST_WORKTREE_ID: worktreeId,
    AGENT_TEST_DB_NAME: persistentIdentity.database,
    AGENT_TEST_DB_ROLE: persistentIdentity.role,
    AGENT_TEST_PG_PORT: process.env.AGENT_TEST_PG_PORT || '5432',
    AGENT_TEST_APP_PORT: String(persistentPort),
    AGENT_TEST_USER_EMAIL: `agent-user-${worktreeId}@example.test`,
    AGENT_TEST_USER_PASSWORD: randomBytes(24).toString('base64url'),
    AGENT_TEST_SIGNUP_EMAIL: `agent-signup-${worktreeId}@example.test`,
    AGENT_TEST_SIGNUP_PASSWORD: randomBytes(24).toString('base64url'),
    AGENT_TEST_ADMIN_EMAIL: `payload-admin-${worktreeId}@example.test`,
    AGENT_TEST_ADMIN_PASSWORD: randomBytes(24).toString('base64url'),
    DATABASE_URL: databaseURL.toString(),
    PAYLOAD_SECRET: randomBytes(48).toString('base64url'),
    BETTER_AUTH_SECRET: randomBytes(48).toString('base64url'),
    BETTER_AUTH_URL: baseURL,
  };
  validateValues(values);
  writeFileSync(
    envFile,
    `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`,
    { mode: 0o600, flag: 'wx' },
  );
  chmodSync(envFile, 0o600);
  return values;
}

function readValues() {
  if (!existsSync(envFile)) fail('Run pnpm agent:prepare first.');
  assertPrivateFile(envFile);
  return validateValues(parseEnv(readFileSync(envFile, 'utf8')));
}

function minimalEnvironment(values = {}, overrides = {}) {
  const env = {};
  for (const key of [
    'PATH',
    'HOME',
    'TMPDIR',
    'TMP',
    'TEMP',
    'LANG',
    'LC_ALL',
    'TERM',
    'FORCE_COLOR',
    'CI',
    'PNPM_HOME',
    'COREPACK_HOME',
  ]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  env.npm_config_userconfig = path.join(root, '.npmrc');
  env.NODE_ENV = 'development';
  env.AGENT_TEST_MODE = '1';
  Object.assign(env, values, overrides);
  return env;
}

function secretsFor(values = {}) {
  return [
    values.DATABASE_URL,
    values.PAYLOAD_SECRET,
    values.BETTER_AUTH_SECRET,
    values.AGENT_TEST_USER_PASSWORD,
    values.AGENT_TEST_SIGNUP_PASSWORD,
    values.AGENT_TEST_ADMIN_PASSWORD,
  ];
}

function run(commandName, commandArgs, values = {}, options = {}) {
  const result = spawnSync(commandName, commandArgs, {
    cwd: options.cwd ?? root,
    env: minimalEnvironment(values, options.env),
    encoding: 'utf8',
    input: options.input,
    maxBuffer: 32 * 1024 * 1024,
  });
  const output = redactOutput(`${result.stdout ?? ''}${result.stderr ?? ''}`, secretsFor(values));
  if (output) process.stdout.write(output);
  if (result.error || result.status !== 0) {
    fail(
      `${commandName} ${commandArgs.join(' ')} failed with exit code ${result.status ?? 'unknown'}. Output above was redacted.`,
    );
  }
  return result.stdout.trim();
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function assertIdentifier(value) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value)) fail('Invalid generated PostgreSQL identifier.');
  return value;
}

function createPostgresManager(values) {
  const databaseURL = validateLocalDatabaseURL(values.DATABASE_URL, {
    database: values.AGENT_TEST_DB_NAME,
    role: values.AGENT_TEST_DB_ROLE,
    port: Number(values.AGENT_TEST_PG_PORT),
  });
  const port = Number(values.AGENT_TEST_PG_PORT);
  const customAdminRaw = process.env.AGENT_TEST_PG_ADMIN_URL;
  let customAdmin;
  if (customAdminRaw) {
    let candidate;
    try {
      candidate = new URL(customAdminRaw);
    } catch {
      fail('AGENT_TEST_PG_ADMIN_URL must be a local PostgreSQL administrator URL.');
    }
    if (
      !['postgres:', 'postgresql:'].includes(candidate.protocol) ||
      !['localhost', '127.0.0.1', '::1'].includes(candidate.hostname) ||
      Number(candidate.port || 5432) !== port ||
      candidate.pathname !== '/postgres' ||
      !candidate.username ||
      !candidate.password ||
      candidate.search ||
      candidate.hash
    ) {
      fail('PostgreSQL administrator must target the same loopback server and postgres database.');
    }
    customAdmin = candidate;
  }

  function adminSQL(sql) {
    const baseArgs = [
      '-X',
      '-qAt',
      '-v',
      'ON_ERROR_STOP=1',
      '-p',
      String(port),
      '-d',
      'postgres',
      '-f',
      '-',
    ];
    const inherited = minimalEnvironment();
    let executable = 'sudo';
    let commandArgs = ['-n', '-u', 'postgres', 'psql', ...baseArgs];
    let env = inherited;
    if (customAdmin) {
      executable = 'psql';
      commandArgs = [
        '-X',
        '-qAt',
        '-v',
        'ON_ERROR_STOP=1',
        '-h',
        customAdmin.hostname,
        '-p',
        String(port),
        '-U',
        decodeURIComponent(customAdmin.username),
        '-d',
        'postgres',
        '-f',
        '-',
      ];
      env = {
        ...inherited,
        PGPASSWORD: decodeURIComponent(customAdmin.password),
      };
    }
    const result = spawnSync(executable, commandArgs, {
      cwd: root,
      env,
      encoding: 'utf8',
      input: `${sql}\n`,
    });
    if (result.error || result.status !== 0) {
      fail(
        'Could not access the configured loopback PostgreSQL administrator. Check local PostgreSQL and non-interactive sudo access.',
      );
    }
    return result.stdout.trim();
  }

  function assertLoopbackServer() {
    const addresses = adminSQL("SELECT current_setting('listen_addresses');")
      .split(',')
      .map((address) => address.trim());
    if (
      !addresses.length ||
      addresses.some((address) => !['localhost', '127.0.0.1', '::1'].includes(address))
    ) {
      fail('PostgreSQL must listen only on localhost, 127.0.0.1, or ::1.');
    }
    if (adminSQL("SELECT current_setting('port');") !== String(port)) {
      fail('PostgreSQL administrator is connected to a different server port.');
    }
  }

  function databaseOwner(database = values.AGENT_TEST_DB_NAME) {
    assertIdentifier(database);
    return adminSQL(
      `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = ${sqlLiteral(database)};`,
    );
  }

  function roleExists(role = values.AGENT_TEST_DB_ROLE) {
    assertIdentifier(role);
    return Boolean(adminSQL(`SELECT 1 FROM pg_roles WHERE rolname = ${sqlLiteral(role)};`));
  }

  function assertRoleDedicated(role, expectedDatabase) {
    const privileged = adminSQL(
      `SELECT (rolsuper OR rolreplication OR rolcreaterole OR rolcreatedb)::text FROM pg_roles WHERE rolname = ${sqlLiteral(role)};`,
    );
    if (privileged !== 'false')
      fail('Local agent database role is privileged. Refusing to use or remove it.');
    const owned = adminSQL(
      `SELECT datname FROM pg_database WHERE datdba = (SELECT oid FROM pg_roles WHERE rolname = ${sqlLiteral(role)}) ORDER BY datname;`,
    )
      .split('\n')
      .filter(Boolean);
    if (owned.some((database) => database !== expectedDatabase)) {
      fail('Local agent role owns another database. Refusing changes to it.');
    }
  }

  function checkApplicationConnection(url = databaseURL) {
    const result = spawnSync(
      'psql',
      [
        '-X',
        '-qAt',
        '-v',
        'ON_ERROR_STOP=1',
        '-h',
        url.hostname,
        '-p',
        String(port),
        '-U',
        decodeURIComponent(url.username),
        '-d',
        decodeURIComponent(url.pathname.slice(1)),
        '-c',
        'SELECT current_user;',
      ],
      {
        cwd: root,
        env: { ...minimalEnvironment(), PGPASSWORD: decodeURIComponent(url.password) },
        encoding: 'utf8',
      },
    );
    if (
      result.error ||
      result.status !== 0 ||
      result.stdout.trim() !== decodeURIComponent(url.username)
    ) {
      fail(
        'Local PostgreSQL application credentials do not work. Run pnpm agent:reset -- --yes after checking the target identity.',
      );
    }
  }

  function ensureDatabase(reset = false) {
    assertLoopbackServer();
    const database = assertIdentifier(values.AGENT_TEST_DB_NAME);
    const role = assertIdentifier(values.AGENT_TEST_DB_ROLE);
    let owner = databaseOwner(database);
    let hasRole = roleExists(role);
    if (owner && owner !== role)
      fail('Worktree database owner mismatch. Refusing to touch this database.');
    if (owner && !hasRole)
      fail('Worktree database role is missing. Refusing to change the database.');
    if (hasRole) assertRoleDedicated(role, database);
    if (!owner && hasRole && !reset) {
      fail(
        'Local worktree role exists without its database. Inspect it or run agent:reset -- --yes.',
      );
    }
    if (owner && !reset) {
      checkApplicationConnection(databaseURL);
      return;
    }
    if (hasRole) {
      adminSQL(
        `ALTER ROLE ${role} WITH LOGIN PASSWORD ${sqlLiteral(decodeURIComponent(databaseURL.password))};`,
      );
    } else {
      adminSQL(
        `CREATE ROLE ${role} LOGIN PASSWORD ${sqlLiteral(decodeURIComponent(databaseURL.password))};`,
      );
      hasRole = true;
    }
    if (owner) {
      adminSQL(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${sqlLiteral(database)} AND pid <> pg_backend_pid();`,
      );
      adminSQL(`DROP DATABASE ${database};`);
      owner = '';
    }
    if (!owner) adminSQL(`CREATE DATABASE ${database} OWNER ${role};`);
    if (databaseOwner(database) !== role)
      fail('Could not verify local worktree database ownership.');
    checkApplicationConnection(databaseURL);
  }

  function createDisposable(identity, baseValues) {
    assertLoopbackServer();
    const database = assertIdentifier(identity.database);
    const role = assertIdentifier(identity.role);
    if (databaseOwner(database) || roleExists(role)) {
      fail('Disposable database identity already exists. Refusing to reuse or remove it.');
    }
    const password = randomBytes(24).toString('base64url');
    const databaseURL = new URL(baseValues.DATABASE_URL);
    databaseURL.username = role;
    databaseURL.password = password;
    databaseURL.pathname = `/${database}`;
    const childValues = {
      ...baseValues,
      AGENT_TEST_DB_NAME: database,
      AGENT_TEST_DB_ROLE: role,
      DATABASE_URL: databaseURL.toString(),
    };
    validateLocalDatabaseURL(childValues.DATABASE_URL, {
      database,
      role,
      port,
    });
    let madeRole = false;
    try {
      adminSQL(`CREATE ROLE ${role} LOGIN PASSWORD ${sqlLiteral(password)};`);
      madeRole = true;
      adminSQL(`CREATE DATABASE ${database} OWNER ${role};`);
      if (databaseOwner(database) !== role) fail('Could not verify disposable database ownership.');
      checkApplicationConnection(databaseURL);
      return { values: childValues, database, role };
    } catch (error) {
      if (databaseOwner(database) === role) dropDatabase(database, role);
      if (madeRole && !databaseOwner(database)) adminSQL(`DROP ROLE ${role};`);
      throw error;
    }
  }

  function dropDatabase(database, expectedOwner) {
    assertLoopbackServer();
    const owner = databaseOwner(database);
    if (owner && owner !== expectedOwner) fail('Database owner changed. Refusing local cleanup.');
    if (!owner) return;
    adminSQL(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${sqlLiteral(database)} AND pid <> pg_backend_pid();`,
    );
    adminSQL(`DROP DATABASE ${database};`);
    if (databaseOwner(database)) fail('Database remains after cleanup.');
  }

  function removeRole(role, expectedDatabase) {
    assertLoopbackServer();
    if (!roleExists(role)) return;
    assertRoleDedicated(role, expectedDatabase);
    adminSQL(`DROP ROLE ${assertIdentifier(role)};`);
  }

  function assertSchemasReady(url = databaseURL) {
    const result = spawnSync(
      'psql',
      [
        '-X',
        '-qAt',
        '-v',
        'ON_ERROR_STOP=1',
        '-h',
        url.hostname,
        '-p',
        String(port),
        '-U',
        decodeURIComponent(url.username),
        '-d',
        decodeURIComponent(url.pathname.slice(1)),
        '-c',
        "SELECT (to_regclass('auth.user') IS NOT NULL AND to_regclass('public.examples') IS NOT NULL)::text;",
      ],
      {
        cwd: root,
        env: { ...minimalEnvironment(), PGPASSWORD: decodeURIComponent(url.password) },
        encoding: 'utf8',
      },
    );
    if (result.error || result.status !== 0 || result.stdout.trim() !== 'true') {
      fail('Expected Better Auth auth.user and Payload public.examples tables were not created.');
    }
  }

  return {
    assertLoopbackServer,
    assertSchemasReady,
    checkApplicationConnection,
    createDisposable,
    databaseOwner,
    dropDatabase,
    ensureDatabase,
    removeRole,
  };
}

function findFreePort(start) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(start, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

function runPnpm(commandArgs, values = {}, options = {}) {
  return run('pnpm', commandArgs, values, options);
}

async function ensureDependencies() {
  process.stdout.write('Installing locked workspace dependencies...\n');
  runPnpm(['install', '--frozen-lockfile']);
  process.stdout.write('Installing Chromium for browser tests...\n');
  runPnpm(['--filter', '@template/app', 'exec', 'playwright', 'install', 'chromium']);
}

function migrateAndSeedAdmin(values) {
  runPnpm(['--filter', '@template/app', 'auth:migrate'], values);
  runPnpm(['--filter', '@template/app', 'exec', 'tsx', 'scripts/seed-local-agent.ts'], values);
  createPostgresManager(values).assertSchemasReady();
}

async function signUpFixtureUser(baseURL, values) {
  const signIn = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: baseURL },
    body: JSON.stringify({
      email: values.AGENT_TEST_USER_EMAIL,
      password: values.AGENT_TEST_USER_PASSWORD,
    }),
  });
  if (signIn.ok) return;
  const signup = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: baseURL },
    body: JSON.stringify({
      name: 'Local Agent User',
      email: values.AGENT_TEST_USER_EMAIL,
      password: values.AGENT_TEST_USER_PASSWORD,
      callbackURL: '/dashboard',
    }),
  });
  if (!signup.ok) {
    fail(
      `Could not provision the local Better Auth fixture (HTTP ${signup.status}). If its saved password changed, run agent:reset -- --yes.`,
    );
  }
  process.stdout.write('Better Auth user fixture is ready.\n');
}

function startDetachedApp(values, port) {
  const childValues = {
    ...values,
    AGENT_TEST_APP_PORT: String(port),
    BETTER_AUTH_URL: `http://127.0.0.1:${port}`,
  };
  const baseURL = childValues.BETTER_AUTH_URL;
  const child = spawn(
    'pnpm',
    ['--filter', '@template/app', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: root,
      detached: process.platform !== 'win32',
      env: minimalEnvironment(childValues),
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const log = [];
  const collect = (chunk) => {
    log.push(chunk.toString());
    if (log.join('').length > 12000) log.splice(0, log.length - 1);
  };
  child.stdout?.on('data', collect);
  child.stderr?.on('data', collect);
  const exit = new Promise((resolve) =>
    child.once('exit', (code, signal) => resolve({ code, signal })),
  );

  async function stop() {
    if (child.exitCode !== null || child.signalCode !== null) return;
    try {
      if (child.pid && process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error;
    }
    const done = await Promise.race([
      exit.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 8000)),
    ]);
    if (!done) {
      try {
        if (child.pid && process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch {
        // The process may have exited while shutdown was requested.
      }
      await exit;
    }
  }

  return {
    baseURL,
    child,
    stop,
    async ready() {
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        if (child.exitCode !== null) {
          const recent = redactOutput(log.join(''), secretsFor(childValues));
          if (recent) process.stdout.write(recent);
          fail(`Local app exited during startup with code ${child.exitCode}.`);
        }
        try {
          const response = await fetch(baseURL, { signal: AbortSignal.timeout(2000) });
          if (response.ok) return;
        } catch {
          // Wait for the dev server to finish starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      await stop();
      const recent = redactOutput(log.join(''), secretsFor(childValues));
      if (recent) process.stdout.write(recent);
      fail(`Local app did not become ready at ${baseURL}.`);
    },
  };
}

function runInteractiveApp(values) {
  const port = Number(values.AGENT_TEST_APP_PORT);
  const result = spawnSync(
    'pnpm',
    ['--filter', '@template/app', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
    { cwd: root, env: minimalEnvironment(values), stdio: 'inherit' },
  );
  if (result.error || result.status !== 0)
    fail(`Local app exited with code ${result.status ?? 'unknown'}.`);
}

async function prepare({ reset = false } = {}) {
  assertSupportedNode();
  const values = makeValues();
  const postgres = createPostgresManager(values);
  if (reset && !args.includes('--yes')) {
    fail(
      `Reset only affects ${persistentIdentity.database}. Repeat with pnpm agent:reset -- --yes.`,
    );
  }
  await ensureDependencies();
  if (reset) {
    postgres.ensureDatabase(true);
  } else {
    postgres.ensureDatabase(false);
  }
  runPnpm(['--filter', '@template/app', 'auth:migrate'], values);
  runPnpm(['--filter', '@template/app', 'exec', 'tsx', 'scripts/seed-local-agent.ts'], values);
  postgres.assertSchemasReady();
  const appPort = Number(values.AGENT_TEST_APP_PORT);
  const server = startDetachedApp(values, appPort);
  try {
    await server.ready();
    await signUpFixtureUser(server.baseURL, values);
  } finally {
    await server.stop();
  }
  process.stdout.write(
    `Prepared local fixtures for worktree ${worktreeId}. Start the app with pnpm agent:start.\n`,
  );
}

async function runBrowserTests() {
  assertSupportedNode();
  const baseValues = readValues();
  const postgres = createPostgresManager(baseValues);
  const runId = randomBytes(6).toString('hex');
  const identity = testDatabaseIdentity(worktreeId, runId);
  const disposable = postgres.createDisposable(identity, baseValues);
  const port = await findFreePort(52000 + (Number.parseInt(runId.slice(0, 4), 16) % 7000));
  const baseURL = `http://127.0.0.1:${port}`;
  const values = {
    ...disposable.values,
    AGENT_TEST_RUN_ID: runId,
    AGENT_TEST_APP_PORT: String(port),
    AGENT_TEST_BASE_URL: baseURL,
    BETTER_AUTH_URL: baseURL,
  };
  let server;
  try {
    runPnpm(['--filter', '@template/app', 'auth:migrate'], values);
    runPnpm(['--filter', '@template/app', 'exec', 'tsx', 'scripts/seed-local-agent.ts'], values);
    postgres.assertSchemasReady(new URL(values.DATABASE_URL));
    server = startDetachedApp(values, port);
    await server.ready();
    await signUpFixtureUser(baseURL, values);
    runPnpm(['--filter', '@template/app', 'test:e2e'], values);
  } finally {
    if (server) await server.stop();
    postgres.dropDatabase(disposable.database, disposable.role);
    postgres.removeRole(disposable.role, disposable.database);
    process.stdout.write('Disposable browser-test database and role removed.\n');
  }
}

function status() {
  const values = readValues();
  const postgres = createPostgresManager(values);
  postgres.assertLoopbackServer();
  const owner = postgres.databaseOwner();
  if (owner !== values.AGENT_TEST_DB_ROLE)
    fail('Worktree database is missing or has a different owner.');
  process.stdout.write(
    `Worktree: ${worktreeId}\nDatabase: ${values.AGENT_TEST_DB_NAME} (owned by local fixture role)\nApp: ${values.BETTER_AUTH_URL}\n`,
  );
}

function credentials() {
  const values = readValues();
  const postgres = createPostgresManager(values);
  postgres.assertLoopbackServer();
  if (postgres.databaseOwner() !== values.AGENT_TEST_DB_ROLE) {
    fail('Credentials are printed only for this worktree-owned local database.');
  }
  process.stdout.write(
    `Local-only fixtures for worktree ${worktreeId}. Use only with this local app.\n\nSaaS user\n  email: ${values.AGENT_TEST_USER_EMAIL}\n  password: ${values.AGENT_TEST_USER_PASSWORD}\n\nSign-up test user\n  email: ${values.AGENT_TEST_SIGNUP_EMAIL}\n  password: ${values.AGENT_TEST_SIGNUP_PASSWORD}\n\nPayload administrator\n  email: ${values.AGENT_TEST_ADMIN_EMAIL}\n  password: ${values.AGENT_TEST_ADMIN_PASSWORD}\n`,
  );
}

function clean() {
  if (!args.includes('--yes'))
    fail(
      `Cleanup only affects ${persistentIdentity.database}. Repeat with pnpm agent:clean -- --yes.`,
    );
  const values = readValues();
  const postgres = createPostgresManager(values);
  postgres.assertLoopbackServer();
  const owner = postgres.databaseOwner();
  if (owner && owner !== persistentIdentity.role)
    fail('Worktree database owner mismatch. Refusing cleanup.');
  if (owner) postgres.dropDatabase(persistentIdentity.database, persistentIdentity.role);
  postgres.removeRole(persistentIdentity.role, persistentIdentity.database);
  rmSync(envFile);
  process.stdout.write(`Removed only this worktree's local database, role, and credential file.\n`);
}

function help() {
  process.stdout.write(
    'Local agent workflow (loopback PostgreSQL only):\n' +
      '  pnpm agent:prepare              Install dependencies and provision local fixtures\n' +
      '  pnpm agent:start                Start this worktree app\n' +
      '  pnpm agent:status               Check the worktree database owner\n' +
      '  pnpm agent:credentials          Print guarded local fixture credentials\n' +
      '  pnpm agent:reset -- --yes       Reset only this worktree database and fixtures\n' +
      '  pnpm agent:test                 Run browser checks on a disposable database\n' +
      '  pnpm agent:clean -- --yes       Remove only this worktree database and role\n',
  );
}

try {
  if (command === 'help' || command === '--help' || command === '-h') help();
  else if (command === 'prepare') await prepare();
  else if (command === 'start') {
    assertSupportedNode();
    const values = readValues();
    const postgres = createPostgresManager(values);
    postgres.assertLoopbackServer();
    if (postgres.databaseOwner() !== values.AGENT_TEST_DB_ROLE) {
      fail('Worktree database is missing or has a different owner.');
    }
    postgres.checkApplicationConnection();
    if (
      (await findFreePort(Number(values.AGENT_TEST_APP_PORT))) !==
      Number(values.AGENT_TEST_APP_PORT)
    ) {
      fail(`Port ${values.AGENT_TEST_APP_PORT} is not available for this worktree.`);
    }
    runInteractiveApp(values);
  } else if (command === 'status') status();
  else if (command === 'credentials') credentials();
  else if (command === 'reset') await prepare({ reset: true });
  else if (command === 'clean') clean();
  else if (command === 'test') {
    assertSupportedNode();
    if (!existsSync(path.join(root, 'node_modules'))) await ensureDependencies();
    else runPnpm(['--filter', '@template/app', 'exec', 'playwright', 'install', 'chromium']);
    await runBrowserTests();
  } else fail(`Unknown command '${command}'. Run pnpm agent:prepare --help for usage.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`agent-test: ${message}\n`);
  process.exitCode = 1;
}
