import { useState, useMemo } from 'react';
import { Submission, SubmissionStatus } from '@/types/pencairan';
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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface SubmissionTableProps {
  submissions: Submission[];
  onRowClick?: (submission: Submission) => void;
  itemsPerPage?: number;
}

export function SubmissionTable({
  submissions,
  onRowClick,
  itemsPerPage = 10,
}: SubmissionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const searchLower = searchTerm.toLowerCase();
      return (
        sub.id.toLowerCase().includes(searchLower) ||
        sub.title.toLowerCase().includes(searchLower) ||
        sub.submitterName.toLowerCase().includes(searchLower) ||
        sub.jenisBelanja.toLowerCase().includes(searchLower) ||
        (sub.user && sub.user.toLowerCase().includes(searchLower))
      );
    });
  }, [submissions, searchTerm]);

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari ID, judul, pengaju, jenis, atau user..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {paginatedSubmissions.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Tidak ada data yang sesuai</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead className="w-32">Pengaju</TableHead>
                <TableHead className="w-32">Jenis</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32">Update Terakhir</TableHead>
                {/* <TableHead className="w-20">SPM/SPPD</TableHead> */}
                <TableHead className="w-20 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSubmissions.map(submission => (
                <TableRow
                  key={submission.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(submission)}
                >
                  <TableCell className="font-mono text-sm font-bold">
                    {submission.id}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {submission.title}
                  </TableCell>
                  <TableCell className="text-xs">
                    {submission.submitterName}
                  </TableCell>
                  <TableCell className="text-xs">
                    {submission.jenisBelanja}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={submission.status as SubmissionStatus}
                      showIcon={true}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {submission.waktuPengajuan || '-'}
                  </TableCell>
                  {/* <TableCell className="text-xs">
                    {submission.nomorSPM || submission.nomorSPPD || '-'}
                  </TableCell> */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        onRowClick?.(submission);
                      }}
                      className="rounded-lg"
                    >
                      Detail →
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredSubmissions.length} items)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
