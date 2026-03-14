import { SubmissionStatus, UserRole, PaymentType } from '@/types/pencairan';

export type WorkflowAction = 'approve' | 'reject';

// Define workflow transitions: from which status can we transition to which status
export const WORKFLOW_TRANSITIONS: Record<SubmissionStatus, Record<WorkflowAction, SubmissionStatus | null>> = {
  draft: {
    approve: 'submitted_sm',
    reject: 'draft',
  },
  submitted_sm: {
    approve: 'pending_bendahara',
    reject: 'rejected_sm',
  },
  pending_bendahara: {
    approve: 'pending_ppk',
    reject: 'rejected_bendahara',
  },
  pending_ppk: {
    approve: 'pending_ppspm',
    reject: 'rejected_ppk',
  },
  pending_ppspm: {
    approve: 'pending_kppn',
    reject: 'rejected_ppspm',
  },
  pending_kppn: {
    approve: 'completed',
    reject: 'rejected_kppn',
  },
  pending_arsip: {
    approve: 'completed',
    reject: null,
  },
  completed: {
    approve: null,
    reject: null,
  },
  // Rejection handling - previous stage can take corrective action
  rejected_sm: {
    approve: 'submitted_sm',  // Submitter resubmit
    reject: null,
  },
  rejected_bendahara: {
    approve: 'pending_ppk',  // Bendahara kirim ulang ke PPK
    reject: null,
  },
  rejected_ppk: {
    approve: 'pending_ppk',  // Bendahara kirim ulang ke PPK
    reject: 'rejected_bendahara',  // Bendahara tolak ke SM
  },
  rejected_ppspm: {
    approve: 'pending_ppspm',  // PPK kirim ulang ke PPSPM
    reject: 'rejected_ppk',  // PPK tolak ke Bendahara
  },
  rejected_kppn: {
    approve: 'pending_kppn',  // PPSPM kirim ulang ke KPPN
    reject: 'rejected_ppspm',  // PPSPM tolak ke PPK
  },
};

export function getNextStatus(
  currentStatus: SubmissionStatus,
  action: WorkflowAction
): SubmissionStatus | null {
  const transitions = WORKFLOW_TRANSITIONS[currentStatus];
  return transitions?.[action] ?? null;
}

export function isValidTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
  role?: UserRole
): boolean {
  const transitions = WORKFLOW_TRANSITIONS[from];
  if (!transitions) return false;
  return transitions.approve === to || transitions.reject === to;
}

export function getAvailableActions(
  status: SubmissionStatus,
  role?: UserRole
): WorkflowAction[] {
  const transitions = WORKFLOW_TRANSITIONS[status];
  if (!transitions) return [];

  const actions: WorkflowAction[] = [];
  if (transitions.approve !== null) actions.push('approve');
  if (transitions.reject !== null) actions.push('reject');
  return actions;
}

export function getCurrentWorkflowStage(status: SubmissionStatus): string {
  if (status === 'draft' || status === 'submitted_sm' || status === 'rejected_sm') return 'SM';
  if (status === 'pending_bendahara' || status === 'rejected_bendahara') return 'Bendahara';
  if (status === 'pending_ppk' || status === 'rejected_ppk') return 'PPK';
  if (status === 'pending_ppspm' || status === 'rejected_ppspm') return 'PPSPM';
  if (status === 'pending_kppn' || status === 'rejected_kppn') return 'Arsip';
  if (status === 'completed') return 'Arsip';
  return 'Unknown';
}

export const WORKFLOW_STAGES = ['SM', 'Bendahara', 'PPK', 'PPSPM', 'KPPN', 'Arsip'] as const;

export function getStageOrder(stage: string): number {
  const index = WORKFLOW_STAGES.indexOf(stage as any);
  return index >= 0 ? index : -1;
}

export function isStageCompleted(status: SubmissionStatus, targetStage: string): boolean {
  if (status === 'completed') return true;

  const currentStage = getCurrentWorkflowStage(status);
  const currentOrder = getStageOrder(currentStage);
  const targetOrder = getStageOrder(targetStage);

  if (currentOrder === -1 || targetOrder === -1) return false;

  // If in a rejected status, only the current stage is "completed"
  if (status.startsWith('rejected_')) {
    return currentStage === targetStage;
  }

  return currentOrder > targetOrder;
}

export function getAllWorkflowStages(): string[] {
  return [...WORKFLOW_STAGES];
}

export function formatStageName(stage: string): string {
  return stage;
}

export function getStageIcon(stage: string): string {
  switch (stage) {
    case 'SM':
      return '📝';
    case 'Bendahara':
      return '💰';
    case 'PPK':
      return '✍️';
    case 'PPSPM':
      return '📋';
    case 'KPPN':
      return '🏦';
    case 'Arsip':
      return '📚';
    default:
      return '❓';
  }
}

export function getStageColor(status: SubmissionStatus, stage: string): string {
  if (status === 'completed') return 'bg-green-100 text-green-700';

  const currentStage = getCurrentWorkflowStage(status);

  if (status.startsWith('rejected_')) {
    return currentStage === stage ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600';
  }

  if (stage === currentStage) return 'bg-blue-100 text-blue-700';
  if (isStageCompleted(status, stage)) return 'bg-green-100 text-green-700';
  return 'bg-slate-100 text-slate-600';
}
