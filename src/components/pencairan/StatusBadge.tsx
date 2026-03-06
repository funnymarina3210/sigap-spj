import { SubmissionStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/pencairan';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: SubmissionStatus;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const label = STATUS_LABELS[status];
  const color = STATUS_COLORS[status];

  const getIcon = () => {
    if (status === 'draft') return <FileEdit className="w-3 h-3" />;
    if (status === 'completed') return <CheckCircle2 className="w-3 h-3" />;
    if (status.startsWith('rejected')) return <XCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const colorMap: Record<string, string> = {
    'gray': 'bg-gray-100 text-gray-800',
    'blue': 'bg-blue-100 text-blue-800',
    'purple': 'bg-purple-100 text-purple-800',
    'orange': 'bg-orange-100 text-orange-800',
    'pink': 'bg-pink-100 text-pink-800',
    'indigo': 'bg-indigo-100 text-indigo-800',
    'cyan': 'bg-cyan-100 text-cyan-800',
    'green': 'bg-green-100 text-green-800',
    'red': 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={`${colorMap[color] || colorMap['gray']} flex items-center gap-1`}>
      {showIcon && getIcon()}
      <span>{label}</span>
    </Badge>
  );
}
