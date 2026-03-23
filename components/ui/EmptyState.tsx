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
