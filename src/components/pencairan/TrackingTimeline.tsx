import { Submission } from '@/types/pencairan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    let arsipStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (submission.status === 'completed') {
      arsipStatus = 'approved';
    } else if (submission.status === 'pending_arsip') {
      arsipStatus = 'pending';
    } else if (submission.status === 'rejected_kppn') {
      arsipStatus = 'rejected'; // KPPN rejected it, so Arsip won't process
    }
    entries.push({
      stage: 'Arsip',
      timestamp: submission.waktuArsip,
      status: arsipStatus,
      notes: submission.statusArsip,
    });
  }

  if (submission.waktuKppn) {
    let kppnStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (submission.status === 'pending_kppn') {
      kppnStatus = 'pending';
    } else if (['pending_arsip', 'completed'].includes(submission.status)) {
      kppnStatus = 'approved';
    } else if (submission.status === 'rejected_kppn') {
      kppnStatus = 'rejected';
    }
    entries.push({
      stage: 'KPPN',
      timestamp: submission.waktuKppn,
      status: kppnStatus,
      notes: submission.status === 'rejected_kppn' ? (submission.statusKppn || 'Ditolak oleh KPPN') : 'Diproses KPPN',
    });
  }

  if (submission.waktuPPSPM) {
    let ppspmStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (submission.status === 'pending_ppspm') {
      ppspmStatus = 'pending';
    } else if (['pending_kppn', 'pending_arsip', 'completed'].includes(submission.status)) {
      ppspmStatus = 'approved';
    } else if (submission.status === 'rejected_ppspm') {
      ppspmStatus = 'rejected';
    }
    entries.push({
      stage: 'PPSPM',
      timestamp: submission.waktuPPSPM,
      status: ppspmStatus,
      notes: submission.status === 'rejected_ppspm' ? (submission.statusPPSPM || 'Ditolak oleh PPSPM') : submission.statusPPSPM,
    });
  }

  if (submission.waktuPpk) {
    let ppkStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (submission.status === 'pending_ppk') {
      ppkStatus = 'pending';
    } else if (['pending_ppspm', 'pending_kppn', 'pending_arsip', 'completed'].includes(submission.status)) {
      ppkStatus = 'approved';
    } else if (submission.status === 'rejected_ppk') {
      ppkStatus = 'rejected';
    }
    entries.push({
      stage: 'PPK',
      timestamp: submission.waktuPpk,
      status: ppkStatus,
      notes: submission.status === 'rejected_ppk' ? (submission.statusPpk || 'Ditolak oleh PPK') : submission.statusPpk,
    });
  }

  if (submission.waktuBendahara) {
    let bendaharaStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (submission.status === 'pending_bendahara') {
      bendaharaStatus = 'pending';
    } else if (['pending_ppk', 'pending_ppspm', 'pending_kppn', 'pending_arsip', 'completed'].includes(submission.status)) {
      bendaharaStatus = 'approved';
    } else if (submission.status === 'rejected_bendahara' || submission.status === 'rejected_sm') {
      bendaharaStatus = 'rejected';
    }
    entries.push({
      stage: 'Bendahara',
      timestamp: submission.waktuBendahara,
      status: bendaharaStatus,
      notes: (submission.status === 'rejected_bendahara' || submission.status === 'rejected_sm') 
        ? (submission.statusBendahara || 'Ditolak oleh Bendahara') 
        : submission.statusBendahara,
    });
  }

  if (submission.waktuPengajuan) {
    const isDraft = submission.status === 'draft';
    entries.push({
      stage: 'SM',
      timestamp: submission.waktuPengajuan,
      status: isDraft ? 'pending' : 'approved',
      notes: isDraft ? 'Masih dalam persiapan SM (Draft)' : 'Pengajuan telah dikirim ke Bendahara',
    });
  }

  const getIcon = (status: string) => {
    if (status === 'approved') return '✅';
    if (status === 'rejected') return '❌';
    return '⏳'; // hourglass for pending
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracking Pengajuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            📋 Tidak ada riwayat pelacakan
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tracking Pengajuan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center pt-1">
                <span className="text-xl">{getIcon(entry.status)}</span>
                {idx < entries.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-300 mt-2" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {/* Date and Stage */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      {entry.timestamp}
                    </span>
                  </div>
                </div>
                
                {/* Stage and Status */}
                 <p className="text-sm font-medium text-gray-800 mb-2">
                   {entry.stage}:{' '}
                   {entry.stage === 'SM' && entry.status === 'pending'
                     ? 'Dalam persiapan'
                     : entry.status === 'approved'
                       ? 'Diserahkan'
                       : entry.status === 'rejected'
                         ? 'Ditolak'
                         : 'Menunggu verifikasi'}
                 </p>
                
                {/* Badge with notes */}
                {entry.notes && (
                  <div className="inline-block">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                      entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {entry.status === 'approved' ? '✓' : entry.status === 'rejected' ? '✗' : '◐'} {entry.notes}
                    </span>
                  </div>
                )}
                {!entry.notes && (
                  <div className="inline-block">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                      entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {entry.status === 'approved' ? '✓' : entry.status === 'rejected' ? '✗' : '◐'} {STAGE_ROLES[entry.stage]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
