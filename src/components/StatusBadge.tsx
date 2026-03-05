import { SubmissionStatus, STATUS_LABELS } from '@/types/submission';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, Send, ArrowLeft } from 'lucide-react';

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<SubmissionStatus, { 
  icon: React.ElementType; 
  bgClass: string; 
  textClass: string;
  borderClass: string;
}> = {
  pending_ppk: {
    icon: Clock,
    bgClass: 'bg-status-pending-bg',
    textClass: 'text-status-pending',
    borderClass: 'border-status-pending/30',
  },
  incomplete_sm: {
    icon: ArrowLeft,
    bgClass: 'bg-status-incomplete-bg',
    textClass: 'text-status-incomplete',
    borderClass: 'border-status-incomplete/30',
  },
  pending_bendahara: {
    icon: Clock,
    bgClass: 'bg-status-sent-bg',
    textClass: 'text-status-sent',
    borderClass: 'border-status-sent/30',
  },
  incomplete_ppk: {
    icon: XCircle,
    bgClass: 'bg-status-incomplete-bg',
    textClass: 'text-status-incomplete',
    borderClass: 'border-status-incomplete/30',
  },
  incomplete_bendahara: {
    icon: XCircle,
    bgClass: 'bg-status-incomplete-bg',
    textClass: 'text-status-incomplete',
    borderClass: 'border-status-incomplete/30',
  },
  sent_kppn: {
    icon: CheckCircle2,
    bgClass: 'bg-status-complete-bg',
    textClass: 'text-status-complete',
    borderClass: 'border-status-complete/30',
  },
};

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  // Fallback for unknown/undefined status
  const config = statusConfig[status] || statusConfig.pending_ppk;
  const Icon = config.icon;
  const label = STATUS_LABELS[status] || status || 'Tidak Diketahui';

  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeClasses[size],
        config.bgClass,
        config.textClass,
        config.borderClass,
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </span>
  );
}
