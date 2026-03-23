import { LoginButton } from '@/features/auth/components/LoginButton';

export const metadata = { title: 'Sign In — NFX Policies' };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-8 shadow-md">
      <h1 className="mb-2 text-2xl font-semibold text-text-primary">Welcome</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Sign in with your organisation account to access company policies.
      </p>
      <LoginButton />
    </div>
  );
}
