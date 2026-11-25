import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@template/ui/components/card';
import { verifySession } from '@/lib/dal';
import { getMyExamples } from '@/lib/payload';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { CreateExampleForm } from '@/components/dashboard/create-example-form';

export default async function DashboardPage() {
  const { user } = await verifySession();
  const examples = await getMyExamples();

  return (
    <main className="min-h-[calc(100svh-5rem)] bg-muted/40 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
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
            <ul className="divide-y rounded-lg border" aria-label="Your example records">
              {examples.map((example) => (
                <li className="px-4 py-3 text-sm" key={example.id}>
                  {example.title}
                </li>
              ))}
              {examples.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">No records yet.</li>
              )}
            </ul>
            <CreateExampleForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
