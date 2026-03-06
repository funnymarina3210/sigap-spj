// Workflow State Machine for Pencairan System

import { SubmissionStatus, UserRole, PaymentType } from '@/types/pencairan';

export interface WorkflowTransition {
  from: SubmissionStatus;
  to: SubmissionStatus;
  action: 'approve' | 'reject' | 'submit' | 'save_draft';
  role: UserRole;
  requiresPaymentType?: boolean;
  description?: string;
}

// Complete workflow state machine with all valid transitions
export const WORKFLOW_TRANSITIONS: Record<SubmissionStatus, WorkflowTransition[]> = {
  draft: [
    {
      from: 'draft',
      to: 'submitted_sm',
      action: 'submit',
      role: 'Fungsi Sosial' as any,
      description: 'SM submits draft for Bendahara review',
    },
  ],
  submitted_sm: [
    {
      from: 'submitted_sm',
      to: 'pending_bendahara',
      action: 'approve',
      role: 'Bendahara',
      description: 'Submission ready for Bendahara',
    },
  ],
  pending_bendahara: [
    {
      from: 'pending_bendahara',
      to: 'pending_ppk',
      action: 'approve',
      role: 'Bendahara',
      requiresPaymentType: true,
      description: 'Bendahara approves and sets payment type (LS/UP)',
    },
    {
      from: 'pending_bendahara',
      to: 'rejected_sm',
      action: 'reject',
      role: 'Bendahara',
      description: 'Bendahara rejects, returns to SM',
    },
  ],
  pending_ppk: [
    {
      from: 'pending_ppk',
      to: 'pending_ppspm',
      action: 'approve',
      role: 'Pejabat Pembuat Komitmen',
      description: 'PPK verifies and approves',
    },
    {
      from: 'pending_ppk',
      to: 'rejected_bendahara',
      action: 'reject',
      role: 'Pejabat Pembuat Komitmen',
      description: 'PPK rejects, returns to Bendahara',
    },
  ],
  pending_ppspm: [
    {
      from: 'pending_ppspm',
      to: 'pending_kppn',
      action: 'approve',
      role: 'Pejabat Penandatangan Surat Perintah Membayar',
      description: 'PPSPM approves SPM',
    },
    {
      from: 'pending_ppspm',
      to: 'rejected_ppk',
      action: 'reject',
      role: 'Pejabat Penandatangan Surat Perintah Membayar',
      description: 'PPSPM rejects, returns to PPK',
    },
  ],
  pending_kppn: [
    {
      from: 'pending_kppn',
      to: 'pending_arsip',
      action: 'approve',
      role: 'KPPN',
      description: 'KPPN processes payment',
    },
    {
      from: 'pending_kppn',
      to: 'rejected_ppspm',
      action: 'reject',
      role: 'KPPN',
      description: 'KPPN rejects, returns to PPSPM',
    },
  ],
  pending_arsip: [
    {
      from: 'pending_arsip',
      to: 'completed',
      action: 'approve',
      role: 'Arsip',
      description: 'Arsip records completion with SPPD number',
    },
    {
      from: 'pending_arsip',
      to: 'rejected_kppn',
      action: 'reject',
      role: 'Arsip',
      description: 'Arsip rejects, returns to KPPN',
    },
  ],
  completed: [],
  rejected_sm: [
    {
      from: 'rejected_sm',
      to: 'submitted_sm',
      action: 'submit',
      role: 'Fungsi Sosial' as any,
      description: 'SM resubmits after rejection',
    },
  ],
  rejected_bendahara: [
    {
      from: 'rejected_bendahara',
      to: 'submitted_sm',
      action: 'submit',
      role: 'Fungsi Sosial' as any,
      description: 'SM resubmits after rejection',
    },
  ],
  rejected_ppk: [
    {
      from: 'rejected_ppk',
      to: 'submitted_sm',
      action: 'submit',
      role: 'Fungsi Sosial' as any,
      description: 'SM resubmits after rejection',
    },
  ],
  rejected_ppspm: [
    {
      from: 'rejected_ppspm',
      to: 'submitted_sm',
      action: 'submit',
      role: 'Fungsi Sosial' as any,
      description: 'SM resubmits after rejection',
    },
  ],
  rejected_kppn: [
    {
      from: 'rejected_kppn',
      to: 'submitted_sm',
      action: 'submit',
      role: 'Fungsi Sosial' as any,
      description: 'SM resubmits after rejection',
    },
  ],
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(
  currentStatus: SubmissionStatus,
  nextStatus: SubmissionStatus,
  role: UserRole
): boolean {
  const transitions = WORKFLOW_TRANSITIONS[currentStatus];
  if (!transitions) return false;

  return transitions.some(
    t => t.to === nextStatus && (t.role === role || role === 'admin')
  );
}

/**
 * Get available actions for a user at current status
 */
export function getAvailableActions(status: SubmissionStatus, role: UserRole): WorkflowTransition[] {
  const transitions = WORKFLOW_TRANSITIONS[status];
  if (!transitions) return [];

  return transitions.filter(t => t.role === role || role === 'admin');
}

/**
 * Get next status after an action
 */
export function getNextStatus(
  currentStatus: SubmissionStatus,
  role: UserRole,
  action: 'approve' | 'reject'
): SubmissionStatus | null {
  const transitions = WORKFLOW_TRANSITIONS[currentStatus];
  if (!transitions) return null;

  const transition = transitions.find(
    t => t.action === action && (t.role === role || role === 'admin')
  );

  return transition?.to || null;
}

/**
 * Get current workflow stage from status
 */
export function getCurrentWorkflowStage(status: SubmissionStatus): string {
  switch (status) {
    case 'draft':
    case 'submitted_sm':
      return 'SM';
    case 'pending_bendahara':
    case 'rejected_sm':
      return 'Bendahara';
    case 'pending_ppk':
    case 'rejected_bendahara':
      return 'PPK';
    case 'pending_ppspm':
    case 'rejected_ppk':
      return 'PPSPM';
    case 'pending_kppn':
    case 'rejected_ppspm':
      return 'KPPN';
    case 'pending_arsip':
    case 'rejected_kppn':
      return 'Arsip';
    case 'completed':
      return 'Completed';
    default:
      return 'Unknown';
  }
}

/**
 * Format stage name for UI
 */
export function formatStageName(stage: string): string {
  const names: Record<string, string> = {
    'SM': 'Satuan Kerja',
    'Bendahara': 'Bendahara',
    'PPK': 'Pejabat Pembuat Komitmen',
    'PPSPM': 'Pejabat Penandatangan SPM',
    'KPPN': 'KPPN',
    'Arsip': 'Arsip',
    'Completed': 'Selesai',
  };
  return names[stage] || stage;
}

/**
 * Get stage icon type
 */
export function getStageIcon(stage: string): string {
  const icons: Record<string, string> = {
    'SM': 'FileEdit',
    'Bendahara': 'Clock',
    'PPK': 'Clock',
    'PPSPM': 'Clock',
    'KPPN': 'Clock',
    'Arsip': 'CheckCircle2',
    'Completed': 'CheckCircle2',
  };
  return icons[stage] || 'Clock';
}

/**
 * Get stage color for UI
 */
export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    'SM': 'bg-blue-500',
    'Bendahara': 'bg-purple-500',
    'PPK': 'bg-orange-500',
    'PPSPM': 'bg-pink-500',
    'KPPN': 'bg-indigo-500',
    'Arsip': 'bg-green-500',
    'Completed': 'bg-green-600',
  };
  return colors[stage] || 'bg-gray-500';
}
