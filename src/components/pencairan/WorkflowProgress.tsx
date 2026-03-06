import { SubmissionStatus, getStageName, getWorkflowStages, isStageCompleted } from '@/types/pencairan';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface WorkflowProgressProps {
  status: SubmissionStatus;
}

// Mapping stage ke deskripsi lengkap
const STAGE_DESCRIPTIONS: Record<string, string> = {
  'SM': 'Perbaikan / Pengajuan',
  'Bendahara': 'Penelaah Pengajuan',
  'PPK': 'Pejabat Pembuat Komitmen',
  'PPSPM': 'Pejabat Penandatangan SPM',
  'KPPN': 'Kantor Pelayanan Perbendaharaan Negara',
  'Arsip': 'Arsip',
};

export function WorkflowProgress({ status }: WorkflowProgressProps) {
  const stages = getWorkflowStages();

  const getStageColor = (stageName: string, isActive: boolean, isCompleted: boolean): string => {
    if (status.includes('rejected')) {
      if (isActive) return 'bg-red-500';
      return isCompleted ? 'bg-green-500' : 'bg-gray-300';
    }

    if (isActive) {
      return 'bg-green-500';
    }

    return isCompleted ? 'bg-green-500' : 'bg-gray-300';
  };

  const getStageIcon = (stageName: string, isActive: boolean, isCompleted: boolean) => {
    if (status.includes('rejected')) {
      if (isActive) return <XCircle className="w-5 h-5" />;
      return isCompleted ? <CheckCircle2 className="w-5 h-5" /> : null;
    }

    if (isCompleted) return <CheckCircle2 className="w-5 h-5" />;
    if (isActive) return <Clock className="w-5 h-5 animate-pulse" />;
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-6">
        {stages.map((stage, idx) => {
          const isActive = stage === stages.find(s => {
            if (status === 'draft' || status === 'submitted_sm') return s === 'SM';
            if (status === 'pending_bendahara' || status === 'rejected_sm') return s === 'Bendahara';
            if (status === 'pending_ppk' || status === 'rejected_bendahara') return s === 'PPK';
            if (status === 'pending_ppspm' || status === 'rejected_ppk') return s === 'PPSPM';
            if (status === 'pending_kppn' || status === 'rejected_ppspm') return s === 'KPPN';
            if (status === 'pending_arsip' || status === 'rejected_kppn') return s === 'Arsip';
            if (status === 'completed') return s === 'Arsip';
            return false;
          });

          const isCompleted = (
            (stage === 'SM' && !['draft', 'submitted_sm'].includes(status)) ||
            (stage === 'Bendahara' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm'].includes(status)) ||
            (stage === 'PPK' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm', 'pending_ppk', 'rejected_bendahara'].includes(status)) ||
            (stage === 'PPSPM' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm', 'pending_ppk', 'rejected_bendahara', 'pending_ppspm', 'rejected_ppk'].includes(status)) ||
            (stage === 'KPPN' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm', 'pending_ppk', 'rejected_bendahara', 'pending_ppspm', 'rejected_ppk', 'pending_kppn', 'rejected_ppspm'].includes(status)) ||
            (stage === 'Arsip' && status === 'completed')
          );

          const bgColor = getStageColor(stage, isActive, isCompleted);
          const icon = getStageIcon(stage, isActive, isCompleted);

          return (
            <div key={stage} className="flex-1 flex flex-col items-center relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all ${bgColor} shadow-md`}
              >
                {icon || <span className="text-sm">{idx + 1}</span>}
              </div>
              <p className="text-xs font-semibold mt-2 text-center">
                {getStageName(stage)}
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-20">
                {STAGE_DESCRIPTIONS[stage]}
              </p>

              {idx < stages.length - 1 && (
                <div
                  className={`absolute top-6 w-full h-1 transition-colors ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  style={{ left: 'calc(50% + 24px)', width: 'calc(100% - 48px)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
