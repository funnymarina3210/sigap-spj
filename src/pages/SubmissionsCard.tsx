import { useState, useMemo, useEffect } from 'react';
import { SubmissionCard } from '@/components/SubmissionCard';
import { SubmissionDetail } from '@/components/SubmissionDetail';
import { SubmissionForm } from '@/components/SubmissionForm';
import { FilterTabs } from '@/components/FilterTabs';
import { useSubmissionsData } from '@/hooks/useSheetData';
import { Submission, SubmissionStatus, Document, UserRole, generateSubmissionId, getDocumentsByJenisBelanja } from '@/types/submission';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Parse documents string to Document array
function parseDocuments(docString: string, jenisBelanja: string, subJenisBelanja?: string): Document[] {
  const defaultDocs = getDocumentsByJenisBelanja(jenisBelanja, subJenisBelanja);
  
  if (!docString || !docString.trim()) {
    return defaultDocs;
  }
  
  const docNames = docString.split('|').map(d => d.trim().toLowerCase()).filter(Boolean);

  return defaultDocs.map(doc => {
    const docNameLower = doc.name.toLowerCase();
    const isChecked = docNames.some(savedName => {
      return docNameLower.includes(savedName) || savedName.includes(docNameLower) ||
        docNameLower.split(' ')[0] === savedName.split(' ')[0] ||
        savedName.includes(docNameLower.split(' ')[0]) ||
        docNameLower.includes(savedName.split(' ')[0]);
    });
    return {
      ...doc,
      isChecked
    };
  });
}

export default function SubmissionsCard() {
  const { data: sheetSubmissions, isLoading, refetch } = useSubmissionsData();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeFilter, setActiveFilter] = useState<SubmissionStatus | 'all'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  const userRole = (user?.role || 'operator') as UserRole;

  // Convert sheet data to Submission format
  useEffect(() => {
    if (sheetSubmissions.length > 0) {
      const converted: Submission[] = sheetSubmissions.map(item => {
        let submittedDate = new Date();
        const timeStr = item.waktuPengajuan || item.updatedAt || '';
        if (timeStr && timeStr.trim()) {
          const match = timeStr.match(/^(\d{2}):(\d{2}) - (\d{2})\/(\d{2})\/(\d{4})$/);
          if (match) {
            const [, hours, minutes, day, month, year] = match;
            submittedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
          } else {
            const parsed = new Date(timeStr);
            if (!isNaN(parsed.getTime())) {
              submittedDate = parsed;
            }
          }
        }
        
        const fullJenisBelanja = item.jenisBelanja || '';
        let jenisBelanja = fullJenisBelanja;
        let subJenisBelanja = '';
        
        if (fullJenisBelanja.includes(' - ')) {
          const parts = fullJenisBelanja.split(' - ');
          jenisBelanja = parts[0].trim();
          subJenisBelanja = parts.slice(1).join(' - ').trim();
        }
        
        return {
          id: item.id || generateSubmissionId([]),
          title: item.title || 'Pengajuan Baru',
          submitterName: item.submitterName || '',
          jenisBelanja: jenisBelanja,
          subJenisBelanja: subJenisBelanja,
          submittedAt: submittedDate,
          status: (item.status || 'pending_ppk') as SubmissionStatus,
          documents: parseDocuments(item.documents, jenisBelanja, subJenisBelanja),
          notes: item.notes || undefined,
          waktuPengajuan: item.waktuPengajuan || '',
          waktuPpk: item.waktuPpk || '',
          waktuBendahara: item.waktuBendahara || '',
          statusPpk: item.statusPpk || '',
          statusBendahara: item.statusBendahara || '',
          statusKppn: item.statusKppn || ''
        };
      });
      converted.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      setSubmissions(converted);
    } else {
      setSubmissions([]);
    }
  }, [sheetSubmissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      return activeFilter === 'all' || sub.status === activeFilter;
    });
  }, [submissions, activeFilter]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      all: submissions.length,
      pending_ppk: 0,
      pending_bendahara: 0,
      rejected_sm: 0,
      rejected_ppk: 0,
      rejected_bendahara: 0,
      completed: 0
    };
    submissions.forEach(sub => {
      result[sub.status]++;
    });
    return result;
  }, [submissions]);

  const handleUpdateSubmission = (id: string, updates: Partial<Submission>) => {
    setSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, ...updates } : sub));
  };

  const handleFormSubmit = (data: Omit<Submission, 'id' | 'status'>) => {
    if (editingSubmission) {
      handleUpdateSubmission(editingSubmission.id, data);
      setEditingSubmission(null);
    }
    setTimeout(() => refetch(), 1500);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSubmission(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Pengajuan - Card View</h1>
          <p className="text-muted-foreground">Menampilkan pengajuan dalam format kartu</p>
        </div>
        <Button onClick={() => refetch()} size="sm" variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />

      {/* Submissions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredSubmissions.length} dari {submissions.length} pengajuan
              </div>
              {filteredSubmissions.map((submission, index) => (
                <div key={submission.id} className="animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <SubmissionCard submission={submission} onClick={() => setSelectedSubmission(submission)} />
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tidak ada pengajuan</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">Belum ada pengajuan dengan status ini.</p>
            </div>
          )}
        </div>
      )}

      <SubmissionForm open={showForm} onClose={handleFormClose} onSubmit={handleFormSubmit} editData={editingSubmission} />
      <SubmissionDetail 
        submission={selectedSubmission} 
        open={!!selectedSubmission} 
        onClose={() => setSelectedSubmission(null)} 
        onUpdateSubmission={handleUpdateSubmission} 
        userRole={userRole} 
        onRefresh={refetch} 
      />
    </div>
  );
}
