import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'primary' | 'warning' | 'success' | 'danger';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-card border-border/50 hover:border-border',
    icon: 'bg-secondary text-secondary-foreground',
    iconGlow: '',
    value: 'text-foreground',
  },
  primary: {
    card: 'bg-card border-primary/10 hover:border-primary/30',
    icon: 'bg-primary/10 text-primary',
    iconGlow: 'shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
    value: 'text-primary',
  },
  warning: {
    card: 'bg-card border-status-pending/10 hover:border-status-pending/30',
    icon: 'bg-status-pending-bg text-status-pending',
    iconGlow: 'shadow-[0_0_20px_hsl(var(--status-pending)/0.2)]',
    value: 'text-status-pending',
  },
  success: {
    card: 'bg-card border-status-complete/10 hover:border-status-complete/30',
    icon: 'bg-status-complete-bg text-status-complete',
    iconGlow: 'shadow-[0_0_20px_hsl(var(--status-complete)/0.2)]',
    value: 'text-status-complete',
  },
  danger: {
    card: 'bg-card border-status-incomplete/10 hover:border-status-incomplete/30',
    icon: 'bg-status-incomplete-bg text-status-incomplete',
    iconGlow: 'shadow-[0_0_20px_hsl(var(--status-incomplete)/0.2)]',
    value: 'text-status-incomplete',
  },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  variant = 'default',
  className 
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div 
      className={cn(
        'group relative rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg overflow-hidden',
        styles.card,
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent" />
      </div>
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn('text-3xl font-bold tracking-tight', styles.value)}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-3 transition-all duration-300 group-hover:scale-105',
          styles.icon,
          styles.iconGlow
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}