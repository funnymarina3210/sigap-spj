import { Submission } from '@/types/pencairan';
import { 
  CheckCircle2, 
  Clock, 
  XCircle,
  Send,
  User,
  FileCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrackingTimelineProps {
  submission: Submission;
  className?: string;
}

interface TimelineEvent {
  id: string;
  actor: string;
  actorLabel: string;
  timestamp?: string;
  status?: string;
  statusLabel?: string;
  type: 'submit' | 'approve' | 'reject' | 'pending' | 'complete' | 'incomplete';
}

function parseTimelineStatus(status?: string): { type: 'approve' | 'reject' | 'pending' | 'incomplete', label: string } {
  if (!status) return { type: 'pending', label: 'Menunggu' };
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('disetujui') || lowerStatus.includes('approve')) return { type: 'approve', label: 'Disetujui' };
  if (lowerStatus.includes('dikembalikan') || lowerStatus.includes('reject')) return { type: 'reject', label: 'Dikembalikan' };
  if (lowerStatus.includes('perbaikan') || lowerStatus.includes('incomplete')) return { type: 'incomplete', label: 'Perlu perbaikan' };
  return { type: 'pending', label: status };
}

export function TrackingTimeline({ submission, className }: TrackingTimelineProps) {
  const events: TimelineEvent[] = [];

  const isRejectedSm = submission.status === 'rejected_sm';
  const isRejectedPpk = submission.status === 'rejected_ppk';
  const isRejectedBendahara = submission.status === 'rejected_bendahara';

  // 1. SM Submit
  if (submission.waktuPengajuan || isRejectedSm) {
    events.push({
      id: 'sm-submit',
      actor: 'SM',
      actorLabel: 'Subject Matter (Fungsi)',
      timestamp: submission.waktuPengajuan || undefined,
      status: isRejectedSm ? 'Perlu perbaikan' : 'Pengajuan dikirim',
      statusLabel: isRejectedSm ? 'Diperlukan perbaikan oleh SM' : 'Pengajuan telah dikirim',
      type: isRejectedSm ? 'incomplete' : 'submit',
    });
  }

  // 2. PPK
  if (submission.waktuPpk || submission.statusPpk || isRejectedPpk) {
    const ppkStatus = parseTimelineStatus(submission.statusPpk);
    events.push({
      id: 'ppk',
      actor: 'PPK',
      actorLabel: 'Pejabat Pembuat Komitmen',
      timestamp: submission.waktuPpk,
      status: isRejectedPpk ? 'Perlu perbaikan' : submission.statusPpk,
      statusLabel: isRejectedPpk ? 'Diperlukan perbaikan oleh PPK' : (submission.statusPpk ? `PPK: ${submission.statusPpk}` : 'Menunggu verifikasi PPK'),
      type: isRejectedPpk ? 'incomplete' : (submission.statusPpk?.toLowerCase().includes('disetujui') ? 'approve' : ppkStatus.type),
    });
  }

  // 3. Bendahara
  if (submission.waktuBendahara || submission.statusBendahara || isRejectedBendahara) {
    const bendaharaStatus = parseTimelineStatus(submission.statusBendahara);
    events.push({
      id: 'bendahara',
      actor: 'Bendahara',
      actorLabel: 'Bendahara Pengeluaran',
      timestamp: submission.waktuBendahara,
      status: isRejectedBendahara ? 'Perlu perbaikan' : submission.statusBendahara,
      statusLabel: isRejectedBendahara ? 'Diperlukan perbaikan oleh Bendahara' : (submission.statusBendahara ? `Bendahara: ${submission.statusBendahara}` : 'Menunggu verifikasi Bendahara'),
      type: isRejectedBendahara ? 'incomplete' : (submission.statusBendahara?.toLowerCase().includes('disetujui') ? 'approve' : bendaharaStatus.type),
    });
  }

  // 4. KPPN
  if (submission.statusKppn) {
    events.push({
      id: 'kppn',
      actor: 'KPPN',
      actorLabel: 'Kantor Pelayanan Perbendaharaan Negara',
      timestamp: undefined,
      status: submission.statusKppn,
      statusLabel: `KPPN: ${submission.statusKppn}`,
      type: 'complete',
    });
  }

  const sortedEvents = [...events].reverse();

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve': case 'complete': return CheckCircle2;
      case 'reject': return XCircle;
      case 'incomplete': return Clock;
      case 'submit': return Send;
      default: return Clock;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve': case 'complete': return 'text-green-600 bg-green-100 border-green-300';
      case 'reject': return 'text-red-600 bg-red-100 border-red-300';
      case 'incomplete': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'submit': return 'text-blue-600 bg-blue-100 border-blue-300';
      default: return 'text-amber-600 bg-amber-100 border-amber-300';
    }
  };

  const getDotColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve': case 'complete': return 'bg-green-500';
      case 'reject': return 'bg-red-500';
      case 'incomplete': return 'bg-orange-500';
      case 'submit': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  const getLineColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve': case 'complete': return 'bg-green-300';
      case 'reject': return 'bg-red-300';
      case 'incomplete': return 'bg-orange-300';
      case 'submit': return 'bg-blue-300';
      default: return 'bg-gray-200';
    }
  };

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case 'SM': return <User className="w-3 h-3" />;
      case 'PPK': case 'PPSPM': case 'Bendahara': return <FileCheck className="w-3 h-3" />;
      case 'KPPN': return <Building2 className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  if (events.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tracking Pengajuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Belum ada riwayat tracking</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Tracking Pengajuan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {sortedEvents.map((event, index) => {
            const Icon = getEventIcon(event);
            const isLast = index === sortedEvents.length - 1;
            return (
              <div key={event.id} className="relative flex items-start gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={cn("w-3 h-3 rounded-full z-10", getDotColor(event))} />
                  {!isLast && <div className={cn("absolute top-3 w-0.5 h-full", getLineColor(event))} />}
                </div>
                <div className="flex-1 pb-4">
                  {event.timestamp && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium">{formatTimelineDate(event.timestamp)}</span>
                      <span className="text-muted-foreground/60">{formatTimelineTime(event.timestamp)}</span>
                    </div>
                  )}
                  <div className={cn("text-sm font-medium mb-2",
                    event.type === 'approve' || event.type === 'complete' ? 'text-green-700' :
                    event.type === 'reject' ? 'text-red-700' :
                    event.type === 'incomplete' ? 'text-orange-700' :
                    event.type === 'submit' ? 'text-blue-700' : 'text-amber-700'
                  )}>{event.statusLabel}</div>
                  <div className="flex items-center">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", getEventColor(event))}>
                      {getActorIcon(event.actor)}
                      {event.actorLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimelineDate(dateStr: string): string {
  try {
    const parts = dateStr.split(' - ');
    if (parts.length < 2) return dateStr;
    const datePart = parts[1];
    const [day, month, year] = datePart.split('/');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const fullYear = parseInt(year) < 100 ? 2000 + parseInt(year) : parseInt(year);
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${fullYear}`;
  } catch { return dateStr; }
}

function formatTimelineTime(dateStr: string): string {
  try {
    const parts = dateStr.split(' - ');
    if (parts.length < 2) return '';
    return `${parts[0]} WIB`;
  } catch { return ''; }
}
