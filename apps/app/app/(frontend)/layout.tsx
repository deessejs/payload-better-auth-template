import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@template/ui/globals.css';

export const metadata: Metadata = {
  title: 'SaaS Starter',
  description: 'A minimal Payload CMS and Better Auth SaaS template.',
};

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
