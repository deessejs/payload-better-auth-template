import Link from 'next/link';
import { AuthForm } from '../AuthForm';

export default function LoginPage() {
  return (
    <main className="auth-card">
      <p className="eyebrow">Welcome back</p>
      <h1>Log in</h1>
      <p className="muted">Use your SaaS account to continue.</p>
      <AuthForm mode="login" />
      <p className="muted">
        New here? <Link href="/sign-up">Create an account</Link>
      </p>
    </main>
  );
}
