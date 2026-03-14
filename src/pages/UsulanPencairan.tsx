import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Submission, SubmissionStatus, UserRole, canCreateSubmission, PaymentType, formatDateTime, shouldShowSubmission, canViewAllSubmissions } from '@/types/pencairan';
import { SubmissionForm } from '@/components/pencairan/SubmissionForm';
import { SubmissionTable } from '@/components/pencairan/SubmissionTable';
import { SubmissionDetail } from '@/components/pencairan/SubmissionDetail';
import { FilterTabs } from '@/components/pencairan/FilterTabs';
import { SPByGrouping } from '@/components/pencairan/SPByGrouping';
import { usePencairanData } from '@/hooks/use-pencairan-data';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getNextStatus } from '@/lib/workflow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function UsulanPencairan() {
  const { data: sheetSubmissions = [], isLoading, refetch } = usePencairanData();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showSpBy, setShowSpBy] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Submission | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const userRole = user?.role as UserRole;
  const showCreateButton = canCreateSubmission(userRole);

  useEffect(() => {
    if (sheetSubmissions.length > 0) {
      const converted: Submission[] = sheetSubmissions.map(item => ({
        ...item,
        submittedAt: item.submittedAt instanceof Date ? item.submittedAt : new Date(),
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(),
      }));
      
      setSubmissions(converted);
    }
  }, [sheetSubmissions]);

  const filteredSubmissions = useMemo(() => {
    let result = submissions;
    
    result = result.filter(sub => shouldShowSubmission(sub, userRole, sub.user));
    
    if (activeFilter === 'rejected') {
      // Combined rejected filter
      result = result.filter(sub => sub.status.startsWith('rejected_'));
    } else if (activeFilter === 'spby') {
      // SPBy: UP submissions at pending_bendahara
      result = result.filter(sub => sub.pembayaran === 'UP' && sub.status === 'pending_bendahara');
    } else if (activeFilter === 'draft') {
      // Draft tab includes draft + rejected_bendahara + rejected_sm (kembali ke SM)
      result = result.filter(sub => 
        sub.status === 'draft' || sub.status === 'rejected_bendahara' || sub.status === 'rejected_sm'
      );
    } else if (activeFilter === 'pending_bendahara') {
      // Bendahara tab includes submitted_sm + pending_bendahara + rejected_ppk (ditolak PPK → kembali ke Bendahara)
      result = result.filter(sub => 
        sub.status === 'pending_bendahara' || sub.status === 'submitted_sm' || sub.status === 'rejected_ppk'
      );
    } else if (activeFilter === 'pending_ppk') {
      // PPK tab includes pending_ppk + rejected_ppspm (ditolak PPSPM → kembali ke PPK)
      result = result.filter(sub => 
        sub.status === 'pending_ppk' || sub.status === 'rejected_ppspm'
      );
    } else if (activeFilter === 'pending_ppspm') {
      // PPSPM tab includes pending_ppspm + rejected_kppn (ditolak Arsip → kembali ke PPSPM)
      result = result.filter(sub => 
        sub.status === 'pending_ppspm' || sub.status === 'rejected_kppn'
      );
    } else if (activeFilter === 'pending_kppn') {
      // KPPN tab: pending_kppn only
      result = result.filter(sub => sub.status === 'pending_kppn');
    } else if (activeFilter === 'completed') {
      // Arsip tab: completed only
      result = result.filter(sub => sub.status === 'completed');
    } else if (activeFilter !== 'all') {
      result = result.filter(sub => sub.status === activeFilter);
    }
    
    // Sort by ID descending (newest first)
    result = result.sort((a, b) => {
      try {
        const aNum = parseInt(a.id.substring(5));
        const bNum = parseInt(b.id.substring(5));
        return bNum - aNum;
      } catch (e) {
        return 0;
      }
    });
    
    return result;
  }, [submissions, activeFilter, userRole]);

  const counts = useMemo(() => {
    const allStatuses: SubmissionStatus[] = [
      'draft',
      'submitted_sm',
      'pending_bendahara',
      'pending_ppk',
      'pending_ppspm',
      'pending_kppn',
      'pending_arsip',
      'completed',
      'rejected_sm',
      'rejected_bendahara',
      'rejected_ppk',
      'rejected_ppspm',
      'rejected_kppn',
    ];

    // 🆕 Filter submissions berdasarkan role visibility untuk counts
    const visibleSubmissions = submissions.filter(sub => shouldShowSubmission(sub, userRole, sub.user));

    const result: Record<string, number> = {
      all: visibleSubmissions.length,
      spby: visibleSubmissions.filter(s => s.pembayaran === 'UP' && s.status === 'pending_bendahara').length,
    };

    allStatuses.forEach(status => {
      result[status] = visibleSubmissions.filter(s => s.status === status).length;
    });

    // Rejected items juga masuk ke tab role yang harus menangani
    // Draft includes rejected_bendahara + rejected_sm
    result['draft'] = (result['draft'] || 0) + (result['rejected_bendahara'] || 0) + (result['rejected_sm'] || 0);
    // Bendahara includes submitted_sm + rejected_ppk
    result['pending_bendahara'] = (result['pending_bendahara'] || 0) + (result['submitted_sm'] || 0) + (result['rejected_ppk'] || 0);
    // PPK includes rejected_ppspm
    result['pending_ppk'] = (result['pending_ppk'] || 0) + (result['rejected_ppspm'] || 0);
    // PPSPM includes rejected_kppn
    result['pending_ppspm'] = (result['pending_ppspm'] || 0) + (result['rejected_kppn'] || 0);
    // Arsip tab (pending_kppn) includes completed
    result['pending_kppn'] = (result['pending_kppn'] || 0) + (result['completed'] || 0);

    return result;
  }, [submissions, userRole]);

  const handleFormSubmit = () => {
    setEditingSubmission(null);
    setShowForm(false);
    setTimeout(() => refetch(), 1500);
  };

  const handleRowClick = (submission: Submission) => {
    setSelectedDetail(submission);
    setShowDetail(true);
  };

  const handleEditDraft = (submission: Submission) => {
    setEditingSubmission(submission);
    setShowForm(true);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedDetail(null);
  };

  const handleApprove = async (submission: Submission, notes: string, paymentType?: PaymentType, spmNumber?: string) => {
    if (!user) throw new Error('User not found');

    // Get next status based on current status
    const nextStatus = getNextStatus(submission.status, 'approve');
    if (!nextStatus) throw new Error('Cannot approve at current stage or permission denied');

    // Build the update object
    const updateData: Record<string, any> = {
      id: submission.id,
      status: nextStatus,
      actor: userRole,
      action: 'approve',
      catatan: notes || '',
    };

    // Handle Bendahara-specific fields (payment type and SPM number)
    if (userRole === 'Bendahara' && paymentType) {
      updateData.pembayaran = paymentType;
      if (paymentType === 'LS' && spmNumber) {
        updateData.nomorSPM = spmNumber;
      }
    }

    // Call the pencairan-update Supabase function
    const { data, error } = await supabase.functions.invoke('pencairan-update', {
      body: updateData,
    });

    if (error) throw new Error(error.message || 'Failed to approve submission');

    // Update local state
    const updatedSubmission: Submission = {
      ...submission,
      status: nextStatus,
      updatedAt: new Date(),
    };

    // Add role-specific timestamp
    if (userRole === 'Bendahara') {
      updatedSubmission.waktuBendahara = formatDateTime(new Date());
      updatedSubmission.statusBendahara = notes || '';
    } else if (userRole === 'Pejabat Pembuat Komitmen') {
      updatedSubmission.waktuPpk = formatDateTime(new Date());
      updatedSubmission.statusPpk = notes || '';
    } else if (userRole === 'Pejabat Penandatangan Surat Perintah Membayar') {
      updatedSubmission.waktuPPSPM = formatDateTime(new Date());
      updatedSubmission.statusPPSPM = notes || '';
    } else if (userRole === 'KPPN') {
      updatedSubmission.waktuArsip = formatDateTime(new Date());
      updatedSubmission.statusArsip = notes || '';
    }

    setSubmissions(submissions.map(s => s.id === submission.id ? updatedSubmission : s));
    setShowDetail(false);
    setSelectedDetail(null);
  };

  const handleReject = async (submission: Submission, reason: string) => {
    if (!user) throw new Error('User not found');

    // Determine rejection status based on current status
    let rejectStatus: SubmissionStatus;
    switch (submission.status) {
      case 'submitted_sm':
        rejectStatus = 'rejected_sm';
        break;
      case 'pending_bendahara':
        rejectStatus = 'rejected_bendahara';
        break;
      case 'pending_ppk':
        rejectStatus = 'rejected_ppk';
        break;
      case 'pending_ppspm':
        rejectStatus = 'rejected_ppspm';
        break;
      case 'pending_kppn':
        rejectStatus = 'rejected_kppn';
        break;
      default:
        throw new Error('Cannot reject submission at current status');
    }

    // Call the pencairan-update Supabase function
    const { data, error } = await supabase.functions.invoke('pencairan-update', {
      body: {
        id: submission.id,
        status: rejectStatus,
        actor: userRole,
        action: 'reject',
        catatan: reason,
      },
    });

    if (error) throw new Error(error.message || 'Failed to reject submission');

    // Update local state
    const updatedSubmission: Submission = {
      ...submission,
      status: rejectStatus,
      updatedAt: new Date(),
    };

    setSubmissions(submissions.map(s => s.id === submission.id ? updatedSubmission : s));
    setShowDetail(false);
    setSelectedDetail(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Usulan Pencairan
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola pengajuan pencairan SPJ Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showCreateButton && (
            <Button
              onClick={() => {
                setEditingSubmission(null);
                setShowForm(true);
              }}
              className="rounded-xl"
            >
              ➕ Buat Pengajuan Baru
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="rounded-xl"
          >
            🔄
          </Button>
        </div>
      </div>

      {/* FILTER TABS */}
      <FilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
        userRole={userRole}
      />

      {/* DAFTAR PENGAJUAN */}
      <Card className="rounded-xl">
        <CardHeader className="border-b">
          <CardTitle>Daftar Pengajuan</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-4xl animate-spin">⏳</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <span className="text-6xl mb-4 opacity-50">📄</span>
              <p className="text-lg">Tidak ada pengajuan</p>
              <p className="text-sm">Mulai dengan membuat pengajuan baru</p>
            </div>
          ) : (
            <SubmissionTable
              submissions={filteredSubmissions}
              onRowClick={handleRowClick}
              userRole={userRole}
            />
          )}
        </CardContent>
      </Card>

      {/* FORM MODAL */}
      <SubmissionForm 
        open={showForm} 
        onClose={() => { 
          setShowForm(false); 
          setEditingSubmission(null); 
        }}
        onSubmit={handleFormSubmit}
        editData={editingSubmission} 
      />

      {/* DETAIL SHEET */}
      <SubmissionDetail
        submission={selectedDetail}
        open={showDetail}
        onClose={handleDetailClose}
        userRole={userRole}
        onEdit={(sub) => {
          setEditingSubmission(sub);
          setShowForm(true);
          setShowDetail(false);
          setSelectedDetail(null);
        }}
        onUpdateSubmission={(id, updates) => {
          setSubmissions(submissions.map(s => s.id === id ? { ...s, ...updates } : s));
        }}
        onRefresh={refetch}
      />

      <Dialog open={showSpBy} onOpenChange={setShowSpBy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📦 Kelompokkan Pengajuan UP</DialogTitle>
            <DialogDescription>
              Pilih pengajuan UP yang akan dikelompokkan dalam satu SPM
            </DialogDescription>
          </DialogHeader>
          <SPByGrouping
            upSubmissions={submissions.filter(s => s.pembayaran === 'UP' && s.status === 'pending_bendahara')}
            onUpdateSubmissions={(ids, updates) => {
              setSubmissions(submissions.map(s => ids.includes(s.id) ? { ...s, ...updates } : s));
            }}
            onRefresh={() => {
              refetch();
              setShowSpBy(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
