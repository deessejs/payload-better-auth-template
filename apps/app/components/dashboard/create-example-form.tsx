'use client';

import { useActionState } from 'react';
import { Button } from '@template/ui/components/button';
import { Input } from '@template/ui/components/input';
import { Label } from '@template/ui/components/label';
import { addExample, type AddExampleState } from '@/actions/dashboard';

const initialState: AddExampleState = { error: null };

export function CreateExampleForm() {
  const [state, formAction, isPending] = useActionState(addExample, initialState);

  return (
    <form
      className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end"
      action={formAction}
    >
      <div className="grid w-full gap-2 sm:max-w-sm">
        <Label htmlFor="title">New record title</Label>
        <Input id="title" name="title" maxLength={120} required />
      </div>
      <Button disabled={isPending}>{isPending ? 'Adding…' : 'Add example'}</Button>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
