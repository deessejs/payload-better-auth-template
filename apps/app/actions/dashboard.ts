'use server';

import { revalidatePath } from 'next/cache';
import { createMyExample } from '@/lib/payload';
import { verifySession } from '@/lib/dal';

export async function addExample(formData: FormData) {
  // Server Actions are public endpoints: authenticate before accepting any submitted data.
  await verifySession();
  const title = String(formData.get('title') ?? '').trim();
  if (!title || title.length > 120) return;
  await createMyExample(title);
  revalidatePath('/dashboard');
}
