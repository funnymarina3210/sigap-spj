import { Submission } from '@/types/pencairan';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface SPByGroupingProps {
  open: boolean;
  onClose: () => void;
  submissions: Submission[];
  onGrouping?: (selectedIds: string[], label: string) => Promise<void>;
}

export function SPByGrouping({ open, onClose, submissions, onGrouping }: SPByGroupingProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upSubmissions = submissions.filter(s => s.pembayaran === 'UP');

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!onGrouping || selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onGrouping(selectedIds, 'UP');
      setSelectedIds([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pengelompokan Pembayaran UP (Uang Persediaan)</DialogTitle>
          <DialogDescription>
            Pilih pengajuan yang ingin dikelompokkan dalam satu SPP untuk pembayaran UP
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {upSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada pengajuan dengan tipe pembayaran UP
            </p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {upSubmissions.map(submission => (
                <Card key={submission.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={submission.id}
                      checked={selectedIds.includes(submission.id)}
                      onCheckedChange={() => handleToggle(submission.id)}
                      className="mt-1"
                    />
                    <Label htmlFor={submission.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{submission.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {submission.submitterName} - {submission.jenisBelanja}
                      </div>
                    </Label>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedIds.length === 0}
            >
              {isSubmitting ? 'Memproses...' : 'Kelompokkan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
