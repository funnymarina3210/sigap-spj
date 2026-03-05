import { SubmissionStatus } from '@/types/submission';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, Building2 } from 'lucide-react';

interface WorkflowProgressProps {
  status: SubmissionStatus;
  className?: string;
}

const steps = [
  { key: 'sm', label: 'SM', description: 'Subjek Meter' },
  { key: 'ppk', label: 'PPK', description: 'Pejabat Pembuat Komitmen' },
  { key: 'bendahara', label: 'Bendahara', description: 'Bendahara Pengeluaran' },
  { key: 'kppn', label: 'KPPN', description: 'Kantor Pelayanan Perbendaharaan Negara' },
];

function getStepStatus(stepKey: string, submissionStatus: SubmissionStatus | undefined): 'complete' | 'current' | 'pending' | 'error' {
  if (!submissionStatus) return 'pending';
  
  switch (submissionStatus) {
    case 'pending_ppk':
      if (stepKey === 'sm') return 'complete';
      if (stepKey === 'ppk') return 'current';
      return 'pending';
    case 'incomplete_sm':
      if (stepKey === 'sm') return 'error';
      return 'pending';
    case 'pending_bendahara':
      if (stepKey === 'sm' || stepKey === 'ppk') return 'complete';
      if (stepKey === 'bendahara') return 'current';
      return 'pending';
    case 'incomplete_ppk':
      if (stepKey === 'sm') return 'complete';
      if (stepKey === 'ppk') return 'error';
      return 'pending';
    case 'incomplete_bendahara':
      if (stepKey === 'sm' || stepKey === 'ppk') return 'complete';
      if (stepKey === 'bendahara') return 'error';
      return 'pending';
    case 'sent_kppn':
      return 'complete';
    default:
      return 'pending';
  }
}

export function WorkflowProgress({ status, className }: WorkflowProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute left-0 right-0 top-6 h-1 bg-secondary rounded-full" />
        
        {/* Active progress line */}
        <div 
          className="absolute left-0 top-6 h-1 bg-gradient-to-r from-status-complete to-primary rounded-full transition-all duration-500"
          style={{
            width: status === 'sent_kppn' ? '100%' 
              : status === 'pending_bendahara' || status === 'incomplete_ppk' ? '66%'
              : status === 'pending_ppk' || status === 'incomplete_sm' ? '33%'
              : '0%'
          }}
        />
        
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key, status);
          
          return (
            <div key={step.key} className="relative flex flex-col items-center z-10">
              <div 
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-sm',
                  stepStatus === 'complete' && 'bg-status-complete border-status-complete text-primary-foreground shadow-[0_0_20px_hsl(var(--status-complete)/0.3)]',
                  stepStatus === 'current' && 'bg-primary border-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]',
                  stepStatus === 'pending' && 'bg-card border-border text-muted-foreground',
                  stepStatus === 'error' && 'bg-status-incomplete border-status-incomplete text-primary-foreground shadow-[0_0_20px_hsl(var(--status-incomplete)/0.3)]'
                )}
              >
                {stepStatus === 'complete' && <CheckCircle2 className="w-5 h-5" />}
                {stepStatus === 'current' && <Clock className="w-5 h-5 animate-pulse" />}
                {stepStatus === 'pending' && (step.key === 'kppn' ? <Building2 className="w-5 h-5" /> : <span className="text-sm font-bold">{index + 1}</span>)}
                {stepStatus === 'error' && <XCircle className="w-5 h-5" />}
              </div>
              <div className="mt-3 text-center">
                <p className={cn(
                  'text-sm font-semibold transition-colors',
                  stepStatus === 'complete' && 'text-status-complete',
                  stepStatus === 'current' && 'text-primary',
                  stepStatus === 'pending' && 'text-muted-foreground',
                  stepStatus === 'error' && 'text-status-incomplete'
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[80px] leading-tight">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}