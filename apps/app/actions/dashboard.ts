'use server';

import { revalidatePath } from 'next/cache';
import { createMyExample } from '@/lib/payload';
import { verifySession } from '@/lib/dal';
import { EXAMPLE_LIMIT_MESSAGE, ExampleLimitError } from '@/lib/example-limit';

export type AddExampleState = { error: string | null };

export async function addExample(
  _previousState: AddExampleState,
  formData: FormData,
): Promise<AddExampleState> {
  // Server Actions are public endpoints: authenticate before accepting any submitted data.
  await verifySession();
  const title = String(formData.get('title') ?? '').trim();
  if (!title || title.length > 120) return { error: 'Enter a title of 1 to 120 characters.' };

  try {
    await createMyExample(title);
  } catch (error) {
    if (error instanceof ExampleLimitError) return { error: EXAMPLE_LIMIT_MESSAGE };
    throw error;
  }

  revalidatePath('/dashboard');
  return { error: null };
}
