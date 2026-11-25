'use client';

import { Button } from '@template/ui/components/button';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut();
        window.location.assign('/login');
      }}
    >
      Log out
    </Button>
  );
}
