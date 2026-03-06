import { SubmissionStatus } from '@/types/pencairan';
import { Button } from '@/components/ui/button';

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}

const filterConfig = [
  { value: 'all', label: 'Total', icon: '📄' },
  { value: 'draft', label: 'Draft SM', icon: '✏️' },
  { value: 'submitted_sm', label: 'Submitted', icon: '📤' },
  { value: 'pending_bendahara', label: 'Bendahara', icon: '⏳' },
  { value: 'pending_ppk', label: 'PPK', icon: '⏳' },
  { value: 'pending_ppspm', label: 'PPSPM', icon: '⏳' },
  { value: 'pending_kppn', label: 'KPPN', icon: '⏳' },
  { value: 'pending_arsip', label: 'Arsip', icon: '📋' },
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'rejected_sm', label: 'Rejected (SM)', icon: '❌' },
  { value: 'rejected_bendahara', label: 'Rejected (Bendahara)', icon: '❌' },
  { value: 'rejected_ppk', label: 'Rejected (PPK)', icon: '❌' },
  { value: 'rejected_ppspm', label: 'Rejected (PPSPM)', icon: '❌' },
  { value: 'rejected_kppn', label: 'Rejected (KPPN)', icon: '❌' },
];

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterConfig.map((filter) => {
        const count = counts[filter.value] || 0;
        const isActive = activeFilter === filter.value;

        return (
          <Button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            variant={isActive ? 'default' : 'outline'}
            className={`rounded-lg flex items-center gap-1 ${
              isActive ? '' : 'text-muted-foreground'
            }`}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              isActive 
                ? 'bg-primary-foreground/20' 
                : 'bg-muted'
            }`}>
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
