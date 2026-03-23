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
        'transition-all duration-150',
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
