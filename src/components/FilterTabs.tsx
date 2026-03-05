import { SubmissionStatus } from '@/types/submission';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FilterTabsProps {
  activeFilter: SubmissionStatus | 'all';
  onFilterChange: (filter: SubmissionStatus | 'all') => void;
  counts: Record<SubmissionStatus | 'all', number>;
}

const filters: { value: SubmissionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending_ppk', label: 'Menunggu PPK' },
  { value: 'pending_bendahara', label: 'Menunggu Bendahara' },
  { value: 'incomplete_sm', label: 'Dikembalikan SM' },
  { value: 'incomplete_ppk', label: 'Dikembalikan PPK' },
  { value: 'sent_kppn', label: 'Kirim KPPN' },
];

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  return (
    <div className="flex justify-center w-full">
      <Tabs value={activeFilter} onValueChange={(v) => onFilterChange(v as SubmissionStatus | 'all')}>
        <TabsList className="bg-secondary/50 p-1.5 h-auto flex-wrap rounded-xl border border-border/30">
          {filters.map((filter) => (
            <TabsTrigger 
              key={filter.value}
              value={filter.value}
              className={cn(
                'data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border-border/50',
                'px-3.5 py-2 text-sm rounded-lg transition-all duration-200',
                'data-[state=active]:text-foreground'
              )}
            >
              {filter.label}
              <span className={cn(
                'ml-2 px-2 py-0.5 rounded-md text-xs font-semibold transition-all duration-200',
                activeFilter === filter.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/80 text-muted-foreground'
              )}>
                {counts[filter.value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
