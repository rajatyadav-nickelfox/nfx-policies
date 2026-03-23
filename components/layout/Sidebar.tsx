'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [{ href: '/policies', label: 'Policies' }];

function DocumentsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: 'var(--sidebar-width)' }}
      className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex"
    >
      <div className="flex h-[var(--topbar-height)] items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <span className="text-sm font-bold text-text-primary">NFX Policies</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
              ].join(' ')}
            >
              <DocumentsIcon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
