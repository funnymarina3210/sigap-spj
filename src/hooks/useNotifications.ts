import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsContext } from '@/contexts/NotificationsContext';
import { Notification } from '@/types/notifications';
import { Submission, SubmissionStatus } from '@/types/pencairan';

/**
 * Generate notifications from pencairan submissions based on user role.
 * Uses the already-fetched data from usePencairanData (no extra API calls).
 */
function generateNotificationsFromSubmissions(
  submissions: Submission[],
  userRole: string
): Notification[] {
  const notifications: Notification[] = [];

  const normalizeRole = (role: string): string => {
    const lower = role.toLowerCase();
    if (lower.includes('bendahara')) return 'Bendahara';
    if (lower.includes('pejabat pembuat komitmen')) return 'PPK';
    if (lower.includes('pejabat penandatangan') || lower.includes('ppspm')) return 'PPSPM';
    if (lower.includes('kppn')) return 'KPPN';
    if (lower.includes('arsip')) return 'Arsip';
    if (lower.includes('fungsi')) return 'Fungsi';
    return role;
  };

  const normalized = normalizeRole(userRole);
  const isFungsi = normalized === 'Fungsi' || userRole.includes('Fungsi');

  for (const sub of submissions) {
    let title = '';
    let message = '';
    let shouldShow = false;
    let priority: 'high' | 'medium' | 'low' = 'medium';

    const status = sub.status;
    const judul = sub.title || 'Pengajuan';
    const isCreator = sub.user === userRole || sub.user === normalized;

    switch (status) {
      // Draft - notify creator to complete
      case 'draft':
        if (isCreator || (isFungsi && !sub.user)) {
          title = 'Sigap SPJ - Pengajuan Baru';
          message = `${judul} masih belum dilengkapi Subjek Metter`;
          shouldShow = true;
        }
        break;

      // Submitted SM - notify creator
      case 'submitted_sm':
        if (isCreator) {
          title = 'Sigap SPJ - Pengajuan Dikirim';
          message = `${judul} sudah dikirim, menunggu pemeriksaan Bendahara`;
          shouldShow = true;
        }
        break;

      // Pending Bendahara - notify Bendahara
      case 'pending_bendahara':
        if (normalized === 'Bendahara') {
          title = 'Sigap SPJ - Pengajuan Baru';
          message = `Harap periksa kelengkapan berkas dari pengajuan ${judul}`;
          shouldShow = true;
        }
        break;

      // Pending PPK - notify PPK
      case 'pending_ppk':
        if (normalized === 'PPK') {
          title = 'Sigap SPJ - Pengajuan Baru';
          message = `Harap periksa kelengkapan berkas dari pengajuan ${judul}`;
          shouldShow = true;
        }
        break;

      // Pending PPSPM - notify PPSPM
      case 'pending_ppspm':
        if (normalized === 'PPSPM') {
          title = 'Sigap SPJ - Pengajuan Baru';
          message = `${judul} untuk diperiksa dan ditandatangani`;
          shouldShow = true;
        }
        break;

      // Pending KPPN - notify KPPN
      case 'pending_kppn':
        if (normalized === 'KPPN') {
          title = 'Sigap SPJ - Pengajuan Baru';
          message = `${judul} siap dikirim ke KPPN`;
          shouldShow = true;
        }
        break;

      // Pending Arsip - notify Arsip
      case 'pending_arsip':
        if (normalized === 'Arsip') {
          title = 'Sigap SPJ - Pengajuan Baru';
          message = `${judul} untuk diarsipkan`;
          shouldShow = true;
        }
        break;

      // Rejected by SM - notify creator
      case 'rejected_sm':
        if (isCreator) {
          title = 'Sigap SPJ - Pengajuan Ditolak';
          message = `${judul} ditolak SM. Mohon untuk segera memperbaiki`;
          shouldShow = true;
          priority = 'high';
        }
        break;

      // Rejected by Bendahara - notify creator
      case 'rejected_bendahara':
        if (isCreator) {
          title = 'Sigap SPJ - Pengajuan Ditolak';
          message = `${judul} ditolak Bendahara. Mohon untuk segera memperbaiki`;
          shouldShow = true;
          priority = 'high';
        }
        break;

      // Rejected by PPK - notify Bendahara (who forwarded it)
      case 'rejected_ppk':
        if (normalized === 'Bendahara' || isCreator) {
          title = 'Sigap SPJ - Pengajuan Ditolak';
          message = `${judul} ditolak PPK. Mohon segera memperbaiki`;
          shouldShow = true;
          priority = 'high';
        }
        break;

      // Rejected by PPSPM - notify PPK
      case 'rejected_ppspm':
        if (normalized === 'PPK' || isCreator) {
          title = 'Sigap SPJ - Pengajuan Ditolak';
          message = `${judul} ditolak PPSPM. Mohon segera memperbaiki`;
          shouldShow = true;
          priority = 'high';
        }
        break;

      // Rejected by KPPN - notify PPSPM
      case 'rejected_kppn':
        if (normalized === 'PPSPM' || isCreator) {
          title = 'Sigap SPJ - Pengajuan Ditolak';
          message = `${judul} ditolak KPPN. Mohon segera memperbaiki`;
          shouldShow = true;
          priority = 'high';
        }
        break;

      // Completed - notify creator
      case 'completed':
        if (isCreator) {
          title = 'Sigap SPJ - Pengajuan Selesai';
          message = `${judul} sudah selesai diproses dan diarsipkan`;
          shouldShow = true;
          priority = 'low';
        }
        break;
    }

    if (shouldShow && title) {
      const displayTime = sub.updatedAtString
        ? `Update terakhir: ${sub.updatedAtString}`
        : sub.waktuPengajuan
          ? `Update terakhir: ${sub.waktuPengajuan}`
          : 'Baru saja';

      notifications.push({
        id: `pencairan-${sub.id}`,
        type: 'pencairan',
        title,
        message,
        priority,
        targetRoles: [],
        relatedId: sub.id,
        status: sub.status,
        createdAt: sub.updatedAt || sub.submittedAt || new Date(),
        displayTime,
        actionUrl: '/pencairan',
      });
    }
  }

  return notifications;
}

export function useNotifications() {
  const { user } = useAuth();
  const notificationsContext = useNotificationsContext();
  const { data: submissions } = usePencairanData();
  const prevCountRef = useRef<number>(-1);

  const userRole = user?.role || '';

  useEffect(() => {
    if (!user || !submissions || submissions.length === 0) {
      return;
    }

    // Generate notifications from submissions
    const notifs = generateNotificationsFromSubmissions(submissions, userRole);

    // Only update if count changed to avoid infinite loops
    if (notifs.length !== prevCountRef.current) {
      prevCountRef.current = notifs.length;
      notificationsContext._setNotifications(notifs);
    }
  }, [submissions, userRole, user]);
}
