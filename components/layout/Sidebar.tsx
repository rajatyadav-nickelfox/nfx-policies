'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [{ href: '/policies', label: 'Policies' }];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: 'var(--sidebar-width)' }}
      className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex"
    >
      <div className="flex h-[var(--topbar-height)] items-center border-b border-border px-6">
        <span className="text-sm font-bold uppercase tracking-wide text-text-primary">
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
