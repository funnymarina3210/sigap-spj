import { 
  Submission, 
  STATUS_LABELS, 
  UserRole, 
  canTakeAction, 
  canReturnFromArsip,
  canEdit,
  getDocumentsByJenisBelanja,
  Document
} from '@/types/pencairan';
import { StatusBadge } from './StatusBadge';
import { WorkflowProgress } from '../WorkflowProgress';
import { DocumentChecklist } from './DocumentChecklist';
import { TrackingTimeline } from './TrackingTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SubmissionDetailProps {
  submission: Submission | null;
  open: boolean;
  onClose: () => void;
  onUpdateSubmission: (id: string, updates: Partial<Submission>) => void;
  userRole: UserRole;
  onRefresh: () => void;
  onEdit?: (submission: Submission) => void;
}

export function SubmissionDetail({
  submission,
  open,
  onClose,
  onUpdateSubmission,
  userRole,
  onRefresh,
  onEdit,
}: SubmissionDetailProps) {
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(true);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(true);
  const [pembayaran, setPembayaran] = useState<'UP' | 'LS' | ''>('');
  const [nomorSPM, setNomorSPM] = useState('');
  const [nomorSPPD, setNomorSPPD] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'approve' | 'reject' | 'return' | null }>({ open: false, action: null });
  const { toast } = useToast();

  useEffect(() => {
    if (submission) {
      const defaultDocs = getDocumentsByJenisBelanja(
        submission.jenisBelanja, 
        submission.subJenisBelanja || ''
      );
      
      if (defaultDocs.length > 0 && submission.documents && submission.documents.length > 0) {
        const checkedTypes = submission.documents
          .filter(d => d.isChecked)
          .map(d => d.type);
        const checkedNames = submission.documents
          .filter(d => d.isChecked)
          .map(d => d.name.toLowerCase());
          
        const mergedDocs = defaultDocs.map(doc => ({
          ...doc,
          isChecked: checkedTypes.includes(doc.type) || 
                     checkedNames.some(name => doc.name.toLowerCase().includes(name.split(' ')[0]))
        }));
        setDocuments(mergedDocs);
      } else if (defaultDocs.length > 0) {
        setDocuments(defaultDocs);
      } else {
        setDocuments(submission.documents || []);
      }
      
      setNotes(submission.notes || '');
      setPembayaran(submission.pembayaran || '');
      setNomorSPM(submission.nomorSPM || '');
      setNomorSPPD(submission.nomorSPPD || '');
    }
  }, [submission]);

  if (!submission) return null;

  const handleDocumentToggle = (index: number) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], isChecked: !newDocs[index].isChecked };
    setDocuments(newDocs);
  };

  const allDocsComplete = documents.every(d => !d.isRequired || d.isChecked);
  const requiredDocs = documents.filter(d => d.isRequired);
  const checkedCount = documents.filter(d => d.isChecked).length;
  const requiredCheckedCount = requiredDocs.filter(d => d.isChecked).length;

  const saveChecklistOnly = async () => {
    setIsUpdating(true);
    try {
      const checkedDocs = documents.filter(d => d.isChecked).map(d => d.name);
      const kelengkapan = checkedDocs.join('|');

      const { data, error } = await supabase.functions.invoke('pencairan-update', {
        body: {
          id: submission.id,
          status: submission.status,
          actor: userRole === 'Bendahara' ? 'bendahara' : 
                 userRole === 'Pejabat Pembuat Komitmen' ? 'ppk' :
                 userRole === 'Pejabat Penandatangan Surat Perintah Membayar' ? 'ppspm' : 'arsip',
          action: 'checklist',
          kelengkapan,
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: 'Berhasil',
          description: 'Checklist kelengkapan dokumen telah disimpan',
        });
        onRefresh();
      } else {
        throw new Error(data?.error || 'Failed to save checklist');
      }
    } catch (err) {
      console.error('Error saving checklist:', err);
      toast({
        title: 'Gagal menyimpan checklist',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateStatusInSheet = async (
    newStatus: string,
    newNotes?: string,
    actor: string = 'ppk',
    action: 'approve' | 'reject' | 'return' | 'save_spby' = 'approve'
  ) => {
    setIsUpdating(true);
    try {
      const checkedDocs = documents.filter(d => d.isChecked).map(d => d.name);
      const kelengkapan = checkedDocs.join('|');

      const { data, error } = await supabase.functions.invoke('pencairan-update', {
        body: {
          id: submission.id,
          status: newStatus,
          catatan: newNotes || notes || undefined,
          actor,
          action,
          kelengkapan,
          pembayaran: actor === 'bendahara' ? pembayaran : undefined,
          nomorSPM: nomorSPM || undefined,
          nomorSPPD: actor === 'arsip' ? nomorSPPD : undefined,
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: 'Status berhasil diperbarui',
          description: `Status pengajuan telah diubah menjadi ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS] || newStatus}`,
        });
        onRefresh();
      } else {
        throw new Error(data?.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: 'Gagal memperbarui status',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const executeApprove = async () => {
    let newStatus: string;
    let actor: string;

    // SM/Submitter: dari draft kirim ke Bendahara (via status submitted_sm)
    if (submission.status === 'draft') {
      newStatus = 'submitted_sm';
      actor = userRole; // simpan role asli pembuat
    } else if (submission.status === 'submitted_sm') {
      // Bendahara memproses dan langsung kirim ke PPK
      if (userRole === 'Bendahara') {
        if (!pembayaran) {
          toast({
            title: 'Validasi gagal',
            description: 'Pilih tipe pembayaran (UP atau LS) terlebih dahulu',
            variant: 'destructive',
          });
          return;
        }
        if (pembayaran === 'LS' && !nomorSPM) {
          toast({
            title: 'Validasi gagal',
            description: 'Nomor SPM wajib diisi untuk pembayaran Langsung (LS)',
            variant: 'destructive',
          });
          return;
        }
        if (pembayaran === 'UP') {
          toast({
            title: 'Langkah salah',
            description: 'Untuk Uang Persediaan (UP), gunakan tombol "Simpan SPBy"',
            variant: 'destructive',
          });
          return;
        }
      }
      newStatus = 'pending_ppk';
      actor = 'bendahara';
    } else if (submission.status === 'pending_bendahara') {
      if (userRole === 'Bendahara') {
        if (!pembayaran) {
          toast({
            title: 'Validasi gagal',
            description: 'Pilih tipe pembayaran (UP atau LS) terlebih dahulu',
            variant: 'destructive',
          });
          return;
        }

        if (pembayaran === 'LS' && !nomorSPM) {
          toast({
            title: 'Validasi gagal',
            description: 'Nomor SPM wajib diisi untuk pembayaran Langsung (LS)',
            variant: 'destructive',
          });
          return;
        }

        if (pembayaran === 'UP') {
          toast({
            title: 'Langkah salah',
            description: 'Untuk Uang Persediaan (UP), gunakan tombol "Simpan SPBy"',
            variant: 'destructive',
          });
          return;
        }
      }

      newStatus = 'pending_ppk';
      actor = 'bendahara';
    } else if (submission.status === 'pending_ppk') {
      newStatus = 'pending_ppspm';
      actor = 'ppk';
    } else if (submission.status === 'pending_ppspm') {
      newStatus = 'pending_kppn';
      actor = 'ppspm';
    } else if (submission.status === 'pending_kppn') {
      if (userRole === 'Arsip' && !nomorSPPD) {
        toast({
          title: 'Validasi gagal',
          description: 'Nomor SPPD wajib diisi',
          variant: 'destructive',
        });
        return;
      }

      if (!notes) {
        toast({
          title: 'Validasi gagal',
          description: 'Catatan wajib diisi',
          variant: 'destructive',
        });
        return;
      }

      newStatus = 'pending_arsip';
      actor = 'kppn';
    } else if (submission.status === 'rejected_bendahara') {
      // SM/Submitter correcting and resubmitting to Bendahara
      newStatus = 'pending_bendahara';
      actor = 'bendahara';
    } else if (submission.status === 'rejected_ppk') {
      // Bendahara correcting rejected PPK feedback and resubmitting to PPK
      newStatus = 'pending_ppk';
      actor = 'bendahara';
    } else if (submission.status === 'rejected_ppspm') {
      // PPK correcting rejected PPSPM feedback and resubmitting to PPSPM
      newStatus = 'pending_ppspm';
      actor = 'ppk';
    } else if (submission.status === 'rejected_kppn') {
      // PPSPM correcting rejected KPPN feedback and resubmitting to KPPN
      newStatus = 'pending_kppn';
      actor = 'ppspm';
    } else {
      return;
    }

    await updateStatusInSheet(newStatus, undefined, actor, 'approve');

    onUpdateSubmission(submission.id, {
      status: newStatus as Submission['status'],
      documents,
      pembayaran: actor === 'bendahara' ? (pembayaran as 'UP' | 'LS') : undefined,
      nomorSPM: actor === 'bendahara' ? nomorSPM : undefined,
    });
    onClose();
  };

  const executeReject = async () => {
    let newStatus: string;
    let actor: 'bendahara' | 'ppk' | 'ppspm' | 'kppn' | 'arsip';

    if (submission.status === 'submitted_sm') {
      newStatus = 'rejected_sm';
      actor = 'bendahara';
    } else if (submission.status === 'pending_bendahara') {
      newStatus = 'rejected_bendahara';
      actor = 'bendahara';
    } else if (submission.status === 'pending_ppk') {
      newStatus = 'rejected_ppk';
      actor = 'ppk';
    } else if (submission.status === 'pending_ppspm') {
      newStatus = 'rejected_ppspm';
      actor = 'ppspm';
    } else if (submission.status === 'pending_kppn') {
      newStatus = 'rejected_kppn';
      actor = 'kppn';
    } else if (submission.status === 'rejected_ppk') {
      // Bendahara menolak kembali ke SM
      newStatus = 'rejected_bendahara';
      actor = 'bendahara';
    } else if (submission.status === 'rejected_ppspm') {
      // PPK menolak kembali ke Bendahara
      newStatus = 'rejected_ppk';
      actor = 'ppk';
    } else if (submission.status === 'rejected_kppn') {
      // PPSPM menolak kembali ke PPK
      newStatus = 'rejected_ppspm';
      actor = 'ppspm';
    } else {
      return;
    }

    await updateStatusInSheet(newStatus, notes, actor, 'reject');

    onUpdateSubmission(submission.id, {
      status: newStatus as Submission['status'],
      documents,
      notes: notes || submission.notes,
    });
    onClose();
  };

  const executeReturnFromArsip = async () => {
    const newStatus = 'pending_ppspm';
    await updateStatusInSheet(newStatus, notes, 'arsip', 'return');

    onUpdateSubmission(submission.id, {
      status: newStatus,
      notes: notes || submission.notes,
    });
    onClose();
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pencairan-update', {
        body: {
          id: submission.id,
          status: submission.status,
          catatan: notes.trim(),
          actor: userRole?.toLowerCase().replace(/\s+/g, '') || 'bendahara',
          action: 'save_note',
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: 'Catatan berhasil disimpan',
          description: 'Catatan telah disimpan ke Google Sheets',
        });
        onRefresh();
      } else {
        throw new Error(data?.error || 'Gagal menyimpan catatan');
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      toast({
        title: 'Gagal menyimpan catatan',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveSPBy = async () => {
    setIsUpdating(true);
    try {
      const checkedDocs = documents.filter(d => d.isChecked).map(d => d.name);
      const kelengkapan = checkedDocs.join('|');

      const { data, error } = await supabase.functions.invoke('pencairan-update', {
        body: {
          id: submission.id,
          status: submission.status,
          actor: 'bendahara',
          action: 'save_spby',
          kelengkapan,
          pembayaran: 'UP',
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: 'SPBy berhasil disimpan',
          description: 'Pengajuan telah disimpan sebagai Uang Persediaan (UP). Lanjutkan ke tab SPBy untuk pengelompokan.',
        });
        onRefresh();
        onClose();
      } else {
        throw new Error(data?.error || 'Failed to save SPBy');
      }
    } catch (err) {
      console.error('Error saving SPBy:', err);
      toast({
        title: 'Gagal menyimpan SPBy',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const canAction = canTakeAction(userRole, submission.status);
  const canReturnArsip = canReturnFromArsip(userRole, submission.status);
  const canEditDraft = Boolean(onEdit) && canEdit(userRole, submission.status, submission.user);

  const handleApprove = () => setConfirmDialog({ open: true, action: 'approve' });
  const handleReject = () => setConfirmDialog({ open: true, action: 'reject' });
  const handleReturnFromArsip = () => setConfirmDialog({ open: true, action: 'return' });

  const handleConfirm = async () => {
    setConfirmDialog({ open: false, action: null });
    switch (confirmDialog.action) {
      case 'approve':
        await executeApprove();
        break;
      case 'reject':
        await executeReject();
        break;
      case 'return':
        await executeReturnFromArsip();
        break;
    }
  };

  const getConfirmMessage = () => {
    switch (confirmDialog.action) {
      case 'approve':
        if (submission.status === 'draft') {
          return 'Kirim pengajuan ini ke Bendahara untuk diproses?';
        }
        if (submission.status === 'submitted_sm') {
          return 'Mulai proses verifikasi sebagai Bendahara?';
        }
        if (submission.status === 'pending_bendahara') {
          return 'Apakah Anda yakin ingin menyetujui dan mengirim ke PPK?';
        }
        if (submission.status === 'pending_ppk') {
          return 'Apakah Anda yakin ingin menyetujui dan mengirim ke PPSPM?';
        }
        if (submission.status === 'pending_ppspm') {
          return 'Apakah Anda yakin ingin menyetujui dan mengirim ke KPPN?';
        }
        if (submission.status === 'pending_kppn') {
          return 'Apakah Anda yakin ingin mencatat dan melanjutkan ke Arsip?';
        }
        return 'Apakah Anda yakin ingin menyetujui pengajuan ini?';
      case 'reject':
        if (submission.status === 'submitted_sm') {
          return 'Tolak dan kembalikan pengajuan ke SM?';
        }
        if (submission.status === 'pending_bendahara') {
          return 'Apakah Anda yakin ingin menolak dan mengembalikan ke SM?';
        }
        if (submission.status === 'pending_ppk') {
          return 'Apakah Anda yakin ingin menolak dan mengembalikan ke Bendahara?';
        }
        if (submission.status === 'pending_ppspm') {
          return 'Apakah Anda yakin ingin menolak dan mengembalikan ke PPK?';
        }
        if (submission.status === 'pending_kppn') {
          return 'Apakah Anda yakin ingin menolak dan mengembalikan ke PPSPM?';
        }
        return 'Apakah Anda yakin ingin menolak pengajuan ini?';
      case 'return':
        return 'Apakah Anda yakin ingin mengembalikan ke PPSPM?';
      default:
        return 'Apakah Anda yakin?';
    }
  };

  const getApproveButtonLabel = () => {
    if (submission.status === 'draft') {
      return 'Kirim ke Bendahara';
    }
    if (submission.status === 'submitted_sm') {
      return 'Mulai Verifikasi';
    }
    if (submission.status === 'pending_bendahara') {
      return 'Setujui dan Kirim ke PPK';
    }
    if (submission.status === 'pending_ppk') {
      return 'Setujui dan Kirim ke PPSPM';
    }
    if (submission.status === 'pending_ppspm') {
      return 'Setujui dan Kirim ke KPPN';
    }
    if (submission.status === 'pending_kppn') {
      return 'Catat dan Selesaikan';
    }
    if (submission.status === 'rejected_bendahara') {
      return 'Kirim Ulang ke Bendahara';
    }
    if (submission.status === 'rejected_ppk') {
      return 'Kirim Ulang ke PPK';
    }
    if (submission.status === 'rejected_ppspm') {
      return 'Kirim Ulang ke PPSPM';
    }
    if (submission.status === 'rejected_kppn') {
      return 'Kirim Ulang ke KPPN';
    }
    return 'Setujui';
  };

  const getRejectButtonLabel = () => {
    if (submission.status === 'submitted_sm') {
      return 'Kembalikan ke SM';
    }
    if (submission.status === 'pending_bendahara') {
      return 'Kembalikan ke SM';
    }
    if (submission.status === 'pending_ppk') {
      return 'Kembalikan ke Bendahara';
    }
    if (submission.status === 'pending_ppspm') {
      return 'Kembalikan ke PPK';
    }
    if (submission.status === 'pending_kppn') {
      return 'Kembalikan ke PPSPM';
    }
    return 'Tolak';
  };

  const showWorkflowNote = () => {
    if (submission.status === 'pending_ppspm') {
      return "Pengajuan sedang diperiksa oleh PPSPM (Pejabat Penandatangan Surat Perintah Membayar)";
    }
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg leading-tight">{submission.title}</SheetTitle>
              <p className="text-sm text-muted-foreground font-mono">{submission.id}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <StatusBadge status={submission.status} />
            {canAction && (
              <div className="text-xs text-muted-foreground">
                📄 {checkedCount}/{documents.length} dokumen • {requiredCheckedCount}/{requiredDocs.length} wajib
              </div>
            )}
          </div>
          {showWorkflowNote() && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
              ⚠️ {showWorkflowNote()}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-4 py-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Progress Pengajuan</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowProgress status={submission.status} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">👤</div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pengaju</p>
                    <p className="font-medium">{submission.submitterName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">📅</div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal Pengajuan</p>
                    <p className="font-medium">
                      {format(submission.submittedAt, 'd MMMM yyyy', { locale: idLocale })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Jenis Belanja</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {submission.jenisBelanja}
                    {submission.subJenisBelanja && ` - ${submission.subJenisBelanja}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Collapsible open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">⏱️ Tracking Pengajuan</CardTitle>
                    <span className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isTrackingOpen && "rotate-180"
                    )}>⬆️</span>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <TrackingTimeline submission={submission} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {userRole === 'Bendahara' && (submission.status === 'pending_bendahara') && (
            <>
              {false && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <p className="font-medium text-amber-900">⚠️ Pengajuan dikembalikan PPK</p>
                    <p className="text-amber-800 text-xs leading-relaxed ml-4">
                      Pengajuan ini ditandai Uang Persediaan (UP) dengan Nomor SPM {submission.nomorSPM}. Untuk melanjutkan: Edit Nomor SPM (jika perlu diperbaiki), Pilih metode pembayaran (LS atau tetap UP), Jika UP: gunakan "Simpan SPBy" untuk grouping, Jika LS: isi SPM baru, lalu "Kirim ke PPK"
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pilih Pembayaran <span className="text-red-500">*</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-input hover:bg-accent">
                    <input
                      type="radio"
                      name="pembayaran"
                      value="LS"
                      checked={pembayaran === 'LS'}
                      onChange={(e) => {
                        setPembayaran('LS' as const);
                        setNomorSPM('');
                      }}
                      className="w-4 h-4"
                    />
                    <span className="flex-1">
                      <span className="font-medium text-sm">Langsung (LS)</span>
                      <p className="text-xs text-muted-foreground">1 Pengajuan = 1 SPM</p>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-input hover:bg-accent">
                    <input
                      type="radio"
                      name="pembayaran"
                      value="UP"
                      checked={pembayaran === 'UP'}
                      onChange={(e) => {
                        setPembayaran('UP' as const);
                        setNomorSPM('');
                      }}
                      className="w-4 h-4"
                    />
                    <span className="flex-1">
                      <span className="font-medium text-sm">Uang Persediaan (UP)</span>
                      <p className="text-xs text-muted-foreground">Beberapa Pengajuan = 1 SPM</p>
                    </span>
                  </label>
                </div>

                {pembayaran === 'LS' && (
                  <div className="space-y-2 pt-2 border-t">
                    <label htmlFor="nomorSPM" className="text-sm font-medium">
                      Nomor SPM <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nomorSPM"
                      type="text"
                      placeholder="Input nomor SPM (contoh: 00043A)"
                      value={nomorSPM}
                      onChange={(e) => setNomorSPM(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Wajib diisi sebelum submit</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </>
          )}

          {(submission.pembayaran || submission.nomorSPM || submission.nomorSPPD) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Identitas Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.pembayaran && (
                  <div>
                    <p className="text-xs text-muted-foreground">Metode Pembayaran</p>
                    <p className="text-sm font-medium">
                      {submission.pembayaran === 'UP' ? 'Uang Persediaan (UP)' : 'Langsung (LS)'}
                    </p>
                  </div>
                )}
                {submission.nomorSPM && (
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor SPM</p>
                    <p className="text-sm font-medium">{submission.nomorSPM}</p>
                  </div>
                )}
                {submission.nomorSPPD && (
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor SPPD</p>
                    <p className="text-sm font-medium">{submission.nomorSPPD}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Collapsible open={isDocumentsOpen} onOpenChange={setIsDocumentsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      📄 Checklist Kelengkapan Dokumen
                      {canAction && !allDocsComplete && requiredDocs.length > 0 && (
                        <span className="text-xs text-destructive">❌ Belum lengkap</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {checkedCount}/{documents.length}
                      </span>
                      <span className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isDocumentsOpen && "rotate-180"
                      )}>⬆️</span>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  <DocumentChecklist 
                    documents={documents} 
                    onToggle={canAction ? handleDocumentToggle : undefined}
                    readOnly={!canAction}
                  />
                  {canAction && (
                    <Button 
                      variant="outline" 
                      className="w-full text-xs"
                      onClick={saveChecklistOnly}
                      disabled={isUpdating}
                      size="sm"
                    >
                      {isUpdating ? '⏳ Memproses...' : '💾 Simpan Checklist'}
                    </Button>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {(submission.notes || canAction || canReturnArsip) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  💬 {userRole === 'Arsip' && (submission.status === 'pending_kppn') ? 'Catatan dan Identitas' : 'Catatan'}
                  {submission.status === 'pending_kppn' && <span className="text-red-500">*</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole === 'Arsip' && (submission.status === 'pending_kppn') && (
                  <div className="space-y-2">
                    <label htmlFor="nomorSPPD" className="text-sm font-medium">
                      Nomor SPPD <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nomorSPPD"
                      type="text"
                      placeholder="Input nomor SPPD (contoh: 00043T)"
                      value={nomorSPPD}
                      onChange={(e) => setNomorSPPD(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Wajib diisi sebelum submit</p>
                  </div>
                )}

                {(canAction || canReturnArsip) ? (
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Catatan {submission.status === 'pending_kppn' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      id="notes"
                      placeholder={submission.status === 'pending_kppn' ? "Catatan wajib diisi..." : "Tambahkan catatan..."}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm resize-none"
                      rows={3}
                    />
                    {submission.status === 'pending_kppn' && !notes && (
                      <p className="text-xs text-red-500">Isi catatan dengan nomor SPPD dan SPM</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    {submission.notes || 'Tidak ada catatan'}
                  </p>
                )}
                {(canAction || canReturnArsip) && notes && (
                  <Button 
                    variant="outline" 
                    className="w-full text-xs"
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                    size="sm"
                  >
                    {isUpdating ? '⏳ Memproses...' : '💾 Simpan Catatan'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {(canAction || canReturnArsip) && (
            submission.status === 'draft' ? (
              <div className="flex gap-3 pt-4">
                {canEditDraft && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onEdit?.(submission);
                      onClose();
                    }}
                    disabled={isUpdating}
                  >
                    ✏️ Edit Pengajuan
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={!allDocsComplete || isUpdating}
                >
                  📤 {getApproveButtonLabel()}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={canReturnArsip ? handleReturnFromArsip : handleReject}
                  disabled={isUpdating}
                >
                  {isUpdating ? '⏳ Memproses...' : (canReturnArsip ? '↩️ Kembalikan ke PPSPM' : `❌ ${getRejectButtonLabel()}`)}
                </Button>
                
                {userRole === 'Bendahara' && pembayaran === 'UP' && (submission.status === 'pending_bendahara') ? (
                  <Button 
                    className="flex-1"
                    onClick={handleSaveSPBy}
                    disabled={isUpdating || !pembayaran}
                  >
                    {isUpdating ? '⏳ Memproses...' : '💾 Simpan SPBy'}
                  </Button>
                ) : (
                  <Button 
                    className="flex-1"
                    onClick={handleApprove}
                    disabled={
                      (canAction && !allDocsComplete) || 
                      isUpdating || 
                      (submission.status === 'pending_kppn' && !notes) ||
                      (userRole === 'Bendahara' && !pembayaran) ||
                      (userRole === 'Bendahara' && pembayaran === 'LS' && !nomorSPM) ||
                      (userRole === 'Arsip' && !nomorSPPD)
                    }
                  >
                    {isUpdating ? '⏳ Memproses...' : `✅ ${getApproveButtonLabel()}`}
                  </Button>
                )}
              </div>
            )
          )}
        </div>
      </SheetContent>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Aksi</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
              {confirmDialog.action === 'approve' ? 'Setujui' : 'Ya, Lanjutkan'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
