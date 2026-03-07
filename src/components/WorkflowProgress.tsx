import { SubmissionStatus } from '@/types/pencairan';
import { cn } from '@/lib/utils';

interface WorkflowProgressProps {
  status: SubmissionStatus;
  className?: string;
}

const steps = [
  { key: 'sm', label: 'SM', description: 'Subject Matter' },
  { key: 'bendahara', label: 'Bendahara', description: 'Bendahara Pengeluaran' },
  { key: 'ppk', label: 'PPK', description: 'Pejabat Pembuat Komitmen' },
  { key: 'ppspm', label: 'PPSPM', description: 'Pejabat Penandatangan Surat Perintah Membayar' },
  { key: 'kppn', label: 'KPPN', description: 'Kantor Pelayanan Perbendaharaan Negara' },
  { key: 'arsip', label: 'Arsip', description: 'Arsip' },
];

function getStepStatus(stepKey: string, submissionStatus: SubmissionStatus | undefined): 'complete' | 'current' | 'pending' | 'error' {
  if (!submissionStatus) return 'pending';
  
  switch (submissionStatus) {
    case 'draft':
      if (stepKey === 'sm') return 'current';
      return 'pending';
    case 'incomplete_sm':
      if (stepKey === 'sm') return 'error';
      return 'pending';
    case 'pending_bendahara':
      if (stepKey === 'sm') return 'complete';
      if (stepKey === 'bendahara') return 'current';
      return 'pending';
    case 'incomplete_bendahara':
      if (stepKey === 'sm') return 'complete';
      if (stepKey === 'bendahara') return 'error';
      return 'pending';
    case 'pending_ppk':
      if (stepKey === 'sm' || stepKey === 'bendahara') return 'complete';
      if (stepKey === 'ppk') return 'current';
      return 'pending';
    case 'incomplete_ppk':
      if (stepKey === 'sm' || stepKey === 'bendahara') return 'complete';
      if (stepKey === 'ppk') return 'error';
      return 'pending';
    case 'pending_ppspm':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk') return 'complete';
      if (stepKey === 'ppspm') return 'current';
      return 'pending';
    case 'incomplete_ppspm':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk') return 'complete';
      if (stepKey === 'ppspm') return 'error';
      return 'pending';
    case 'sent_kppn':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk' || stepKey === 'ppspm') return 'complete';
      if (stepKey === 'kppn') return 'current';
      return 'pending';
    case 'incomplete_kppn':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk' || stepKey === 'ppspm') return 'complete';
      if (stepKey === 'kppn') return 'error';
      return 'pending';
    case 'complete_arsip':
      return 'complete';
    default:
      return 'pending';
  }
}

export function WorkflowProgress({ status, className }: WorkflowProgressProps) {
  const getCurrentStepColor = () => {
    switch (status) {
      case 'draft': return 'bg-gray-400 text-white';
      case 'pending_bendahara': return 'bg-blue-400 text-white';
      case 'incomplete_bendahara': return 'bg-red-400 text-white';
      case 'pending_ppk': return 'bg-yellow-400 text-white';
      case 'incomplete_ppk': return 'bg-orange-500 text-white';
      case 'pending_ppspm': return 'bg-purple-500 text-white';
      case 'incomplete_ppspm': return 'bg-red-500 text-white';
      case 'sent_kppn': return 'bg-blue-400 text-white';
      case 'incomplete_kppn': return 'bg-red-400 text-white';
      case 'incomplete_sm': return 'bg-red-500 text-white';
      case 'complete_arsip': return 'bg-green-500 text-white';
      default: return 'bg-gray-300 text-white';
    }
  };

  const getProgressLineColor = () => {
    switch (status) {
      case 'draft': return 'bg-gray-400';
      case 'pending_bendahara':
      case 'incomplete_bendahara': return 'bg-blue-400';
      case 'pending_ppk':
      case 'incomplete_ppk': return 'bg-yellow-400';
      case 'pending_ppspm':
      case 'incomplete_ppspm': return 'bg-purple-500';
      case 'sent_kppn':
      case 'incomplete_kppn': return 'bg-blue-400';
      case 'complete_arsip': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-6">
        {/* Progress line with steps */}
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
          
          {/* Active progress line */}
          <div 
            className={cn(
              "absolute top-5 left-0 h-1.5 rounded-full transition-all duration-500",
              getProgressLineColor()
            )}
            style={{
              width: status === 'complete_arsip' ? '100%' : 
                     ['sent_kppn'].includes(status) ? '67%' :
                     ['incomplete_kppn'].includes(status) ? '67%' :
                     ['pending_ppspm', 'incomplete_ppspm'].includes(status) ? '67%' :
                     ['pending_ppk', 'incomplete_ppk'].includes(status) ? '50%' :
                     ['pending_bendahara', 'incomplete_bendahara'].includes(status) ? '33%' :
                     ['draft', 'incomplete_sm'].includes(status) ? '0%' : '0%'
            }}
          />
          
          {/* Step circles and connector lines */}
          <div className="flex items-center justify-between relative z-10">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step.key, status);
              const stepNumber = index + 1;
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  {/* Step circle */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 flex-shrink-0',
                      stepStatus === 'complete' && 'bg-green-500 text-white shadow-md',
                      stepStatus === 'current' && `${getCurrentStepColor()} shadow-lg ring-2 ring-offset-2 ring-current`,
                      stepStatus === 'pending' && 'bg-white text-gray-400 border-2 border-gray-300',
                      stepStatus === 'error' && 'bg-red-500 text-white shadow-md'
                    )}
                  >
                    {stepStatus === 'complete' && <span className="text-xl">✓</span>}
                    {stepStatus === 'current' && <span></span>}
                    {stepStatus === 'pending' && <span></span>}
                    {stepStatus === 'error' && <span>!</span>}
                  </div>

                  {/* Step label */}
                  <div className="mt-3 text-center">
                    <p className={cn(
                      'text-xs font-semibold',
                      stepStatus === 'complete' && 'text-green-600',
                      stepStatus === 'current' && 'text-gray-900 font-bold',
                      stepStatus === 'pending' && 'text-gray-600',
                      stepStatus === 'error' && 'text-red-600'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-gray-600 max-w-[70px] leading-tight mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}