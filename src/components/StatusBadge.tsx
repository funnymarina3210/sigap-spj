import { SubmissionStatus, STATUS_LABELS } from '@/types/pencairan';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

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
  draft: {
    icon: AlertCircle,
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-700',
    borderClass: 'border-yellow-300',
  },
  submitted_sm: {
    icon: Clock,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
  },
  pending_bendahara: {
    icon: Clock,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
  },
  pending_ppk: {
    icon: Clock,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
  },
  pending_ppspm: {
    icon: Clock,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
  },
  pending_kppn: {
    icon: Clock,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
  },
  pending_arsip: {
    icon: Clock,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
  },
  completed: {
    icon: CheckCircle2,
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
  },
  rejected_sm: {
    icon: XCircle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
  },
  rejected_bendahara: {
    icon: XCircle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
  },
  rejected_ppk: {
    icon: XCircle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
  },
  rejected_ppspm: {
    icon: XCircle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
  },
  rejected_kppn: {
    icon: XCircle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
  },
};

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  // Fallback for unknown/undefined status
  const config = statusConfig[status] || statusConfig.draft;
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
