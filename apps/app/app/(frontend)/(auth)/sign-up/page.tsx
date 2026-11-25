import Link from 'next/link';
import { AuthForm } from '../AuthForm';

export default function SignUpPage() {
  return (
    <main className="auth-card">
      <p className="eyebrow">Get started</p>
      <h1>Create your account</h1>
      <p className="muted">Your customer account is separate from Payload admin accounts.</p>
      <AuthForm mode="sign-up" />
      <p className="muted">
        Already registered? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
