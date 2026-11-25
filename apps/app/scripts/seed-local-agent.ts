import { getPayload } from 'payload';
import config from '../payload.config';

const email = process.env.AGENT_TEST_ADMIN_EMAIL;
const password = process.env.AGENT_TEST_ADMIN_PASSWORD;
const worktreeId = process.env.AGENT_TEST_WORKTREE_ID;
const databaseName = process.env.AGENT_TEST_DB_NAME;
const databaseURL = process.env.DATABASE_URL;

if (
  process.env.AGENT_TEST_MODE !== '1' ||
  !email ||
  !password ||
  !worktreeId ||
  !databaseName ||
  !databaseURL
) {
  throw new Error('Local agent test environment is incomplete.');
}

const url = new URL(databaseURL);
const databaseRole = process.env.AGENT_TEST_DB_ROLE;
const expectedRole = `payload_agent_${worktreeId}`;
const expectedTestRole = new RegExp(`^payload_t_${worktreeId}_[a-f0-9]{12}$`);
if (
  !['127.0.0.1', 'localhost', '::1'].includes(url.hostname) ||
  decodeURIComponent(url.pathname.slice(1)) !== databaseName ||
  Number(url.port || 5432) !== Number(process.env.AGENT_TEST_PG_PORT) ||
  decodeURIComponent(url.username) !== databaseRole ||
  (databaseName !== `payload_agent_${worktreeId}` &&
    !new RegExp(`^payload_test_${worktreeId}_[a-f0-9]{12}$`).test(databaseName)) ||
  (databaseRole !== expectedRole && !expectedTestRole.test(databaseRole ?? ''))
) {
  throw new Error('Refusing to seed outside this worktree local test database.');
}

const payload = await getPayload({ config });
try {
  const existing = await payload.find({
    collection: 'admins',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs.length === 0) {
    await payload.create({
      collection: 'admins',
      data: { email, password },
      overrideAccess: true,
    });
  }

  process.stdout.write('Payload administrator fixture is ready.\n');
} finally {
  await payload.destroy();
}
