import 'server-only';

import { auth } from '@template/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/** Verify the Better Auth session against its database for every protected operation. */
export async function verifySession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');
  return { user: { id: session.user.id, name: session.user.name, email: session.user.email } };
}
