import { AppShell } from '@/components/layout/AppShell';
import { SessionGuard } from '@/features/auth/components/SessionGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
