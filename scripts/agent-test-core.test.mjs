import assert from 'node:assert/strict';
import test from 'node:test';
import {
  redactOutput,
  testDatabaseIdentity,
  validateLocalDatabaseURL,
  worktreeIdentity,
} from './agent-test-core.mjs';

test('worktree and disposable database identities are deterministic and bounded', () => {
  const id = worktreeIdentity('/workspace/template');
  assert.match(id, /^[a-f0-9]{12}$/);
  assert.equal(id, worktreeIdentity('/workspace/template'));
  assert.deepEqual(testDatabaseIdentity(id, '0123456789ab'), {
    database: `payload_test_${id}_0123456789ab`,
    role: `payload_t_${id}_0123456789ab`,
  });
  assert.throws(() => testDatabaseIdentity('remote-database', 'bad'), /identity/);
});

test('database URL validation permits only exact loopback test identities', () => {
  const expected = {
    database: 'payload_agent_0123456789ab',
    role: 'payload_agent_0123456789ab',
    port: 5432,
  };
  assert.equal(
    validateLocalDatabaseURL(
      'postgres://payload_agent_0123456789ab:secret@127.0.0.1:5432/payload_agent_0123456789ab',
      expected,
    ).hostname,
    '127.0.0.1',
  );
  assert.throws(
    () =>
      validateLocalDatabaseURL(
        'postgres://user:secret@db.example.com:5432/payload_agent_0123456789ab',
        expected,
      ),
    /loopback/,
  );
  assert.throws(
    () =>
      validateLocalDatabaseURL(
        'postgres://payload_agent_0123456789ab:secret@127.0.0.1:5432/production',
        expected,
      ),
    /does not match/,
  );
});

test('captured test output redacts longest sensitive values first', () => {
  assert.equal(
    redactOutput('url=postgres://user:secret/db password=secret', [
      'secret',
      'postgres://user:secret/db',
    ]),
    'url=[redacted] password=[redacted]',
  );
});
