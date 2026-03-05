import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubmissionForm } from '@/components/pencairan/SubmissionForm';
import { usePencairanData } from '@/hooks/use-pencairan-data';
import { Submission, SubmissionStatus, UserRole, canCreateSubmission } from '@/types/pencairan';
import { FileText, Clock, CheckCircle2, XCircle, Plus, RefreshCw, Loader2, FileEdit, AlertCircle, Send, Archive } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const filterConfig = [
  { value: 'all', label: 'Total', icon: FileText, color: 'text-blue-500' },
  { value: 'draft', label: 'Draft', icon: FileEdit, color: 'text-gray-500' },
  { value: 'pending_bendahara', label: 'Bendahara', icon: Clock, color: 'text-indigo-500' },
  { value: 'pending_ppk', label: 'PPK', icon: Clock, color: 'text-orange-500' },
  { value: 'pending_ppspm', label: 'PPSPM', icon: Clock, color: 'text-pink-500' },
  { value: 'sent_kppn', label: 'KPPN', icon: Send, color: 'text-purple-500' },
  { value: 'complete_arsip', label: 'Arsip', icon: Archive, color: 'text-emerald-500' },
];

export default function UsulanPencairan() {
  const { data: sheetSubmissions = [], isLoading, refetch } = usePencairanData();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  const userRole = user?.role as UserRole;
  const showCreateButton = canCreateSubmission(userRole);

  useEffect(() => {
    if (sheetSubmissions.length > 0) {
      const converted: Submission[] = sheetSubmissions.map(item => {
        let submittedDate = item.submittedAt instanceof Date ? item.submittedAt : new Date();
        
        if (isNaN(submittedDate.getTime())) {
          const timeStr = typeof item.waktuPengajuan === 'string' ? item.waktuPengajuan : '';
          if (timeStr) {
            const match = timeStr.match(/^(\d{2}):(\d{2}) - (\d{2})\/(\d{2})\/(\d{4})$/);
            if (match) {
              const [, hours, minutes, day, month, year] = match;
              submittedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
            }
          }
          if (isNaN(submittedDate.getTime())) submittedDate = new Date();
        }
        
        const docsInput = Array.isArray(item.documents) 
          ? item.documents 
          : typeof item.documents === 'string' 
            ? (item.documents as string).split('|').map((name: string) => ({
                type: name.toLowerCase().replace(/\s+/g, '_'),
                name: name.trim(),
                isRequired: true,
                isChecked: true,
              }))
            : [];
        
        return {
          ...item,
          submittedAt: submittedDate,
          documents: docsInput,
        };
      });
      
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
    const result: Record<string, number> = {
      all: submissions.length,
      draft: submissions.filter(s => s.status === 'draft').length,
      pending_bendahara: submissions.filter(s => s.status === 'pending_bendahara').length,
      pending_ppk: submissions.filter(s => s.status === 'pending_ppk').length,
      pending_ppspm: submissions.filter(s => s.status === 'pending_ppspm').length,
      sent_kppn: submissions.filter(s => s.status === 'sent_kppn').length,
      complete_arsip: submissions.filter(s => s.status === 'complete_arsip').length,
    };
    return result;
  }, [submissions]);

  const handleFormSubmit = () => {
    setEditingSubmission(null);
    setShowForm(false);
    setTimeout(() => refetch(), 1500);
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
            <Button onClick={() => { setEditingSubmission(null); setShowForm(true); }} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Buat Pengajuan Baru
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            className="rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* FILTER TABS */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList className="flex flex-wrap w-full bg-muted/60 p-1 rounded-xl h-auto gap-1">
          {filterConfig.map((filter) => {
            const Icon = filter.icon;
            const countValue = counts[filter.value] || 0;

            return (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg"
              >
                <Icon className={`h-4 w-4 ${filter.color}`} />
                <span>{filter.label}</span>
                <span className="bg-primary/10 px-2 py-0.5 rounded-full text-xs font-bold text-primary ml-1">
                  {countValue}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* DAFTAR PENGAJUAN */}
      <Card className="rounded-xl">
        <CardHeader className="border-b">
          <CardTitle>Daftar Pengajuan</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg">Tidak ada pengajuan</p>
              <p className="text-sm">Mulai dengan membuat pengajuan baru</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => {
                const statusColors: Record<SubmissionStatus, string> = {
                  draft: 'bg-gray-50 border-gray-200',
                  pending_bendahara: 'bg-indigo-50 border-indigo-200',
                  pending_ppk: 'bg-orange-50 border-orange-200',
                  pending_ppspm: 'bg-pink-50 border-pink-200',
                  sent_kppn: 'bg-purple-50 border-purple-200',
                  complete_arsip: 'bg-emerald-50 border-emerald-200',
                  incomplete_sm: 'bg-red-50 border-red-200',
                  incomplete_bendahara: 'bg-red-50 border-red-200',
                  incomplete_ppk: 'bg-red-50 border-red-200',
                  incomplete_ppspm: 'bg-red-50 border-red-200',
                  incomplete_kppn: 'bg-red-50 border-red-200',
                };

                const statusLabels: Record<SubmissionStatus, string> = {
                  draft: 'Draft',
                  pending_bendahara: 'Menunggu Bendahara',
                  pending_ppk: 'Menunggu PPK',
                  pending_ppspm: 'Menunggu PPSPM',
                  sent_kppn: 'Dikirim ke KPPN',
                  complete_arsip: 'Selesai Arsip',
                  incomplete_sm: 'Dikembalikan',
                  incomplete_bendahara: 'Dikembalikan',
                  incomplete_ppk: 'Dikembalikan',
                  incomplete_ppspm: 'Dikembalikan',
                  incomplete_kppn: 'Dikembalikan',
                };

                return (
                  <div key={submission.id} className={`p-4 rounded-lg border ${statusColors[submission.status] || 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold truncate">{submission.id}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-background border">
                            {statusLabels[submission.status]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{submission.title}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Pengaju: {submission.submitterName}</span>
                          <span>Jenis: {submission.jenisBelanja}</span>
                          {submission.waktuPengajuan && (
                            <span>Waktu: {submission.waktuPengajuan}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSubmission(submission);
                            setShowForm(true);
                          }}
                          className="rounded-lg"
                        >
                          <FileEdit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
    </div>
  );
}
