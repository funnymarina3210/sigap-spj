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
  { key: 'ppspm', label: 'PPSPM', description: 'Pejabat Penandatangan SPM' },
  { key: 'kppn', label: 'KPPN', description: 'Kantor Pelayanan Perbendaharaan' },
  { key: 'arsip', label: 'Arsip', description: 'Arsip' },
];

function getStepStatus(stepKey: string, submissionStatus: SubmissionStatus | undefined): 'complete' | 'current' | 'pending' | 'error' {
  if (!submissionStatus) return 'pending';
  
  switch (submissionStatus) {
    case 'draft':
      if (stepKey === 'sm') return 'current';
      return 'pending';
    case 'submitted_sm':
      if (stepKey === 'sm') return 'current';
      return 'pending';
    case 'rejected_sm':
      if (stepKey === 'sm') return 'error';
      return 'pending';
    case 'pending_bendahara':
      if (stepKey === 'sm') return 'complete';
      if (stepKey === 'bendahara') return 'current';
      return 'pending';
    case 'rejected_bendahara':
      if (stepKey === 'sm') return 'complete';
      if (stepKey === 'bendahara') return 'error';
      return 'pending';
    case 'pending_ppk':
      if (stepKey === 'sm' || stepKey === 'bendahara') return 'complete';
      if (stepKey === 'ppk') return 'current';
      return 'pending';
    case 'rejected_ppk':
      if (stepKey === 'sm' || stepKey === 'bendahara') return 'complete';
      if (stepKey === 'ppk') return 'error';
      return 'pending';
    case 'pending_ppspm':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk') return 'complete';
      if (stepKey === 'ppspm') return 'current';
      return 'pending';
    case 'rejected_ppspm':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk') return 'complete';
      if (stepKey === 'ppspm') return 'error';
      return 'pending';
    case 'pending_kppn':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk' || stepKey === 'ppspm' || stepKey === 'kppn') return 'complete';
      if (stepKey === 'arsip') return 'current';
      return 'pending';
    case 'rejected_kppn':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk' || stepKey === 'ppspm') return 'complete';
      if (stepKey === 'kppn') return 'error';
      return 'pending';
    case 'pending_arsip':
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk' || stepKey === 'ppspm' || stepKey === 'kppn') return 'complete';
      if (stepKey === 'arsip') return 'current';
      return 'pending';
    case 'completed':
      return 'complete';
    default:
      return 'pending';
  }
}

export function WorkflowProgress({ status, className }: WorkflowProgressProps) {
  const getCurrentStepColor = () => {
    switch (status) {
      case 'draft':
      case 'submitted_sm': return '#6B7280';
      case 'pending_bendahara': return '#3B82F6';
      case 'rejected_bendahara': return '#EF4444';
      case 'pending_ppk': return '#FBBF24';
      case 'rejected_ppk': return '#F97316';
      case 'pending_ppspm': return '#A855F7';
      case 'rejected_ppspm': return '#EC4899';
      case 'pending_kppn': return '#3B82F6';
      case 'rejected_kppn': return '#EF4444';
      case 'rejected_sm': return '#EF4444';
      case 'pending_arsip': return '#06B6D4';
      case 'completed': return '#22C55E';
      default: return '#9CA3AF';
    }
  };

  const getProgressWidth = () => {
    switch (status) {
      case 'draft':
      case 'submitted_sm':
      case 'rejected_sm': return '0%';
      case 'pending_bendahara':
      case 'rejected_bendahara': return '20%';
      case 'pending_ppk':
      case 'rejected_ppk': return '40%';
      case 'pending_ppspm':
      case 'rejected_ppspm': return '60%';
      case 'pending_kppn':
      case 'rejected_kppn': return '80%';
      case 'pending_arsip': return '90%';
      case 'completed': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className={cn('w-full px-4', className)}>
      <div className="space-y-8">
        <div className="relative flex justify-between items-start" style={{ paddingTop: '16px' }}>
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-300" style={{ zIndex: 0 }} />
          <div 
            className="absolute top-6 left-0 h-1 transition-all duration-500"
            style={{
              backgroundColor: getCurrentStepColor(),
              width: getProgressWidth(),
              zIndex: 1
            }}
          />
          <div className="flex items-start justify-between relative w-full" style={{ zIndex: 2 }}>
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step.key, status);
              return (
                <div key={step.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 flex-shrink-0 bg-white border-2"
                    style={{
                      borderColor: stepStatus === 'pending' ? '#D1D5DB' :
                                   stepStatus === 'complete' ? '#22C55E' :
                                   stepStatus === 'current' ? getCurrentStepColor() :
                                   stepStatus === 'error' ? '#EF4444' : '#D1D5DB',
                      backgroundColor: stepStatus === 'complete' ? '#22C55E' :
                                      stepStatus === 'current' ? getCurrentStepColor() :
                                      stepStatus === 'error' ? '#EF4444' : '#FFFFFF',
                      color: stepStatus === 'pending' ? '#9CA3AF' : '#FFFFFF',
                      boxShadow: stepStatus === 'current' ? `0 0 0 4px ${getCurrentStepColor()}33` :
                                stepStatus === 'complete' ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none'
                    }}
                  >
                    {stepStatus === 'complete' && <span style={{ fontSize: '20px' }}>✓</span>}
                    {stepStatus === 'current' && <span style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>{index + 1}</span>}
                    {stepStatus === 'pending' && <span style={{ fontSize: '16px', color: '#9CA3AF', fontWeight: 'bold' }}>{index + 1}</span>}
                    {stepStatus === 'error' && <span style={{ fontSize: '18px', color: 'white' }}>!</span>}
                  </div>
                  <div className="mt-3 text-center">
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: stepStatus === 'complete' ? '#16A34A' :
                             stepStatus === 'current' ? '#000000' :
                             stepStatus === 'pending' ? '#6B7280' :
                             stepStatus === 'error' ? '#DC2626' : '#6B7280'
                    }}>
                      {step.label}
                    </p>
                    <p style={{
                      fontSize: '10px',
                      color: '#6B7280',
                      maxWidth: '70px',
                      lineHeight: '1.2',
                      marginTop: '4px'
                    }}>
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
