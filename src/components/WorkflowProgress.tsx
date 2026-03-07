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
      case 'draft': return '#6B7280';
      case 'pending_bendahara': return '#3B82F6';
      case 'incomplete_bendahara': return '#EF4444';
      case 'pending_ppk': return '#FBBF24';
      case 'incomplete_ppk': return '#F97316';
      case 'pending_ppspm': return '#A855F7';
      case 'incomplete_ppspm': return '#EC4899';
      case 'sent_kppn': return '#3B82F6';
      case 'incomplete_kppn': return '#EF4444';
      case 'incomplete_sm': return '#EF4444';
      case 'complete_arsip': return '#22C55E';
      default: return '#9CA3AF';
    }
  };

  const getProgressLineColor = () => {
    switch (status) {
      case 'draft': return '#6B7280';
      case 'pending_bendahara':
      case 'incomplete_bendahara': return '#3B82F6';
      case 'pending_ppk':
      case 'incomplete_ppk': return '#FBBF24';
      case 'pending_ppspm':
      case 'incomplete_ppspm': return '#A855F7';
      case 'sent_kppn':
      case 'incomplete_kppn': return '#3B82F6';
      case 'complete_arsip': return '#22C55E';
      default: return '#9CA3AF';
    }
  };

  return (
    <div className={cn('w-full px-4', className)}>
      <div className="space-y-8">
        {/* Progress line with steps */}
        <div className="relative flex justify-between items-start" style={{ paddingTop: '16px' }}>
          {/* Background line - continuous */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-300" style={{ zIndex: 0 }} />
          
          {/* Active progress line */}
          <div 
            className="absolute top-6 left-0 h-1 transition-all duration-500"
            style={{
              backgroundColor: getProgressLineColor(),
              width: status === 'complete_arsip' ? '100%' : 
                     ['sent_kppn'].includes(status) ? '66.66%' :
                     ['incomplete_kppn'].includes(status) ? '66.66%' :
                     ['pending_ppspm', 'incomplete_ppspm'].includes(status) ? '66.66%' :
                     ['pending_ppk', 'incomplete_ppk'].includes(status) ? '50%' :
                     ['pending_bendahara', 'incomplete_bendahara'].includes(status) ? '33.33%' :
                     ['draft', 'incomplete_sm'].includes(status) ? '0%' : '0%',
              zIndex: 1
            }}
          />
          
          {/* Step circles */}
          <div className="flex items-start justify-between relative w-full" style={{ zIndex: 2 }}>
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step.key, status);
              
              return (
                <div key={step.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Step circle */}
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

                  {/* Step label */}
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