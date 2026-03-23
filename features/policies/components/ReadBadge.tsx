import { Badge } from '@/components/ui/Badge';

interface ReadBadgeProps {
  acknowledged: boolean;
}

export function ReadBadge({ acknowledged }: ReadBadgeProps) {
  return (
    <Badge
      variant={acknowledged ? 'read' : 'unread'}
      label={acknowledged ? 'Read' : 'Unread'}
    />
  );
}
