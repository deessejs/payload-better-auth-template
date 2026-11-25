'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@template/ui/components/button';
import { ThemeSwitcher } from '@/components/theme-switcher';

export function FrontendHeader() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isSignUp = pathname === '/sign-up';
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-6">
      <Link className="shrink-0 text-sm font-semibold tracking-tight" href="/">
        FIELDNOTES <span className="hidden text-muted-foreground sm:inline">/ SaaS starter</span>
      </Link>
      <nav className="ml-auto flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
        {isDashboard ? (
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard" aria-current="page">
              Dashboard
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild variant={isLogin ? 'default' : 'ghost'} size="sm">
              <Link href="/login" aria-current={isLogin ? 'page' : undefined}>
                Login
              </Link>
            </Button>
            <Button asChild variant={isSignUp || pathname === '/' ? 'default' : 'ghost'} size="sm">
              <Link href="/sign-up" aria-current={isSignUp ? 'page' : undefined}>
                Sign up
              </Link>
            </Button>
          </>
        )}
        <ThemeSwitcher />
      </nav>
    </header>
  );
}
