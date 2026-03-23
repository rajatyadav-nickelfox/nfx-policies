import { LoginButton } from '@/features/auth/components/LoginButton';

export const metadata = { title: 'Sign In — NFX Policies' };

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Access All Policies',
    description: 'Read PDF, Word, and PowerPoint policy documents in one place.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: 'Acknowledge & Track',
    description: 'Confirm you have read each policy and track your compliance status.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Stay Compliant',
    description: 'See at a glance which policies still need your attention.',
  },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: colourful brand panel ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[55%]"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #7c3aed 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }}
        />
        <div
          className="pointer-events-none absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-white">NFX Policies</span>
        </div>

        {/* Hero text */}
        <div className="relative">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-blue-100"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Compliance Portal
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
            Keep your team<br />
            <span style={{ color: '#a5f3fc' }}>policy‑compliant</span>
          </h1>
          <p className="mb-10 max-w-sm text-base leading-relaxed text-blue-100">
            A single place to read, acknowledge, and track all company policy documents — so nothing falls through the cracks.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs leading-relaxed text-blue-200">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative text-xs text-blue-300">
          Secured with Microsoft Entra ID single sign-on
        </p>
      </div>

      {/* ── Right: sign-in form ── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-background px-6 lg:w-[45%]">
        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="animate-fade-in relative w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-base font-bold text-text-primary">NFX Policies</span>
          </div>

          {/* Card */}
          <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-lg">
            <h2 className="mb-1 text-2xl font-bold text-text-primary">Welcome back</h2>
            <p className="mb-8 text-sm text-text-secondary">
              Sign in with your organisation account to continue.
            </p>

            <LoginButton />

            <p className="mt-6 text-center text-xs text-text-secondary">
              By signing in you agree to company policy and data handling guidelines.
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { value: '100%', label: 'Secure SSO' },
              { value: 'Real-time', label: 'Sync' },
              { value: 'Instant', label: 'Access' },
            ].map((s) => (
              <div key={s.label} className="rounded-[var(--radius-lg)] border border-border bg-surface px-3 py-3">
                <p className="text-sm font-bold text-accent">{s.value}</p>
                <p className="text-xs text-text-secondary">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
