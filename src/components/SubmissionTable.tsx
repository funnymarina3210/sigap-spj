import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { Submission, UserRole, canViewDetail, canEdit, getRelevantTimestamp } from '@/types/pencairan';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Edit,
  Calendar,
  Filter,
} from 'lucide-react';

interface SubmissionTableProps {
  submissions: Submission[];
  onView: (submission: Submission) => void;
  onEdit: (submission: Submission) => void;
  userRole: UserRole;
}

const MONTHS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '0', label: 'Januari' },
  { value: '1', label: 'Februari' },
  { value: '2', label: 'Maret' },
  { value: '3', label: 'April' },
  { value: '4', label: 'Mei' },
  { value: '5', label: 'Juni' },
  { value: '6', label: 'Juli' },
  { value: '7', label: 'Agustus' },
  { value: '8', label: 'September' },
  { value: '9', label: 'Oktober' },
  { value: '10', label: 'November' },
  { value: '11', label: 'Desember' },
];

const YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [{ value: 'all', label: 'Semua Tahun' }];
  for (let year = currentYear; year >= currentYear - 5; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
})();

const ITEMS_PER_PAGE = 10;

export function SubmissionTable({ submissions, onView, onEdit, userRole }: SubmissionTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Sort by newest first
  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return sortedSubmissions.filter((sub) => {
      const matchesSearch =
        sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.submitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.jenisBelanja.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMonth =
        selectedMonth === 'all' ||
        sub.submittedAt.getMonth() === parseInt(selectedMonth);

      const matchesYear =
        selectedYear === 'all' ||
        sub.submittedAt.getFullYear() === parseInt(selectedYear);

      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [sortedSubmissions, searchQuery, selectedMonth, selectedYear]);

  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubmissions, currentPage]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const showViewButton = (submission: Submission) => {
    return canViewDetail(userRole, submission.status);
  };

  const showEditButton = (submission: Submission) => {
    return canEdit(userRole, submission.status);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-5 bg-card rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari pengajuan, ID, atau pengaju..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className="pl-10 h-10 rounded-xl bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-card"
          />
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select
            value={selectedMonth}
            onValueChange={(value) => {
              setSelectedMonth(value);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-[150px] rounded-xl bg-secondary/50 border-transparent">
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <Select
          value={selectedYear}
          onValueChange={(value) => {
            setSelectedYear(value);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-[130px] rounded-xl bg-secondary/50 border-transparent">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 hover:bg-secondary/30">
              <TableHead className="w-[120px] font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Judul Pengajuan</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Pengaju</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold">Jenis Belanja</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Waktu</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubmissions.length > 0 ? (
              paginatedSubmissions.map((submission) => {
                const relevantTime = getRelevantTimestamp(submission);
                return (
                  <TableRow key={submission.id} className="group hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-mono font-medium text-primary text-xs">
                      {submission.id}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate font-medium" title={submission.title}>
                        {submission.title}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {submission.submitterName}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-medium">
                        {submission.jenisBelanja}{submission.subJenisBelanja ? ` - ${submission.subJenisBelanja}` : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={submission.status} size="sm" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {relevantTime || format(submission.submittedAt, 'HH:mm - dd/MM/yyyy', { locale: localeId })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {showViewButton(submission) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(submission)}
                            title="Lihat Detail"
                            className="rounded-lg hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {showEditButton(submission) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(submission)}
                            title="Edit Pengajuan"
                            className="rounded-lg hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-10 h-10 text-muted-foreground/50" />
                    <p>Tidak ada data pengajuan yang sesuai dengan filter</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredSubmissions.length)}</span> dari <span className="font-medium text-foreground">{filteredSubmissions.length}</span> pengajuan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-9 h-9 p-0 rounded-lg"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
