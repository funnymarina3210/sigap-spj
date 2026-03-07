import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { FilterTabs } from '@/components/FilterTabs';
import { SubmissionCard } from '@/components/SubmissionCard';
import { SubmissionDetail } from '@/components/SubmissionDetail';
import { SubmissionForm } from '@/components/SubmissionForm';
import { SubmissionTable } from '@/components/SubmissionTable';
import { useSubmissionsData } from '@/hooks/useSheetData';
import { Submission, SubmissionStatus, Document, DOCUMENT_LABELS, UserRole, canCreateSubmission, generateSubmissionId, getRelevantTimestamp, getDocumentsByJenisBelanja } from '@/types/submission';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle2, XCircle, Plus, LayoutGrid, TableIcon, Sparkles, RefreshCw, Loader2, Search, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Parse documents string to Document array
function parseDocuments(docString: string, jenisBelanja: string, subJenisBelanja?: string): Document[] {
  // Ambil dokumen default berdasarkan jenis dan sub-jenis belanja
  const defaultDocs = getDocumentsByJenisBelanja(jenisBelanja, subJenisBelanja);
  
  if (!docString || !docString.trim()) {
    // Jika tidak ada dokumen string, kembalikan default dengan isChecked = false
    return defaultDocs;
  }
  
  const docNames = docString.split('|').map(d => d.trim().toLowerCase()).filter(Boolean);

  // Update isChecked berdasarkan dokumen yang ada di string
  return defaultDocs.map(doc => {
    // Check if document name matches any in the list
    const docNameLower = doc.name.toLowerCase();
    const isChecked = docNames.some(savedName => {
      // Exact match or partial match
      return docNameLower.includes(savedName) || savedName.includes(docNameLower) ||
        // Match first word
        docNameLower.split(' ')[0] === savedName.split(' ')[0] ||
        // Match key parts
        savedName.includes(docNameLower.split(' ')[0]) ||
        docNameLower.includes(savedName.split(' ')[0]);
    });
    return {
      ...doc,
      isChecked
    };
  });
}
const months = [{
  value: 'all',
  label: 'Semua Bulan'
}, {
  value: '1',
  label: 'Januari'
}, {
  value: '2',
  label: 'Februari'
}, {
  value: '3',
  label: 'Maret'
}, {
  value: '4',
  label: 'April'
}, {
  value: '5',
  label: 'Mei'
}, {
  value: '6',
  label: 'Juni'
}, {
  value: '7',
  label: 'Juli'
}, {
  value: '8',
  label: 'Agustus'
}, {
  value: '9',
  label: 'September'
}, {
  value: '10',
  label: 'Oktober'
}, {
  value: '11',
  label: 'November'
}, {
  value: '12',
  label: 'Desember'
}];
const years = Array.from({
  length: 5
}, (_, i) => 2026 + i); // 2026-2030

export default function Index() {
  const {
    data: sheetSubmissions,
    isLoading,
    refetch
  } = useSubmissionsData();
  const {
    user,
    logout
  } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<SubmissionStatus | 'all'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table'); // Default to table view

  const userRole: UserRole = user?.role as UserRole || 'user';
  const showCreateButton = canCreateSubmission(userRole);

  // Convert sheet data to Submission format and sort by newest
  useEffect(() => {
    if (sheetSubmissions.length > 0) {
      const converted: Submission[] = sheetSubmissions.map(item => {
        // Parse date safely - handle format "HH:mm - DD/MM/YYYY" or ISO
        let submittedDate = new Date();
        const timeStr = item.waktuPengajuan || item.updatedAt || '';
        if (timeStr && timeStr.trim()) {
          // Try parsing "HH:mm - DD/MM/YYYY" format
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
        
        // Parse jenisBelanja: format "Honorarium - Tim Pelaksana" -> jenisBelanja + subJenisBelanja
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
      // Sort by newest first
      converted.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      setSubmissions(converted);
    } else {
      setSubmissions([]);
    }
  }, [sheetSubmissions]);
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // Filter berdasarkan search query
      const matchesSearch = sub.title.toLowerCase().includes(searchQuery.toLowerCase()) || sub.id.toLowerCase().includes(searchQuery.toLowerCase()) || sub.submitterName.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter berdasarkan bulan
      const submissionMonth = (sub.submittedAt.getMonth() + 1).toString();
      const matchesMonth = selectedMonth === 'all' || submissionMonth === selectedMonth;

      // Filter berdasarkan tahun
      const submissionYear = sub.submittedAt.getFullYear().toString();
      const matchesYear = selectedYear === 'all' || submissionYear === selectedYear;

      // Filter berdasarkan status
      const matchesFilter = activeFilter === 'all' || sub.status === activeFilter;
      return matchesSearch && matchesMonth && matchesYear && matchesFilter;
    });
  }, [submissions, searchQuery, selectedMonth, selectedYear, activeFilter]);
  const counts = useMemo(() => {
    const result: Record<SubmissionStatus | 'all', number> = {
      all: submissions.length,
      pending_ppk: 0,
      pending_bendahara: 0,
      incomplete_sm: 0,
      incomplete_ppk: 0,
      incomplete_bendahara: 0,
      sent_kppn: 0
    };
    submissions.forEach(sub => {
      result[sub.status]++;
    });
    return result;
  }, [submissions]);
  const handleUpdateSubmission = (id: string, updates: Partial<Submission>) => {
    setSubmissions(prev => prev.map(sub => sub.id === id ? {
      ...sub,
      ...updates
    } : sub));
  };
  const handleCreateSubmission = (data: Omit<Submission, 'id' | 'status'>) => {
    const newId = generateSubmissionId(submissions.map(s => s.id));
    const newSubmission: Submission = {
      ...data,
      id: newId,
      status: 'pending_ppk'
    };
    setSubmissions(prev => [newSubmission, ...prev]);
  };
  const handleEditSubmission = (submission: Submission) => {
    setEditingSubmission(submission);
    setShowForm(true);
  };
  const handleFormSubmit = (data: Omit<Submission, 'id' | 'status'>) => {
    if (editingSubmission) {
      handleUpdateSubmission(editingSubmission.id, data);
      setEditingSubmission(null);
    } else {
      handleCreateSubmission(data);
    }
    // Refresh data from sheet
    setTimeout(() => refetch(), 1500);
  };
  const handleFormClose = () => {
    setShowForm(false);
    setEditingSubmission(null);
  };
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedYear('all');
    setActiveFilter('all');
  };
  return <div className="min-h-screen bg-background">
      {/* Header tanpa search props */}
      <Header user={user} onLogout={logout} />

      <main className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl gradient-hero p-8 md:p-10 text-primary-foreground shadow-elevated animate-fade-in overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Sistem Monitoring Pengajuan
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
              Selamat Datang, {user?.nama || 'User'}
            </h1>
            <p className="text-primary-foreground/80 max-w-2xl text-lg">
              Sistem Monitoring Pengajuan Administrasi - BPS Kabupaten Majalengka. 
              Pantau status pengajuan dari SM hingga KPPN dengan mudah dan efisien.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-slide-up" style={{
        animationDelay: '100ms'
      }}>
          <StatCard title="Total Pengajuan" value={counts.all} icon={FileText} variant="primary" />
          <StatCard title="Menunggu PPK" value={counts.pending_ppk} icon={Clock} variant="warning" />
          <StatCard title="Menunggu Bendahara" value={counts.pending_bendahara} icon={Clock} variant="primary" />
          <StatCard title="Dikembalikan" value={counts.incomplete_sm + counts.incomplete_ppk} icon={XCircle} variant="danger" />
          <StatCard title="Kirim KPPN" value={counts.sent_kppn} icon={CheckCircle2} variant="success" className="col-span-2 md:col-span-1" />
        </div>

        {/* Filter and Submissions */}
        <div className="space-y-6 animate-slide-up" style={{
        animationDelay: '200ms'
      }}>
          {/* Header Section - Baris 1 */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-foreground">
                Daftar Pengajuan
              </h2>
              {showCreateButton && <Button onClick={() => setShowForm(true)} size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Pengajuan
                </Button>}
            </div>
            
            {/* View Mode Toggle - Pindah ke kanan */}
            <div className="flex items-center gap-4">
              <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'card' | 'table')}>
                <TabsList className="h-10 p-1 rounded-xl bg-secondary/50 border border-border/30">
                  <TabsTrigger value="card" className="px-3 rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Card</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="px-3 rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Table</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button onClick={() => refetch()} size="sm" variant="outline" className="rounded-xl h-10" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Search and Filter Section - Baris 2 */}
          <div className="space-y-4">
            {/* Search and Date Filters Card */}
            
            
            {/* Status Filter Tabs */}
            <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />
          </div>

          {/* Submissions List */}
          {isLoading ? <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div> : viewMode === 'card' ? <div className="grid gap-4">
              {filteredSubmissions.length > 0 ? <>
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {filteredSubmissions.length} dari {submissions.length} pengajuan
                  </div>
                  {filteredSubmissions.map((submission, index) => <div key={submission.id} className="animate-scale-in" style={{
              animationDelay: `${index * 50}ms`
            }}>
                      <SubmissionCard submission={submission} onClick={() => setSelectedSubmission(submission)} />
                    </div>)}
                </> : <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Tidak ada pengajuan
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {searchQuery || selectedMonth !== 'all' || selectedYear !== 'all' ? 'Tidak ditemukan pengajuan yang sesuai dengan filter.' : 'Belum ada pengajuan dengan status ini.'}
                  </p>
                  {(searchQuery || selectedMonth !== 'all' || selectedYear !== 'all') && <Button onClick={clearFilters} variant="outline" className="mt-4">
                      Reset Semua Filter
                    </Button>}
                </div>}
            </div> : <>
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredSubmissions.length} dari {submissions.length} pengajuan
              </div>
              <SubmissionTable submissions={filteredSubmissions} onView={setSelectedSubmission} onEdit={handleEditSubmission} userRole={userRole} />
            </>}
        </div>
      </main>

      <SubmissionForm open={showForm} onClose={handleFormClose} onSubmit={handleFormSubmit} editData={editingSubmission} />

      <SubmissionDetail submission={selectedSubmission} open={!!selectedSubmission} onClose={() => setSelectedSubmission(null)} onUpdateSubmission={handleUpdateSubmission} userRole={userRole} onRefresh={refetch} />
    </div>;
}