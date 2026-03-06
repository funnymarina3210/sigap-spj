import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Submission, SubmissionStatus, UserRole, canCreateSubmission } from '@/types/pencairan';
import { SubmissionForm } from '@/components/pencairan/SubmissionForm';
import { SubmissionTable } from '@/components/pencairan/SubmissionTable';
import { SubmissionDetail } from '@/components/pencairan/SubmissionDetail';
import { FilterTabs } from '@/components/pencairan/FilterTabs';
import { SPByGrouping } from '@/components/pencairan/SPByGrouping';
import { usePencairanData } from '@/hooks/use-pencairan-data';
import { useAuth } from '@/hooks/useAuth';

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
