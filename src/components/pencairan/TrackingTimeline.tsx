import { Submission } from '@/types/pencairan';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';

interface TrackingTimelineProps {
  submission: Submission;
}

// Stage descriptions for badges
const STAGE_ROLES: Record<string, string> = {
  'SM': 'Subject Matter (Fungsi)',
  'Bendahara': 'Bendahara Pengeluaran',
  'PPK': 'Pejabat Pembuat Komitmen',
  'PPSPM': 'Pejabat Penandatangan SPM',
  'KPPN': 'Kantor Pelayanan Perbendaharaan',
  'Arsip': 'Arsip (Pencatatan)',
};

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
    const isArsipActive = ['pending_arsip', 'completed'].includes(submission.status);
    entries.push({
      stage: 'Arsip',
      timestamp: submission.waktuArsip,
      status: submission.status === 'completed' ? 'approved' : submission.status === 'rejected_kppn' ? 'rejected' : 'pending',
      notes: submission.statusArsip,
    });
  }

  if (submission.waktuKppn) {
    entries.push({
      stage: 'KPPN',
      timestamp: submission.waktuKppn,
      status: ['pending_kppn', 'pending_arsip', 'completed'].includes(submission.status) ? 'approved' : 'rejected',
      notes: 'Diproses KPPN',
    });
  }

  if (submission.waktuPPSPM) {
    entries.push({
      stage: 'PPSPM',
      timestamp: submission.waktuPPSPM,
      status: ['pending_kppn', 'pending_arsip', 'completed'].includes(submission.status) ? 'approved' : 'rejected',
      notes: submission.statusPPSPM,
    });
  }

  if (submission.waktuPpk) {
    entries.push({
      stage: 'PPK',
      timestamp: submission.waktuPpk,
      status: ['pending_ppspm', 'pending_kppn', 'pending_arsip', 'completed'].includes(submission.status) ? 'approved' : 'rejected',
      notes: submission.statusPpk,
    });
  }

  if (submission.waktuBendahara) {
    entries.push({
      stage: 'Bendahara',
      timestamp: submission.waktuBendahara,
      status: ['pending_ppk', 'pending_ppspm', 'pending_kppn', 'pending_arsip', 'completed'].includes(submission.status) ? 'approved' : 'rejected',
      notes: submission.statusBendahara,
    });
  }

  if (submission.waktuPengajuan) {
    entries.push({
      stage: 'SM',
      timestamp: submission.waktuPengajuan,
      status: 'approved',
      notes: `Pengajuan telah dikirim ke Bendahara`,
    });
  }

  const getIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />;
    if (status === 'rejected') return <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />;
    return <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0" />;
  };

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <FileText className="w-4 h-4 mr-2" />
        <p>Tidak ada riwayat pelacakan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <div key={idx} className="flex gap-3 pb-3 border-b last:border-b-0">
          <div className="flex flex-col items-center gap-1 pt-1">
            {getIcon(entry.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">
                {entry.timestamp}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {entry.stage}:
              </span>
              <span className="text-sm text-gray-600">
                {entry.status === 'approved' ? 'Disetujui' : entry.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
              </span>
            </div>
            {entry.notes && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  ✓ {entry.notes || STAGE_ROLES[entry.stage]}
                </span>
              </div>
            )}
            {!entry.notes && (
              <div className="mt-1">
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                  {STAGE_ROLES[entry.stage]}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
