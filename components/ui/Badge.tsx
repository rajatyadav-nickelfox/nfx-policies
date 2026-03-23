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
