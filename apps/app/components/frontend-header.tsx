import Link from 'next/link';
import { getSessionUser } from '@/lib/dal';
import { FrontendNavigation } from '@/components/frontend-navigation';

export async function FrontendHeader() {
  const user = await getSessionUser();

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-6">
      <Link className="shrink-0 text-sm font-semibold tracking-tight" href="/">
        FIELDNOTES <span className="hidden text-muted-foreground sm:inline">/ SaaS starter</span>
      </Link>
      <FrontendNavigation isAuthenticated={Boolean(user)} />
    </header>
  );
}
