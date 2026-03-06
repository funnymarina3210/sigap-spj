import { Submission } from '@/types/pencairan';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface TrackingTimelineProps {
  submission: Submission;
}

export function TrackingTimeline({ submission }: TrackingTimelineProps) {
  // Build timeline entries in reverse chronological order
  const entries: Array<{
    stage: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
  }> = [];

  // Latest first
  if (submission.waktuArsip) {
    entries.push({
      stage: 'Arsip',
      timestamp: submission.waktuArsip,
      status: submission.status === 'completed' ? 'approved' : 'rejected',
      notes: submission.statusArsip,
    });
  }

  if (submission.waktuKppn) {
    entries.push({
      stage: 'KPPN',
      timestamp: submission.waktuKppn,
      status: submission.status.includes('kppn') ? 'pending' : submission.status === 'pending_arsip' ? 'approved' : 'rejected',
      notes: submission.statusBendahara,
    });
  }

  if (submission.waktuPPSPM) {
    entries.push({
      stage: 'PPSPM',
      timestamp: submission.waktuPPSPM,
      status: submission.status === 'pending_kppn' ? 'approved' : submission.status === 'pending_ppspm' ? 'pending' : 'rejected',
      notes: submission.statusPPSPM,
    });
  }

  if (submission.waktuPPK) {
    entries.push({
      stage: 'PPK',
      timestamp: submission.waktuPPK,
      status: submission.status === 'pending_ppspm' ? 'approved' : submission.status === 'pending_ppk' ? 'pending' : 'rejected',
      notes: submission.statusPPK,
    });
  }

  if (submission.waktuBendahara) {
    entries.push({
      stage: 'Bendahara',
      timestamp: submission.waktuBendahara,
      status: submission.status === 'pending_ppk' ? 'approved' : submission.status === 'pending_bendahara' ? 'pending' : 'rejected',
      notes: submission.statusBendahara,
    });
  }

  if (submission.waktuPengajuan) {
    entries.push({
      stage: 'SM',
      timestamp: submission.waktuPengajuan,
      status: 'approved',
      notes: 'Submitted by ' + (submission.user || 'User'),
    });
  }

  const getIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <p>Tidak ada riwayat pelacakan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, idx) => (
        <div key={idx} className="flex gap-4">
          <div className="flex flex-col items-center">
            {getIcon(entry.status)}
            {idx < entries.length - 1 && (
              <div className="w-0.5 h-12 bg-gray-300 mt-2" />
            )}
          </div>
          <div className="pb-4 flex-1">
            <div className="flex items-baseline justify-between">
              <h4 className="font-medium">{entry.stage}</h4>
              <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
            </div>
            {entry.notes && (
              <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
