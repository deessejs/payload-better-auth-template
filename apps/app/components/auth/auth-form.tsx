'use client';

import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Button } from '@template/ui/components/button';
import { Input } from '@template/ui/components/input';
import { Label } from '@template/ui/components/label';
import { authClient } from '@/lib/auth-client';

type AuthFormValues = {
  name: string;
  email: string;
  password: string;
};

const validateName = (value: string) => (!value.trim() ? 'Enter your name.' : undefined);
const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a valid email address.';
const validatePassword = (value: string) =>
  value.length >= 8 ? undefined : 'Password must be at least 8 characters.';

export function AuthForm({ mode }: { mode: 'login' | 'sign-up' }) {
  const [message, setMessage] = useState('');
  const form = useForm({
    defaultValues: { name: '', email: '', password: '' } as AuthFormValues,
    onSubmit: async ({ value }) => {
      setMessage('');
      const result =
        mode === 'login'
          ? await authClient.signIn.email({
              email: value.email,
              password: value.password,
              callbackURL: '/dashboard',
            })
          : await authClient.signUp.email({
              email: value.email,
              password: value.password,
              name: value.name,
              callbackURL: '/dashboard',
            });

      if (result.error) {
        setMessage(result.error.message ?? 'Authentication failed. Please try again.');
        return;
      }

      window.location.assign('/dashboard');
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {mode === 'sign-up' && (
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => validateName(value),
            onSubmit: ({ value }) => validateName(value),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                name={field.name}
                autoComplete="name"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={!field.state.meta.isValid}
              />
              {!field.state.meta.isValid && (
                <p className="text-sm text-destructive" role="alert">
                  {field.state.meta.errors.join(', ')}
                </p>
              )}
            </div>
          )}
        </form.Field>
      )}
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => validateEmail(value),
          onSubmit: ({ value }) => validateEmail(value),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              name={field.name}
              type="email"
              autoComplete="email"
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={!field.state.meta.isValid}
            />
            {!field.state.meta.isValid && (
              <p className="text-sm text-destructive" role="alert">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => validatePassword(value),
          onSubmit: ({ value }) => validatePassword(value),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Password</Label>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={!field.state.meta.isValid}
            />
            {!field.state.meta.isValid && (
              <p className="text-sm text-destructive" role="alert">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <p className="min-h-5 text-sm text-destructive" role="alert">
        {message}
      </p>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
