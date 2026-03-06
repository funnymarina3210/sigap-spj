import { SubmissionStatus, getStageName, getWorkflowStages, isStageCompleted } from '@/types/pencairan';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface WorkflowProgressProps {
  status: SubmissionStatus;
}

export function WorkflowProgress({ status }: WorkflowProgressProps) {
  const stages = getWorkflowStages();

  const getStageColor = (stageName: string, isActive: boolean, isCompleted: boolean): string => {
    if (status.includes('rejected')) {
      if (isActive) return 'bg-red-500';
      return isCompleted ? 'bg-green-500' : 'bg-gray-300';
    }

    if (isActive) {
      return 'bg-blue-500';
    }

    return isCompleted ? 'bg-green-500' : 'bg-gray-300';
  };

  const getStageIcon = (stageName: string, isActive: boolean, isCompleted: boolean) => {
    if (status.includes('rejected')) {
      if (isActive) return <XCircle className="w-5 h-5" />;
      return isCompleted ? <CheckCircle2 className="w-5 h-5" /> : null;
    }

    if (isActive) return <Clock className="w-5 h-5 animate-spin" />;
    return isCompleted ? <CheckCircle2 className="w-5 h-5" /> : null;
  };

  return (
    <div className="flex items-center justify-between">
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

        const isCompleted = stage !== 'Arsip' && 
          !(status === 'draft' || status === 'submitted_sm') &&
          (stage === 'SM' || 
           (stage === 'Bendahara' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm'].includes(status)) ||
           (stage === 'PPK' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm', 'pending_ppk', 'rejected_bendahara'].includes(status)) ||
           (stage === 'PPSPM' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm', 'pending_ppk', 'rejected_bendahara', 'pending_ppspm', 'rejected_ppk'].includes(status)) ||
           (stage === 'KPPN' && !['draft', 'submitted_sm', 'pending_bendahara', 'rejected_sm', 'pending_ppk', 'rejected_bendahara', 'pending_ppspm', 'rejected_ppk', 'pending_kppn', 'rejected_ppspm'].includes(status)));

        const bgColor = getStageColor(stage, isActive, isCompleted);
        const icon = getStageIcon(stage, isActive, isCompleted);

        return (
          <div key={stage} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${bgColor}`}
            >
              {icon || (
                <span className="text-xs font-bold">{idx + 1}</span>
              )}
            </div>
            <p className="text-xs font-medium mt-2 text-center max-w-12">
              {getStageName(stage)}
            </p>

            {idx < stages.length - 1 && (
              <div
                className={`absolute w-12 h-0.5 mt-5 ml-8 transition-colors ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`}
                style={{ marginLeft: 'calc(100px + 8px)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
