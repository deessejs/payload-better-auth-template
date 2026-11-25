import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@template/ui/globals.css';
import { FrontendHeader } from '@/components/frontend-header';
import { AppProviders } from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'SaaS Starter',
  description: 'A minimal Payload CMS and Better Auth SaaS template.',
};

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
          >
            <FrontendHeader />
            {children}
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
