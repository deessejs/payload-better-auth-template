import 'server-only';

import { auth } from '@template/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/** Read the Better Auth user for presentation without making an authorization decision. */
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

/** Verify the Better Auth session against its database for every protected operation. */
export async function verifySession() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return { user };
}
