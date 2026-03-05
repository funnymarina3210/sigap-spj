import { Submission } from '@/types/submission';
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
  if (lowerStatus.includes('disetujui') || lowerStatus.includes('approve')) {
    return { type: 'approve', label: 'Disetujui' };
  }
  if (lowerStatus.includes('dikembalikan') || lowerStatus.includes('reject')) {
    return { type: 'reject', label: 'Dikembalikan' };
  }
  if (lowerStatus.includes('perbaikan') || lowerStatus.includes('incomplete')) {
    return { type: 'incomplete', label: 'Perlu perbaikan' };
  }
  return { type: 'pending', label: status };
}

export function TrackingTimeline({ submission, className }: TrackingTimelineProps) {
  // Build timeline events from submission data
  const events: TimelineEvent[] = [];

  // Check status flags
  const isIncompleteSm = submission.status === 'incomplete_sm';
  const isIncompletePpk = submission.status === 'incomplete_ppk';
  const isIncompleteBendahara = submission.status === 'incomplete_bendahara';

  // 1. SM Submit (Kolom H - waktuPengajuan)
  if (submission.waktuPengajuan || isIncompleteSm) {
    let statusLabel = 'Pengajuan telah dikirim ke PPK';
    let type: TimelineEvent['type'] = 'submit';

    if (isIncompleteSm) {
      statusLabel = 'Diperlukan perbaikan oleh SM';
      type = 'incomplete';
    }

    events.push({
      id: 'sm-submit',
      actor: 'SM',
      actorLabel: 'Subject Matter (Fungsi)',
      timestamp: submission.waktuPengajuan || undefined,
      status: isIncompleteSm ? 'Perlu perbaikan' : 'Pengajuan dikirim',
      statusLabel,
      type,
    });
  }

  // 2. PPK (Kolom I - statusPpk, Kolom J - waktuPpk)
  if (submission.waktuPpk || submission.statusPpk || isIncompletePpk) {
    const ppkStatus = parseTimelineStatus(submission.statusPpk);
    let statusLabel = submission.statusPpk 
      ? `PPK: ${submission.statusPpk}`
      : 'Menunggu verifikasi PPK';
    let type = ppkStatus.type;

    if (isIncompletePpk) {
      statusLabel = 'Diperlukan perbaikan oleh PPK';
      type = 'incomplete';
    } else if (submission.statusPpk?.toLowerCase().includes('disetujui')) {
      type = 'approve';
    }

    events.push({
      id: 'ppk',
      actor: 'PPK',
      actorLabel: 'Pejabat Pembuat Komitmen',
      timestamp: submission.waktuPpk,
      status: isIncompletePpk ? 'Perlu perbaikan' : submission.statusPpk,
      statusLabel,
      type,
    });
  }

  // 3. Bendahara (Kolom K - statusBendahara, Kolom L - waktuBendahara)
  if (submission.waktuBendahara || submission.statusBendahara || isIncompleteBendahara) {
    const bendaharaStatus = parseTimelineStatus(submission.statusBendahara);
    let statusLabel = submission.statusBendahara 
      ? `Bendahara: ${submission.statusBendahara}`
      : 'Menunggu verifikasi Bendahara';
    let type = bendaharaStatus.type;

    if (isIncompleteBendahara) {
      statusLabel = 'Diperlukan perbaikan oleh Bendahara';
      type = 'incomplete';
    } else if (submission.statusBendahara?.toLowerCase().includes('disetujui')) {
      type = 'approve';
    }

    events.push({
      id: 'bendahara',
      actor: 'Bendahara',
      actorLabel: 'Bendahara Pengeluaran',
      timestamp: submission.waktuBendahara,
      status: isIncompleteBendahara ? 'Perlu perbaikan' : submission.statusBendahara,
      statusLabel,
      type,
    });
  }

  // 4. KPPN (Kolom M - statusKppn)
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

  // Reverse events so newest is on top
  const sortedEvents = [...events].reverse();

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve':
      case 'complete':
        return CheckCircle2;
      case 'reject':
        return XCircle;
      case 'incomplete':
        return Clock;
      case 'submit':
        return Send;
      default:
        return Clock;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve':
      case 'complete':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'reject':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'incomplete':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'submit':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      default:
        return 'text-amber-600 bg-amber-100 border-amber-300';
    }
  };

  const getLineColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve':
      case 'complete':
        return 'bg-green-300';
      case 'reject':
        return 'bg-red-300';
      case 'incomplete':
        return 'bg-orange-300';
      case 'submit':
        return 'bg-blue-300';
      default:
        return 'bg-gray-200';
    }
  };

  const getDotColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'approve':
      case 'complete':
        return 'bg-green-500';
      case 'reject':
        return 'bg-red-500';
      case 'incomplete':
        return 'bg-orange-500';
      case 'submit':
        return 'bg-blue-500';
      default:
        return 'bg-amber-500';
    }
  };

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case 'SM':
        return <User className="w-3 h-3" />;
      case 'PPK':
        return <FileCheck className="w-3 h-3" />;
      case 'PPSPM':
        return <FileCheck className="w-3 h-3" />;
      case 'Bendahara':
        return <FileCheck className="w-3 h-3" />;
      case 'KPPN':
        return <Building2 className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  if (events.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tracking Pengajuan
          </CardTitle>
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tracking Pengajuan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline container */}
        <div className="relative space-y-4">
          {sortedEvents.map((event, index) => {
            const Icon = getEventIcon(event);
            const isLast = index === sortedEvents.length - 1;
            
            return (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline dot and line */}
                <div className="relative flex flex-col items-center">
                  {/* Dot */}
                  <div className={cn(
                    "w-3 h-3 rounded-full z-10",
                    getDotColor(event)
                  )} />
                  
                  {/* Line connecting to next event */}
                  {!isLast && (
                    <div className={cn(
                      "absolute top-3 w-0.5 h-full",
                      getLineColor(event)
                    )} />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 pb-4">
                  {/* Timestamp */}
                  {event.timestamp && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium">
                        {formatTimelineDate(event.timestamp)}
                      </span>
                      <span className="text-muted-foreground/60">
                        {formatTimelineTime(event.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  {/* Status description */}
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    event.type === 'approve' || event.type === 'complete' ? 'text-green-700' :
                    event.type === 'reject' ? 'text-red-700' :
                    event.type === 'incomplete' ? 'text-orange-700' :
                    event.type === 'submit' ? 'text-blue-700' :
                    'text-amber-700'
                  )}>
                    {event.statusLabel}
                  </div>
                  
                  {/* Actor badge */}
                  <div className="flex items-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      getEventColor(event)
                    )}>
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

// Helper functions for date formatting
function formatTimelineDate(dateStr: string): string {
  try {
    // Format: "HH:mm - dd/MM/yyyy"
    const parts = dateStr.split(' - ');
    if (parts.length < 2) return dateStr;
    
    const datePart = parts[1];
    const [day, month, year] = datePart.split('/');
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    
    const fullYear = parseInt(year) < 100 ? 2000 + parseInt(year) : parseInt(year);
    
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${fullYear}`;
  } catch {
    return dateStr;
  }
}

function formatTimelineTime(dateStr: string): string {
  try {
    // Format: "HH:mm - dd/MM/yyyy"
    const parts = dateStr.split(' - ');
    if (parts.length < 2) return '';
    
    return `${parts[0]} WIB`;
  } catch {
    return '';
  }
}
