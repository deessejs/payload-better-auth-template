'use client';

import { authClient } from '../../../lib/auth-client';

export function SignOutButton() {
  return (
    <button
      className="button secondary"
      onClick={async () => {
        await authClient.signOut();
        window.location.assign('/login');
      }}
    >
      Log out
    </button>
  );
}
