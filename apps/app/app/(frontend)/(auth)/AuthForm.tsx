'use client';

import { useState, type FormEvent } from 'react';
import { authClient } from '../../../lib/auth-client';

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
    <form className="form" onSubmit={submit}>
      {mode === 'sign-up' && (
        <label>
          Name
          <input name="name" autoComplete="name" required />
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
      </label>
      <p className="form-message" role="alert">
        {message}
      </p>
      <button className="button" disabled={pending}>
        {pending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
      </button>
    </form>
  );
}
