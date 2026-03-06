import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  variant?: 'default' | 'warning' | 'success' | 'danger' | 'info';
  trend?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  trend,
}: StatCardProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-blue-50 text-blue-700',
    warning: 'bg-yellow-50 text-yellow-700',
    success: 'bg-green-50 text-green-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-purple-50 text-purple-700',
  };

  const iconBgStyles: Record<string, string> = {
    default: 'bg-blue-100',
    warning: 'bg-yellow-100',
    success: 'bg-green-100',
    danger: 'bg-red-100',
    info: 'bg-purple-100',
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {Icon && (
            <div className={`rounded-lg p-2 ${iconBgStyles[variant]}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            {trend !== undefined && (
              <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend}% from last month
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
