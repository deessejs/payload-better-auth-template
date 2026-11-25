'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@template/ui/components/button';

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <Button
      aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Toggle color theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      size="sm"
      variant="outline"
    >
      {mounted ? (isDark ? 'Light mode' : 'Dark mode') : 'Theme'}
    </Button>
  );
}
