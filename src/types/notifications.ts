export type NotificationType = 'pencairan' | 'sbml_spk' | 'system';

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  targetRoles: string[];
  relatedId?: string;
  status?: string;
  createdAt: Date;
  actionUrl?: string;
  displayTime?: string; // Formatted time for display (e.g., "update: 08:44 - 06/02/2026")
}

export interface PencairanNotification extends Notification {
  type: 'pencairan';
  judulPengajuan: string;
  submissionStatus: 'draft' | 'pending_bendahara' | 'pending_ppk' | 'pending_ppspm' | 'sent_kppn' | 'rejected' | 'complete_arsip' | 'incomplete_sm' | 'incomplete_bendahara' | 'incomplete_ppk' | 'incomplete_ppspm' | 'incomplete_kppn';
}

export interface SBMLNotification extends Notification {
  type: 'sbml_spk';
  namaPetugas: string;
  periode: string;
  sheetName: 'Cek SBML' | 'Rekap SPK-BAST';
}
