import { useState } from 'react';
import { Submission, SubmissionStatus, UserRole, canTakeAction, PaymentType } from '@/types/pencairan';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from './StatusBadge';
import { WorkflowProgress } from './WorkflowProgress';
import { TrackingTimeline } from './TrackingTimeline';
import { DocumentChecklist } from './DocumentChecklist';

interface SubmissionDetailProps {
  submission: Submission | null;
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
  onApprove?: (notes?: string, paymentType?: PaymentType, spmNumber?: string) => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('LS');
  const [spmNumber, setSpmNumber] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);

  if (!submission) return null;

  const canApprove = canTakeAction(userRole, submission.status);
  const isBendahara = userRole === 'Bendahara' && submission.status === 'pending_bendahara';

  const handleApprove = async () => {
    if (isBendahara && !paymentType) {
      setError('Please select payment type (LS/UP)');
      return;
    }
    if (isBendahara && paymentType === 'LS' && !spmNumber.trim()) {
      setError('SPM number is required for LS payment');
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      await onApprove?.(notes, paymentType, spmNumber);
      setNotes('');
      setSpmNumber('');
      setActiveAction(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      await onReject?.(rejectionReason);
      setRejectionReason('');
      setActiveAction(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{submission.id}</SheetTitle>
              <SheetDescription>{submission.title}</SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status and Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Status</h3>
              <StatusBadge status={submission.status as SubmissionStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pengaju</p>
                <p className="font-medium">{submission.submitterName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">User</p>
                <p className="font-medium">{submission.user || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jenis Belanja</p>
                <p className="font-medium">{submission.jenisBelanja}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sub-Jenis</p>
                <p className="font-medium">{submission.subJenisBelanja || '-'}</p>
              </div>
            </div>

            {submission.pembayaran && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipe Pembayaran</p>
                  <p className="font-medium">{submission.pembayaran === 'LS' ? 'Langsung' : 'Uang Persediaan'}</p>
                </div>
                {submission.nomorSPM && (
                  <div>
                    <p className="text-muted-foreground">No. SPM</p>
                    <p className="font-medium">{submission.nomorSPM}</p>
                  </div>
                )}
              </div>
            )}

            {submission.notes && (
              <div>
                <p className="text-muted-foreground text-sm">Catatan</p>
                <p className="text-sm mt-1">{submission.notes}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="workflow" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="documents">Dokumen</TabsTrigger>
              <TabsTrigger value="timeline">Riwayat</TabsTrigger>
            </TabsList>

            <TabsContent value="workflow" className="space-y-4">
              <div className="py-4 px-3 bg-muted rounded-lg overflow-x-auto">
                <WorkflowProgress status={submission.status as SubmissionStatus} />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {submission.documents && submission.documents.length > 0 ? (
                <DocumentChecklist documents={submission.documents} readOnly={true} />
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada dokumen</p>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <TrackingTimeline submission={submission} />
            </TabsContent>
          </Tabs>

          {/* Action Section */}
          {canApprove && activeAction === null && (
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveAction('approve')}
                className="flex-1 rounded-lg"
              >
                ✓ Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setActiveAction('reject')}
                className="flex-1 rounded-lg"
              >
                ✕ Reject
              </Button>
            </div>
          )}

          {/* Approve Action Form */}
          {activeAction === 'approve' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900">Approve Submission</h4>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Payment Type Selection (Bendahara only) */}
              {isBendahara && (
                <>
                  <div>
                    <Label className="mb-3 block">Tipe Pembayaran *</Label>
                    <RadioGroup value={paymentType} onValueChange={v => setPaymentType(v as PaymentType)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="LS" id="payment-ls" />
                        <Label htmlFor="payment-ls">LS (Langsung Serahkan)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UP" id="payment-up" />
                        <Label htmlFor="payment-up">UP (Uang Persediaan)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* SPM Number input for LS */}
                  {paymentType === 'LS' && (
                    <div>
                      <Label htmlFor="spm-number">Nomor SPM *</Label>
                      <Input
                        id="spm-number"
                        placeholder="e.g., SPM-2024-001"
                        value={spmNumber}
                        onChange={e => setSpmNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </>
              )}

              {/* General Notes */}
              <div>
                <Label htmlFor="approve-notes">Catatan (opsional)</Label>
                <Textarea
                  id="approve-notes"
                  placeholder="Tambahkan catatan approval..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveAction(null);
                    setNotes('');
                    setSpmNumber('');
                    setError(null);
                  }}
                  disabled={isApproving}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-1 rounded-lg"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          )}

          {/* Reject Action Form */}
          {activeAction === 'reject' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900">Reject Submission</h4>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="reject-reason">Alasan Penolakan *</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Jelaskan alasan penolakan..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveAction(null);
                    setRejectionReason('');
                    setError(null);
                  }}
                  disabled={isRejecting}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex-1 rounded-lg"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
