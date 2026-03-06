import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Submission, SubmissionStatus, UserRole, canCreateSubmission, PaymentType, formatDateTime } from '@/types/pencairan';
import { SubmissionForm } from '@/components/pencairan/SubmissionForm';
import { SubmissionTable } from '@/components/pencairan/SubmissionTable';
import { SubmissionDetail } from '@/components/pencairan/SubmissionDetail';
import { FilterTabs } from '@/components/pencairan/FilterTabs';
import { SPByGrouping } from '@/components/pencairan/SPByGrouping';
import { usePencairanData } from '@/hooks/use-pencairan-data';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getNextStatus } from '@/lib/workflow';

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
    
    if (activeFilter !== 'all') {
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
  }, [submissions, activeFilter]);

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

    const result: Record<string, number> = {
      all: submissions.length,
    };

    allStatuses.forEach(status => {
      result[status] = submissions.filter(s => s.status === status).length;
    });

    return result;
  }, [submissions]);

  const handleFormSubmit = () => {
    setEditingSubmission(null);
    setShowForm(false);
    setTimeout(() => refetch(), 1500);
  };

  const handleRowClick = (submission: Submission) => {
    setSelectedDetail(submission);
    setShowDetail(true);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedDetail(null);
  };

  const handleApprove = async (notes?: string, paymentType?: PaymentType, spmNumber?: string) => {
    if (!selectedDetail || !user) throw new Error('Submission or user not found');

    // Get next status based on current status and user role
    const nextStatus = getNextStatus(selectedDetail.status, userRole, 'approve');
    if (!nextStatus) throw new Error('Cannot approve at current stage or permission denied');

    // Build the update object
    const updateData: Record<string, any> = {
      id: selectedDetail.id,
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
      ...selectedDetail,
      status: nextStatus,
      updatedAt: new Date(),
    };

    // Add role-specific timestamp
    if (userRole === 'Bendahara') {
      updatedSubmission.waktuBendahara = formatDateTime(new Date());
      updatedSubmission.statusBendahara = notes || '';
    } else if (userRole === 'Pejabat Pembuat Komitmen') {
      updatedSubmission.waktuPPK = formatDateTime(new Date());
      updatedSubmission.statusPPK = notes || '';
    } else if (userRole === 'Pejabat Penandatangan Surat Perintah Membayar') {
      updatedSubmission.waktuPPSPM = formatDateTime(new Date());
      updatedSubmission.statusPPSPM = notes || '';
    } else if (userRole === 'KPPN') {
      updatedSubmission.waktuArsip = formatDateTime(new Date());
      updatedSubmission.statusArsip = notes || '';
    }

    setSubmissions(submissions.map(s => s.id === selectedDetail.id ? updatedSubmission : s));
    setShowDetail(false);
    setSelectedDetail(null);
  };

  const handleReject = async (reason: string) => {
    if (!selectedDetail || !user) throw new Error('Submission or user not found');

    // Determine rejection status based on current status
    let rejectStatus: SubmissionStatus;
    switch (selectedDetail.status) {
      case 'pending_bendahara':
        rejectStatus = 'rejected_sm';
        break;
      case 'pending_ppk':
        rejectStatus = 'rejected_bendahara';
        break;
      case 'pending_ppspm':
        rejectStatus = 'rejected_ppk';
        break;
      case 'pending_kppn':
        rejectStatus = 'rejected_ppspm';
        break;
      case 'pending_arsip':
        rejectStatus = 'rejected_kppn';
        break;
      default:
        throw new Error('Cannot reject submission at current status');
    }

    // Call the pencairan-update Supabase function
    const { data, error } = await supabase.functions.invoke('pencairan-update', {
      body: {
        id: selectedDetail.id,
        status: rejectStatus,
        actor: userRole,
        action: 'reject',
        catatan: reason,
      },
    });

    if (error) throw new Error(error.message || 'Failed to reject submission');

    // Update local state
    const updatedSubmission: Submission = {
      ...selectedDetail,
      status: rejectStatus,
      updatedAt: new Date(),
    };

    setSubmissions(submissions.map(s => s.id === selectedDetail.id ? updatedSubmission : s));
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
          {userRole === 'Bendahara' && (
            <Button
              variant="outline"
              onClick={() => setShowSpBy(true)}
              className="rounded-xl"
            >
              📦 Kelompok UP
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
              itemsPerPage={10}
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
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* SPBy GROUPING */}
      <SPByGrouping
        open={showSpBy}
        onClose={() => setShowSpBy(false)}
        onSubmit={async () => {
          setTimeout(() => refetch(), 1000);
        }}
        submissions={submissions}
      />
    </div>
  );
}
