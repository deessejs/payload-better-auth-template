import { sql } from '@payloadcms/db-postgres';
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { ExampleLimitError } from '@/lib/example-limit';

const MAX_EXAMPLES_PER_USER = 10;

type AdvisoryLockTransaction = {
  execute: (statement: ReturnType<typeof sql>) => Promise<unknown>;
};

const enforceOwnerLimit: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || typeof data.ownerId !== 'string') return data;

  const transactionID = await req.transactionID;
  if (transactionID == null) {
    throw new Error('Example creation requires a PostgreSQL transaction.');
  }

  const sessions = (
    req.payload.db as typeof req.payload.db & {
      sessions?: Record<string, { db: AdvisoryLockTransaction }>;
    }
  ).sessions;
  const transaction = sessions?.[String(transactionID)]?.db;
  if (!transaction) {
    throw new Error('Example creation transaction is unavailable.');
  }

  // Serialize creates per owner until Payload commits or rolls back this transaction.
  await transaction.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${data.ownerId}, 0))`,
  );

  const { totalDocs } = await req.payload.count({
    collection: 'examples',
    overrideAccess: true,
    req,
    where: { ownerId: { equals: data.ownerId } },
  });

  if (totalDocs >= MAX_EXAMPLES_PER_USER) throw new ExampleLimitError();
  return data;
};

export const Example: CollectionConfig = {
  slug: 'examples',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'ownerId', 'updatedAt'] },
  access: {
    // The collection is available to trusted Payload admins only over REST/Admin APIs.
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ({ req }) => req.user?.collection === 'admins',
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: { beforeChange: [enforceOwnerLimit] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'ownerId', type: 'text', required: true, index: true },
  ],
};
