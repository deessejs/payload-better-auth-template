import Link from 'next/link';
import { Button } from '@template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@template/ui/components/card';

export default function HomePage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link className="text-sm font-semibold tracking-tight" href="/">
          FIELDNOTES <span className="text-muted-foreground">/ SaaS starter</span>
        </Link>
        <nav className="flex items-center gap-3" aria-label="Main navigation">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-88px)] w-full max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium text-primary">
            A clear foundation for your next product
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Build your product. Start with the essentials.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            A focused SaaS starter with Better Auth for your customers and Payload for your content
            and admin workflows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/admin">Open the CMS</Link>
            </Button>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md border-border/70 shadow-lg shadow-foreground/5">
          <CardHeader>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              The stack
            </p>
            <CardTitle className="text-2xl">A workspace ready for your idea</CardTitle>
            <CardDescription>
              One app, clear boundaries, and a shared design system.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Customer accounts</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign-up, login, and sessions with Better Auth.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Content and admin</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A native Payload panel with independent admin access.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Shared UI</p>
              <p className="mt-1 text-sm text-muted-foreground">
                shadcn/ui primitives and Tailwind CSS v4 tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
