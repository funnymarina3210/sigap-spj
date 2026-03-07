import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubmissionStatus, STATUS_LABELS } from '@/types/pencairan';

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const filterOptions = [
    { key: 'all', label: 'Semua' },
    { key: 'draft', label: 'Draft' },
    { key: 'submitted_sm', label: 'Sudah Dikirim SM' },
    { key: 'pending_bendahara', label: 'Menunggu Bendahara' },
    { key: 'pending_ppk', label: 'Menunggu PPK' },
    { key: 'pending_ppspm', label: 'Menunggu PPSPM' },
    { key: 'pending_kppn', label: 'Menunggu KPPN' },
    { key: 'pending_arsip', label: 'Menunggu Arsip' },
    { key: 'completed', label: 'Selesai' },
    { key: 'rejected_sm', label: 'Ditolak SM' },
    { key: 'rejected_bendahara', label: 'Ditolak Bendahara' },
    { key: 'rejected_ppk', label: 'Ditolak PPK' },
    { key: 'rejected_ppspm', label: 'Ditolak PPSPM' },
    { key: 'rejected_kppn', label: 'Ditolak KPPN' },
  ];

  return (
    <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full overflow-x-auto">
      <TabsList className="grid grid-cols-5 lg:grid-cols-7 w-full">
        {filterOptions.map(option => (
          <TabsTrigger key={option.key} value={option.key} className="text-xs">
            <span className="truncate">
              {option.label} {counts[option.key] ? `(${counts[option.key]})` : ''}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
