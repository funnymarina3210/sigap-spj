import { Submission, UserRole, STATUS_LABELS } from '@/types/pencairan';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Eye } from 'lucide-react';

interface SubmissionTableProps {
  submissions: Submission[];
  onRowClick: (submission: Submission) => void;
  userRole: UserRole;
}

export function SubmissionTable({ submissions, onRowClick, userRole }: SubmissionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Jenis Belanja</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nomor SPM</TableHead>
            <TableHead>Nomor SPPD</TableHead>
            <TableHead>Waktu Update</TableHead>
            <TableHead className="w-10">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Tidak ada data
              </TableCell>
            </TableRow>
          ) : (
            submissions.map(submission => (
              <TableRow key={submission.id} className="cursor-pointer hover:bg-muted">
                <TableCell className="text-sm">{submission.id}</TableCell>
                <TableCell className="text-sm">{submission.submitterName}</TableCell>
                <TableCell className="text-sm truncate max-w-[200px]">{submission.jenisBelanja}</TableCell>
                <TableCell>
                  <StatusBadge status={submission.status} size="sm" />
                </TableCell>
                <TableCell className="text-sm">{submission.nomorSPM || '-'}</TableCell>
                <TableCell className="text-sm">{submission.nomorSPPD || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {submission.updatedAtString || '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRowClick(submission)}
                    className="w-8 h-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
