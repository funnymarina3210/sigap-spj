import { 
  Submission, 
  STATUS_LABELS, 
  UserRole, 
  canTakeAction, 
  canReturnFromKppn,
  getDocumentsByJenisBelanja
} from '@/types/submission';
import { StatusBadge } from './StatusBadge';
import { WorkflowProgress } from './WorkflowProgress';
import { DocumentChecklist } from './DocumentChecklist';
import { TrackingTimeline } from './TrackingTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  FileText, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle,
  Send,
  ArrowLeft,
  MessageSquare,
  Loader2,
  AlertCircle,
  ChevronDown,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
}

export function SubmissionDetail({ 
  submission, 
  open, 
  onClose,
  onUpdateSubmission,
  userRole,
  onRefresh
}: SubmissionDetailProps) {
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState(submission?.documents || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(true);
  const [docsOpen, setDocsOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (submission) {
      setDocuments(submission.documents);
      setNotes(submission.notes || '');
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

  const updateStatusInSheet = async (
    newStatus: string, 
    newNotes?: string, 
    actor: 'ppk' | 'bendahara' | 'kppn' = 'ppk',
    action: 'approve' | 'reject' | 'return' = 'approve'
  ) => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-status', {
        body: {
          id: submission.id,
          status: newStatus,
          notes: newNotes || notes || undefined,
          actor,
          action,
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

  const handleApprove = async () => {
    let newStatus: string;
    let actor: 'ppk' | 'bendahara' | 'kppn';
    
    if (submission.status === 'pending_ppk' || submission.status === 'incomplete_ppk') {
      newStatus = 'pending_bendahara';
      actor = 'ppk';
    } else if (submission.status === 'pending_bendahara' || submission.status === 'incomplete_bendahara') {
      newStatus = 'sent_kppn';
      actor = 'bendahara';
    } else {
      return;
    }

    await updateStatusInSheet(newStatus, undefined, actor, 'approve');
    
    onUpdateSubmission(submission.id, {
      status: newStatus as Submission['status'],
      documents,
      ...(submission.status === 'pending_ppk' && { ppkCheckedAt: new Date() }),
      ...(submission.status === 'pending_bendahara' && { 
        bendaharaCheckedAt: new Date(),
        sentToKppnAt: newStatus === 'sent_kppn' ? new Date() : undefined
      }),
    });
    onClose();
  };

  const handleReject = async () => {
    let newStatus: string;
    let actor: 'ppk' | 'bendahara' | 'kppn';
    
    if (submission.status === 'pending_ppk' || submission.status === 'incomplete_ppk') {
      newStatus = 'incomplete_sm';
      actor = 'ppk';
    } else if (submission.status === 'pending_bendahara' || submission.status === 'incomplete_bendahara') {
      newStatus = 'incomplete_ppk';
      actor = 'bendahara';
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

  const handleReturnToBendahara = async () => {
    const newStatus = 'incomplete_bendahara';
    await updateStatusInSheet(newStatus, notes, 'kppn', 'return');

    onUpdateSubmission(submission.id, {
      status: newStatus,
      notes: notes || submission.notes,
    });
    onClose();
  };

  const canAction = canTakeAction(userRole, submission.status);
  const canReturn = canReturnFromKppn(userRole, submission.status);
  const isReadOnly = userRole === 'user';

  const getApproveButtonLabel = () => {
    if (submission.status === 'pending_ppk' || submission.status === 'incomplete_ppk') {
      return 'Kirim ke Bendahara';
    }
    return 'Kirim ke KPPN';
  };

  const getRejectButtonLabel = () => {
    if (submission.status === 'pending_ppk' || submission.status === 'incomplete_ppk') {
      return 'Kembalikan ke SM';
    }
    return 'Kembalikan ke PPK';
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left text-lg">{submission.title}</SheetTitle>
                <SheetDescription className="text-left font-mono">{submission.id}</SheetDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={submission.status} />
            {canAction && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" />
                <span>{checkedCount}/{documents.length} dokumen</span>
                <span>• {requiredCheckedCount}/{requiredDocs.length} wajib</span>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* 1. Progress Pengajuan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progress Pengajuan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowProgress status={submission.status} />
            </CardContent>
          </Card>

          {/* 2. Pengaju Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Pengaju
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nama Pengaju</p>
                  <p className="text-sm font-medium">{submission.submitterName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Tanggal Pengajuan
                  </p>
                  <p className="text-sm font-medium">
                    {format(submission.submittedAt, 'd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Jenis Belanja</p>
                  <span className="inline-block px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">
                    {submission.jenisBelanja}
                    {submission.subJenisBelanja && ` - ${submission.subJenisBelanja}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Tracking Pengajuan (Collapsible) */}
          <Collapsible open={trackingOpen} onOpenChange={setTrackingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Tracking Pengajuan
                    </CardTitle>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      trackingOpen && "rotate-180"
                    )} />
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

          {/* 4. Checklist Kelengkapan Dokumen (Collapsible) */}
          <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Checklist Kelengkapan Dokumen
                      </CardTitle>
                      {canAction && !allDocsComplete && requiredDocs.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-md">
                          <AlertCircle className="w-3 h-3" />
                          Belum lengkap
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {checkedCount}/{documents.length}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        docsOpen && "rotate-180"
                      )} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <DocumentChecklist 
                    documents={documents}
                    onToggle={canAction ? handleDocumentToggle : undefined}
                    readonly={!canAction}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* 5. Catatan */}
          {(submission.notes || canAction || canReturn) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Catatan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {(canAction || canReturn) ? (
                  <Textarea
                    placeholder="Tambahkan catatan jika dokumen tidak lengkap..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    {submission.notes || 'Tidak ada catatan'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions for PPK/Bendahara */}
          {canAction && (
            <div className="flex gap-3 pt-4">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleReject}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {getRejectButtonLabel()}
              </Button>
              <Button 
                className="flex-1 gradient-primary"
                onClick={handleApprove}
                disabled={!allDocsComplete || isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : submission.status === 'pending_ppk' || submission.status === 'incomplete_ppk' ? (
                  <Send className="w-4 h-4 mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {getApproveButtonLabel()}
              </Button>
            </div>
          )}

          {/* Action for PPK to return from KPPN */}
          {canReturn && (
            <div className="flex gap-3 pt-4">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleReturnToBendahara}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowLeft className="w-4 h-4 mr-2" />
                )}
                Kembalikan ke Bendahara
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
