import { SubmissionStatus } from '@/types/pencairan';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Circle, XCircle } from 'lucide-react';

interface WorkflowProgressProps {
  status: SubmissionStatus;
  className?: string;
}

const steps = [
  { key: 'sm', label: 'SM', description: 'Satuan Kerja' },
  { key: 'bendahara', label: 'Bendahara', description: 'Bendahara' },
  { key: 'ppk', label: 'PPK', description: 'PPK' },
  { key: 'ppspm', label: 'PPSPM', description: 'PPSPM' },
  { key: 'kppn', label: 'KPPN', description: 'KPPN' },
  { key: 'arsip', label: 'Arsip', description: 'Arsip' },
];

function getStepStatus(stepKey: string, submissionStatus: SubmissionStatus | undefined): 'complete' | 'current' | 'pending' | 'error' {
  if (!submissionStatus) return 'pending';
  
  switch (submissionStatus) {
    case 'draft':
      if (stepKey === 'sm') return 'current';
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
      // Once sent to KPPN, KPPN is complete and Arsip becomes current responsibility
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk' || stepKey === 'ppspm' || stepKey === 'kppn') return 'complete';
      if (stepKey === 'arsip') return 'current';
      return 'pending';
    case 'incomplete_kppn':
      // KPPN rejected the submission
      if (stepKey === 'sm' || stepKey === 'bendahara' || stepKey === 'ppk' || stepKey === 'ppspm') return 'complete';
      if (stepKey === 'kppn') return 'error';
      return 'pending';
    case 'complete_arsip':
      // Everything is complete and archived
      return 'complete';
    default:
      return 'pending';
  }
}

function getProgressWidth(stepIndex: number, status: SubmissionStatus | undefined): number {
  if (!status) return 0;
  
  const stepStatus = getStepStatus(steps[stepIndex].key, status);
  
  if (stepStatus === 'complete') {
    return 100;
  } else if (stepStatus === 'current') {
    return 50;
  }
  return 0;
}

export function WorkflowProgress({ status, className }: WorkflowProgressProps) {
  // Calculate total progress as percentage
  const completedSteps = steps.filter(step => getStepStatus(step.key, status) === 'complete').length;
  const hasCurrentStep = steps.some(step => getStepStatus(step.key, status) === 'current');
  const totalProgress = (completedSteps / steps.length) * 100 + (hasCurrentStep ? (1 / steps.length) * 50 : 0);
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute left-0 right-0 top-6 h-1 bg-secondary rounded-full" />
        
        {/* Active progress line */}
        <div 
          className="absolute left-0 top-6 h-1 bg-gradient-to-r from-status-complete to-primary rounded-full transition-all duration-500"
          style={{
            width: `${totalProgress}%`
          }}
        />
        
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key, status);
          
          return (
            <div key={step.key} className="relative flex flex-col items-center z-10">
              <div 
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-sm',
                  stepStatus === 'complete' && 'bg-green-100 border-green-500 text-green-600 shadow-[0_0_20px_rgba(34,197,94,0.2)]',
                  stepStatus === 'current' && 'bg-blue-100 border-blue-500 text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
                  stepStatus === 'pending' && 'bg-card border-border text-muted-foreground',
                  stepStatus === 'error' && 'bg-red-100 border-red-500 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                )}
              >
                {stepStatus === 'complete' && <CheckCircle2 className="w-5 h-5" />}
                {stepStatus === 'current' && <Clock className="w-5 h-5 animate-pulse" />}
                {stepStatus === 'pending' && <Circle className="w-5 h-5" />}
                {stepStatus === 'error' && <XCircle className="w-5 h-5" />}
              </div>
              <div className="mt-3 text-center">
                <p className={cn(
                  'text-sm font-semibold transition-colors',
                  stepStatus === 'complete' && 'text-green-600',
                  stepStatus === 'current' && 'text-blue-600',
                  stepStatus === 'pending' && 'text-muted-foreground',
                  stepStatus === 'error' && 'text-red-600'
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