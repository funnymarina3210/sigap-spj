import { Submission, UserRole, STATUS_LABELS, PaymentType, canTakeAction } from '@/types/pencairan';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SubmissionDetailProps {
  submission: Submission | null;
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
  onApprove?: (submission: Submission, notes: string, paymentType?: PaymentType, sppNumber?: string) => Promise<void>;
  onReject?: (submission: Submission, notes: string) => Promise<void>;
}

export function SubmissionDetail({
  submission,
  open,
  onClose,
  userRole,
  onApprove,
  onReject,
}: SubmissionDetailProps) {
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType | ''>('');
  const [sppNumber, setSppNumber] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (!submission) return null;

  const isBendahara = userRole === 'Bendahara';
  const isPPK = userRole === 'Pejabat Pembuat Komitmen';
  const hasActionPermission = canTakeAction(userRole, submission.status);
  const requiresPaymentSelection = isBendahara && submission.status === 'pending_bendahara';

  // Get action button labels based on role and status
  const getApproveLabel = () => {
    if (isBendahara && submission.status === 'pending_bendahara') return 'Kirim ke PPK';
    if (isPPK && submission.status === 'pending_ppk') return 'Kirim ke PPSPM';
    return 'Setujui';
  };

  const getRejectLabel = () => {
    if (isBendahara && submission.status === 'pending_bendahara') return 'Kembalikan ke SM';
    return 'Tolak';
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    
    if (requiresPaymentSelection && !paymentType) {
      alert('Silakan pilih tipe pembayaran');
      return;
    }
    
    if (paymentType === 'LS' && !sppNumber) {
      alert('Silakan masukkan nomor SPP untuk pembayaran LS');
      return;
    }

    setIsApproving(true);
    try {
      await onApprove(submission, notes, paymentType as PaymentType || undefined, sppNumber || undefined);
      setNotes('');
      setPaymentType('');
      setSppNumber('');
      onClose();
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsRejecting(true);
    try {
      await onReject(submission, notes);
      setNotes('');
      onClose();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Pencairan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workflow Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progres Alur Kerja</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowProgress status={submission.status} />
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID Pengajuan</p>
                  <p className="font-medium">{submission.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={submission.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama Pengaju</p>
                  <p className="font-medium">{submission.submitterName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Belanja</p>
                  <p className="font-medium">{submission.jenisBelanja}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sub Jenis</p>
                  <p className="font-medium">{submission.subJenisBelanja || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipe Pembayaran</p>
                  <p className="font-medium">{submission.pembayaran || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor SPM</p>
                  <p className="font-medium">{submission.nomorSPM || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor SPPD</p>
                  <p className="font-medium">{submission.nomorSPPD || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bendahara Payment Selection */}
          {requiresPaymentSelection && hasActionPermission && onApprove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pilih Tipe Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LS" id="payment-ls" />
                    <Label htmlFor="payment-ls" className="font-medium cursor-pointer">
                      LS (Langsung Serahkan)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UP" id="payment-up" />
                    <Label htmlFor="payment-up" className="font-medium cursor-pointer">
                      UP (Uang Persediaan)
                    </Label>
                  </div>
                </RadioGroup>

                {paymentType === 'LS' && (
                  <div className="space-y-2">
                    <Label htmlFor="spp-number" className="text-sm">Nomor SPP</Label>
                    <Input
                      id="spp-number"
                      placeholder="Masukkan nomor SPP"
                      value={sppNumber}
                      onChange={(e) => setSppNumber(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes & Actions - only show when role has permission */}
          {hasActionPermission && (onApprove || onReject) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Tambah catatan untuk pengajuan ini..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  {onApprove && (
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isApproving ? 'Memproses...' : getApproveLabel()}
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      onClick={handleReject}
                      disabled={isRejecting}
                      variant="destructive"
                      className="gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {isRejecting ? 'Memproses...' : getRejectLabel()}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
