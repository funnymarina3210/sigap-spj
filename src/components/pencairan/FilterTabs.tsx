import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, Edit, XCircle, Clock, CheckCircle, Archive, Package } from 'lucide-react';

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
  userRole?: string;
}

const filters: { value: string; label: string; icon: React.ReactNode; activeColor: string; badgeColor: string; roleOnly?: string }[] = [
  { value: 'all', label: 'Total', icon: <FileText className="w-3.5 h-3.5" />, activeColor: 'bg-primary text-primary-foreground', badgeColor: 'bg-orange-500 text-white' },
  { value: 'draft', label: 'Draft', icon: <Edit className="w-3.5 h-3.5" />, activeColor: 'bg-gray-600 text-white', badgeColor: 'bg-orange-500 text-white' },
  { value: 'rejected', label: 'Ditolak', icon: <XCircle className="w-3.5 h-3.5" />, activeColor: 'bg-red-500 text-white', badgeColor: 'bg-red-500 text-white' },
  { value: 'pending_bendahara', label: 'Bendahara', icon: <Clock className="w-3.5 h-3.5" />, activeColor: 'bg-blue-500 text-white', badgeColor: 'bg-blue-500 text-white' },
  { value: 'pending_ppk', label: 'PPK', icon: <Clock className="w-3.5 h-3.5" />, activeColor: 'bg-yellow-500 text-white', badgeColor: 'bg-yellow-500 text-white' },
  { value: 'pending_ppspm', label: 'PPSPM', icon: <Clock className="w-3.5 h-3.5" />, activeColor: 'bg-violet-500 text-white', badgeColor: 'bg-violet-500 text-white' },
  { value: 'pending_kppn', label: 'KPPN', icon: <Send className="w-3.5 h-3.5" />, activeColor: 'bg-teal-500 text-white', badgeColor: 'bg-teal-500 text-white' },
  { value: 'completed', label: 'Arsip', icon: <Archive className="w-3.5 h-3.5" />, activeColor: 'bg-emerald-500 text-white', badgeColor: 'bg-emerald-500 text-white' },
];

// Helper to compute combined "rejected" count
function getFilterCount(value: string, counts: Record<string, number>): number {
  if (value === 'rejected') {
    return (counts['rejected_sm'] || 0) +
      (counts['rejected_bendahara'] || 0) +
      (counts['rejected_ppk'] || 0) +
      (counts['rejected_ppspm'] || 0) +
      (counts['rejected_kppn'] || 0);
  }
  return counts[value] || 0;
}

export function FilterTabs({ activeFilter, onFilterChange, counts, userRole }: FilterTabsProps) {
  const normalizedRole = userRole?.toLowerCase().includes('bendahara') ? 'Bendahara' : userRole || '';

  const visibleFilters = filters.filter(f => {
    if (f.roleOnly && f.roleOnly !== normalizedRole) return false;
    return true;
  });

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {visibleFilters.map((filter) => {
        const count = getFilterCount(filter.value, counts);
        const isActive = activeFilter === filter.value;

        return (
          <Button
            key={filter.value}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'rounded-full text-xs gap-1.5 px-3',
              isActive && filter.activeColor,
              isActive && 'shadow-md'
            )}
          >
            {filter.icon}
            {filter.label}
            <span className={cn(
              'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center',
              isActive
                ? 'bg-white/20 text-inherit'
                : filter.badgeColor
            )}>
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
