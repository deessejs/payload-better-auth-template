'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@template/ui/components/button';
import { ThemeSwitcher } from '@/components/theme-switcher';

export function FrontendNavigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isSignUp = pathname === '/sign-up';
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <nav className="ml-auto flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
      {isAuthenticated ? (
        <Button asChild variant={isDashboard ? 'default' : 'ghost'} size="sm">
          <Link href="/dashboard" aria-current={isDashboard ? 'page' : undefined}>
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
  );
}
