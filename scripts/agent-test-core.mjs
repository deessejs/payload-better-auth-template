import { createHash } from 'node:crypto';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function worktreeIdentity(root) {
  return createHash('sha256').update(root).digest('hex').slice(0, 12);
}

export function testDatabaseIdentity(worktreeId, runId) {
  if (!/^[a-f0-9]{12}$/.test(worktreeId) || !/^[a-f0-9]{12}$/.test(runId)) {
    throw new Error('Invalid local test database identity.');
  }
  return {
    database: `payload_test_${worktreeId}_${runId}`,
    role: `payload_t_${worktreeId}_${runId}`,
  };
}

export function validateLocalDatabaseURL(rawURL, expected) {
  let url;
  try {
    url = new URL(rawURL);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }
  const database = decodeURIComponent(url.pathname.slice(1));
  const username = decodeURIComponent(url.username);
  const port = Number(url.port || 5432);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Only PostgreSQL URLs are allowed for local agent tests.');
  }
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error('Local agent tests require a loopback PostgreSQL host.');
  }
  if (database !== expected.database || username !== expected.role) {
    throw new Error('Database name or role does not match this local test identity.');
  }
  if (port !== expected.port) {
    throw new Error('PostgreSQL port does not match the local test identity.');
  }
  if (!url.password || url.search || url.hash) {
    throw new Error('Local PostgreSQL URL must have a password and no query or fragment.');
  }
  return url;
}

export function redactOutput(output, secrets) {
  return [...new Set(secrets.filter(Boolean))]
    .sort((left, right) => right.length - left.length)
    .reduce((text, secret) => text.replaceAll(secret, '[redacted]'), output);
}
