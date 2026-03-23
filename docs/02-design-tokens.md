# Task 02 — Design Tokens & Styling System

## Goal

Establish a design token system using CSS custom properties so that no component ever contains hardcoded color values or font names. All Tailwind classes must map to named tokens.

---

## Files to Create / Modify

- `app/globals.css`
- `app/layout.tsx` (font import)

---

## Step-by-Step Tasks

### 1. Define all design tokens in `app/globals.css`

```css
@import "tailwindcss";

/* ──────────────────────────────────────────
   Primitive palette (raw values live here only)
   ────────────────────────────────────────── */
:root {
  /* Brand */
  --color-brand-50:   #eff6ff;
  --color-brand-100:  #dbeafe;
  --color-brand-200:  #bfdbfe;
  --color-brand-500:  #3b82f6;
  --color-brand-600:  #2563eb;
  --color-brand-700:  #1d4ed8;

  /* Neutral */
  --color-neutral-50:  #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Status */
  --color-success-500: #10b981;
  --color-warning-500: #f59e0b;
  --color-error-500:   #ef4444;

  /* ──────────────────────────────────────────
     Semantic tokens (used by components)
     ────────────────────────────────────────── */

  /* Surfaces */
  --background:  #ffffff;
  --surface:     var(--color-neutral-50);
  --surface-alt: var(--color-neutral-100);

  /* Text */
  --foreground:    var(--color-neutral-900);
  --text-primary:  var(--color-neutral-900);
  --text-secondary: var(--color-neutral-500);
  --text-disabled: var(--color-neutral-300);

  /* Borders */
  --border:        var(--color-neutral-200);
  --border-strong: var(--color-neutral-300);

  /* Accent / interactive */
  --accent:       var(--color-brand-500);
  --accent-hover: var(--color-brand-600);
  --accent-light: var(--color-brand-50);

  /* Status */
  --status-read:   var(--color-success-500);
  --status-unread: var(--color-warning-500);
  --status-error:  var(--color-error-500);

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Sizing */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Layout */
  --sidebar-width: 256px;
  --topbar-height: 64px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --background:  var(--color-neutral-900);
    --surface:     var(--color-neutral-800);
    --surface-alt: var(--color-neutral-700);
    --foreground:  var(--color-neutral-50);
    --text-primary:   var(--color-neutral-50);
    --text-secondary: var(--color-neutral-400);
    --text-disabled:  var(--color-neutral-500);
    --border:        var(--color-neutral-700);
    --border-strong: var(--color-neutral-500);
    --accent-light:  var(--color-brand-700);
  }
}

/* ──────────────────────────────────────────
   Tailwind theme mapping
   ────────────────────────────────────────── */
@theme inline {
  --color-background:    var(--background);
  --color-surface:       var(--surface);
  --color-surface-alt:   var(--surface-alt);
  --color-foreground:    var(--foreground);
  --color-text-primary:  var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-disabled: var(--text-disabled);
  --color-border:        var(--border);
  --color-border-strong: var(--border-strong);
  --color-accent:        var(--accent);
  --color-accent-hover:  var(--accent-hover);
  --color-accent-light:  var(--accent-light);
  --color-status-read:   var(--status-read);
  --color-status-unread: var(--status-unread);
  --color-status-error:  var(--status-error);
  --font-sans:           var(--font-sans);
  --font-mono:           var(--font-mono);
  --radius-sm:           var(--radius-sm);
  --radius-md:           var(--radius-md);
  --radius-lg:           var(--radius-lg);
  --radius-xl:           var(--radius-xl);
  --radius-full:         var(--radius-full);
}

/* ──────────────────────────────────────────
   Base styles
   ────────────────────────────────────────── */
body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* Policy DOCX viewer — read-only prose container */
.policy-docx-body {
  font-family: var(--font-sans);
  color: var(--text-primary);
  line-height: 1.7;
  user-select: none;
}

.policy-docx-body h1,
.policy-docx-body h2,
.policy-docx-body h3 {
  color: var(--text-primary);
  font-weight: 600;
}

.policy-docx-body p {
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.policy-docx-body table {
  border-collapse: collapse;
  width: 100%;
}

.policy-docx-body td,
.policy-docx-body th {
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
}
```

### 2. Add Inter font to `app/layout.tsx`

Use Next.js built-in font optimization:

```typescript
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

Update `--font-sans` in `globals.css` to `var(--font-inter), system-ui, sans-serif` so the loaded font is used.

---

## Token Usage Rules (enforce in code review)

| Forbidden | Use instead |
|---|---|
| `text-blue-500` | `text-accent` |
| `bg-gray-100` | `bg-surface` or `bg-surface-alt` |
| `text-gray-500` | `text-text-secondary` |
| `border-gray-200` | `border-border` |
| `text-green-500` | `text-status-read` |
| `text-yellow-500` | `text-status-unread` |
| `rounded-lg` (hardcoded) | `rounded-[var(--radius-lg)]` or define Tailwind alias |
| `font-['Inter']` | `font-sans` (mapped to token) |

---

## Acceptance Criteria

- [ ] `app/globals.css` contains all token definitions under `:root`
- [ ] `@theme inline` block maps every token to a Tailwind color
- [ ] Dark mode variables are defined and tested by toggling OS dark mode
- [ ] No component file contains a raw hex color or font name
- [ ] Inter font loads via `next/font/google` (no FOUC)
