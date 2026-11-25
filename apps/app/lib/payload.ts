import 'server-only';

import config from '@payload-config';
import { getPayload } from 'payload';
import type { Example } from '@/payload-types';
import { verifySession } from '@/lib/dal';

/**
 * Payload Local API bypasses collection access rules by default. This function first verifies
 * the Better Auth session, then restricts every query by the immutable ownerId from that session.
 */
export async function getMyExamples(): Promise<Example[]> {
  const { user } = await verifySession();
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'examples',
    where: { ownerId: { equals: user.id } },
    limit: 50,
    overrideAccess: true,
  });
  return result.docs;
}

/** User-facing writes repeat authentication and derive ownership only from the verified session. */
export async function createMyExample(title: string): Promise<void> {
  const { user } = await verifySession();
  const payload = await getPayload({ config });
  await payload.create({
    collection: 'examples',
    data: { title, ownerId: user.id },
    overrideAccess: true,
  });
}
