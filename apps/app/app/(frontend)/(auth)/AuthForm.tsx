'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@template/ui/components/button';
import { Input } from '@template/ui/components/input';
import { Label } from '@template/ui/components/label';
import { authClient } from '@/lib/auth-client';

export function AuthForm({ mode }: { mode: 'login' | 'sign-up' }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const result =
      mode === 'login'
        ? await authClient.signIn.email({ email, password, callbackURL: '/dashboard' })
        : await authClient.signUp.email({
            email,
            password,
            name: String(form.get('name')),
            callbackURL: '/dashboard',
          });
    setPending(false);
    if (result.error) {
      setMessage(result.error.message ?? 'Authentication failed. Please try again.');
      return;
    }
    window.location.assign('/dashboard');
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      {mode === 'sign-up' && (
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
      </div>
      <p className="min-h-5 text-sm text-destructive" role="alert">
        {message}
      </p>
      <Button className="w-full" disabled={pending}>
        {pending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
      </Button>
    </form>
  );
}
