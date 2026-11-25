import Link from 'next/link';
import { Button } from '@template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@template/ui/components/card';
import { Input } from '@template/ui/components/input';
import { Label } from '@template/ui/components/label';
import { verifySession } from '@/lib/dal';
import { getMyExamples } from '@/lib/payload';
import { addExample } from './actions';
import { SignOutButton } from '@/components/dashboard/sign-out-button';

export default async function DashboardPage() {
  const { user } = await verifySession();
  const examples = await getMyExamples();

  return (
    <main className="min-h-svh bg-muted/40 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Button asChild variant="link" className="h-auto px-0 text-muted-foreground">
              <Link href="/">FIELDNOTES / SaaS starter</Link>
            </Button>
            <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Your workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
          </div>
          <SignOutButton />
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your example records</CardTitle>
            <CardDescription>
              Signed in as {user.email}. Records are fetched through Payload Local API after a
              Better Auth check and scoped to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {examples.map((example) => (
                <li className="px-4 py-3 text-sm" key={example.id}>
                  {example.title}
                </li>
              ))}
              {examples.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">No records yet.</li>
              )}
            </ul>
            <form
              className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end"
              action={addExample}
            >
              <div className="grid w-full gap-2 sm:max-w-sm">
                <Label htmlFor="title">New record title</Label>
                <Input id="title" name="title" maxLength={120} required />
              </div>
              <Button>Add example</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
