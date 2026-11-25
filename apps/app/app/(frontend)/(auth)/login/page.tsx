import Link from 'next/link';
import { Button } from '@template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@template/ui/components/card';
import { AuthForm } from '../AuthForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Welcome back
          </p>
          <CardTitle className="text-3xl tracking-tight">Log in</CardTitle>
          <CardDescription>Use your SaaS account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
        </CardContent>
        <CardFooter className="justify-center border-t pt-5 text-sm text-muted-foreground">
          New here?
          <Button asChild variant="link" className="h-auto px-1 py-0">
            <Link href="/sign-up">Create an account</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
