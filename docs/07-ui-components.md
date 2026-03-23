# Task 07 — Shared UI Components & Layout Shell

## Goal

Build the shared UI primitive components (Button, Badge, Card, Modal, etc.) and the authenticated app shell (AppShell, Sidebar, Topbar). All components must use design tokens exclusively — no hardcoded colors or fonts.

---

## Files to Create

- `components/ui/Button.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Card.tsx`
- `components/ui/Modal.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/LoadingSpinner.tsx`
- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/Topbar.tsx`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/page.tsx`

---

## Component Implementations

### `components/ui/Button.tsx`

```typescript
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent disabled:opacity-50',
  secondary:
    'bg-surface border border-border text-text-primary hover:bg-surface-alt focus-visible:ring-border disabled:opacity-50',
  ghost:
    'text-text-primary hover:bg-surface-alt focus-visible:ring-border disabled:opacity-50',
  danger:
    'bg-status-error text-white hover:opacity-90 focus-visible:ring-status-error disabled:opacity-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {isLoading ? <LoadingDots /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

function LoadingDots() {
  return <span className="animate-pulse">...</span>;
}
```

### `components/ui/Badge.tsx`

```typescript
type BadgeVariant = 'read' | 'unread' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  read: 'bg-accent-light text-status-read border border-status-read/20',
  unread: 'bg-surface-alt text-status-unread border border-status-unread/20',
  neutral: 'bg-surface-alt text-text-secondary border border-border',
};

export function Badge({ variant, label }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
      ].join(' ')}
    >
      {label}
    </span>
  );
}
```

### `components/ui/Card.tsx`

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm',
        'transition-shadow duration-150',
        onClick ? 'cursor-pointer hover:shadow-md' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
```

### `components/ui/LoadingSpinner.tsx`

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={[
        'animate-spin rounded-full border-2 border-border border-t-accent',
        sizeClasses[size],
        className,
      ].join(' ')}
      role="status"
      aria-label="Loading"
    />
  );
}
```

### `components/ui/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-4xl">📄</div>
      <h3 className="mb-1 text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-text-secondary">{description}</p>
      )}
      {action}
    </div>
  );
}
```

### `components/ui/Modal.tsx`

```typescript
'use client';

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-[95vw] h-[90vh]',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        className={[
          'relative z-10 w-full rounded-[var(--radius-xl)] border border-border',
          'bg-background shadow-lg flex flex-col',
          sizeClasses[size],
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1 text-text-secondary hover:bg-surface-alt hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
```

---

## Layout Components

### `components/layout/Topbar.tsx`

```typescript
'use client';

import { signOut } from 'next-auth/react';
import { useSession } from '@/features/auth/hooks/useSession';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  const { user } = useSession();

  return (
    <header
      style={{ height: 'var(--topbar-height)' }}
      className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-6"
    >
      <span className="text-base font-semibold text-text-primary">Company Policies</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
```

### `components/layout/Sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/policies', label: 'Policies' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: 'var(--sidebar-width)' }}
      className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex"
    >
      <div className="flex h-[var(--topbar-height)] items-center border-b border-border px-6">
        <span className="text-sm font-bold text-text-primary tracking-wide uppercase">
          NFX Policies
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
              ].join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

### `components/layout/AppShell.tsx`

```typescript
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### `app/(dashboard)/layout.tsx`

```typescript
import { AppShell } from '@/components/layout/AppShell';
import { SessionGuard } from '@/features/auth/components/SessionGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
```

### `app/(dashboard)/page.tsx`

```typescript
import { redirect } from 'next/navigation';

export default function DashboardRoot() {
  redirect('/policies');
}
```

---

## Acceptance Criteria

- [ ] All UI components render without TypeScript errors
- [ ] No component file contains a hardcoded hex color or font name
- [ ] `Button` renders in all four variants and three sizes
- [ ] `Modal` closes on backdrop click and Escape key
- [ ] `AppShell` renders Sidebar + Topbar with correct layout (full height, scroll in main)
- [ ] Sidebar highlights the active route link
- [ ] Topbar shows the signed-in user's email and a working "Sign out" button
- [ ] Dashboard root (`/`) redirects to `/policies`
