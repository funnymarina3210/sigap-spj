import { useState } from 'react';
import { Submission } from '@/types/pencairan';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SPByGroupingProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (spmNumber: string, selectedSubmissionIds: string[]) => Promise<void>;
  submissions: Submission[];
}

export function SPByGrouping({
  open,
  onClose,
  onSubmit,
  submissions,
}: SPByGroupingProps) {
  const [spmNumber, setSpmNumber] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter UP submissions that don't have a SPM yet
  const upSubmissionsWithoutSPM = submissions.filter(
    s => s.pembayaran === 'UP' && !s.nomorSPM
  );

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === upSubmissionsWithoutSPM.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(upSubmissionsWithoutSPM.map(s => s.id)));
    }
  };

  const handleSubmit = async () => {
    if (!spmNumber.trim()) {
      setError('SPM number is required');
      return;
    }

    if (selectedIds.size === 0) {
      setError('Select at least one submission');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(spmNumber, Array.from(selectedIds));
      // Reset form
      setSpmNumber('');
      setSelectedIds(new Set());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grouping');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kelompokkan Uang Persediaan (UP)</DialogTitle>
          <DialogDescription>
            Kelompokkan beberapa pengajuan UP dalam satu Surat Perintah Membayar (SPM)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* SPM Input */}
          <div>
            <Label htmlFor="spm-number">Nomor SPM</Label>
            <Input
              id="spm-number"
              placeholder="e.g., SPM-2024-001"
              value={spmNumber}
              onChange={e => setSpmNumber(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submissions List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Pilih Pengajuan</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedIds.size === upSubmissionsWithoutSPM.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            {upSubmissionsWithoutSPM.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Tidak ada pengajuan UP yang belum dikelompokkan
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                {upSubmissionsWithoutSPM.map(submission => (
                  <div
                    key={submission.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-muted"
                  >
                    <Checkbox
                      id={`up-${submission.id}`}
                      checked={selectedIds.has(submission.id)}
                      onCheckedChange={() => handleToggleSelect(submission.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`up-${submission.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {submission.id}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {submission.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submission.submitterName} • {submission.jenisBelanja}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {selectedIds.size} of {upSubmissionsWithoutSPM.length} selected
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedIds.size === 0}
              className="rounded-lg"
            >
              {isSubmitting ? 'Saving...' : 'Save Grouping'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
