import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePencairanData } from "@/hooks/use-pencairan-data";
import { SubmissionStatus } from "@/types/pencairan";

// Dashboard Pencairan dengan KPI, Charts, dan Workflow
export default function Dashboard() {
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  // Fetch real data from Supabase
  const { data: submissions = [], isLoading, error } = usePencairanData();

  // Filter submissions by year
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const submissionYear = new Date(submission.submittedAt).getFullYear().toString();
      return submissionYear === filterTahun;
    });
  }, [submissions, filterTahun]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const total = filteredSubmissions.length;
    const sedangDiproses = filteredSubmissions.filter(s => 
      ['pending_bendahara', 'pending_ppk', 'pending_ppspm'].includes(s.status)
    ).length;
    const selesai = filteredSubmissions.filter(s => 
      s.status === 'complete_arsip'
    ).length;
    const dikembalikan = filteredSubmissions.filter(s => 
      s.status?.startsWith('incomplete_')
    ).length;
    const tingkatSelesai = total > 0 ? Math.round((selesai / total) * 100) : 0;

    return {
      totalPengajuan: total,
      sedangDiproses,
      selesai,
      dikembalikan,
      tingkatSelesai
    };
  }, [filteredSubmissions]);

  const statusColors: Record<string, string> = {
    pending_ppk: '#f59e0b',
    pending_bendahara: '#06b6d4',
    pending_ppspm: '#8b5cf6',
    sent_kppn: '#10b981',
    complete_arsip: '#10b981',
    incomplete_sm: '#ef4444',
    incomplete_bendahara: '#ef4444',
    incomplete_ppk: '#ef4444',
    incomplete_ppspm: '#ef4444',
    incomplete_kppn: '#ef4444',
    draft: '#6b7280'
  };

  // Status label mapping
  const getStatusLabel = (status: SubmissionStatus) => {
    const labels: Record<SubmissionStatus, string> = {
      draft: 'Draft',
      pending_bendahara: 'Menunggu Bendahara',
      pending_ppk: 'Menunggu PPK',
      pending_ppspm: 'Menunggu PPSPM',
      sent_kppn: 'Dikirim ke KPPN',
      complete_arsip: 'Selesai',
      incomplete_sm: 'Ditolak SM',
      incomplete_bendahara: 'Ditolak Bendahara',
      incomplete_ppk: 'Ditolak PPK',
      incomplete_ppspm: 'Ditolak PPSPM',
      incomplete_kppn: 'Ditolak KPPN'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Pencairan</h1>
          <p className="text-muted-foreground mt-1">Ringkasan statistik pengajuan pencairan dana</p>
        </div>
        <Select value={filterTahun} onValueChange={setFilterTahun}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? '-' : stats.totalPengajuan}</p>
            <p className="text-xs text-muted-foreground mt-2">Tahun {filterTahun}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Sedang Diproses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{isLoading ? '-' : stats.sedangDiproses}</p>
            <p className="text-xs text-muted-foreground mt-2">Menunggu review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dikembalikan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{isLoading ? '-' : stats.dikembalikan}</p>
            <p className="text-xs text-muted-foreground mt-2">Perlu revisi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kirim KPPN</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{isLoading ? '-' : stats.selesai}</p>
            <p className="text-xs text-muted-foreground mt-2">Tahap KPPN</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tingkat Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{isLoading ? '-' : stats.tingkatSelesai}%</p>
            <p className="text-xs text-muted-foreground mt-2">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Daftar Pengajuan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengajuan Terbaru</CardTitle>
              <CardDescription>Daftar pengajuan yang sedang diproses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Gagal memuat data. Silakan coba lagi.</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Tidak ada pengajuan untuk tahun {filterTahun}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.slice(0, 10).map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm font-medium">{submission.id}</p>
                          <p className="text-sm text-foreground mt-1">{submission.title}</p>
                        </div>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: statusColors[submission.status] || '#6b7280' }}
                        >
                          {getStatusLabel(submission.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Pengaju</p>
                          <p className="font-medium">{submission.submitterName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Jenis Belanja</p>
                          <p className="font-medium">{submission.jenisBelanja}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Tanggal Pengajuan: {new Date(submission.submittedAt).toLocaleDateString('id-ID', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sedang Diproses</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded" 
                          style={{
                            width: stats.totalPengajuan > 0 
                              ? `${(stats.sedangDiproses / stats.totalPengajuan) * 100}%` 
                              : '0%'
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.sedangDiproses}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Selesai</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded h-2">
                        <div 
                          className="bg-green-500 h-2 rounded" 
                          style={{
                            width: stats.totalPengajuan > 0 
                              ? `${(stats.selesai / stats.totalPengajuan) * 100}%` 
                              : '0%'
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.selesai}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dikembalikan</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded h-2">
                        <div 
                          className="bg-red-500 h-2 rounded" 
                          style={{
                            width: stats.totalPengajuan > 0 
                              ? `${(stats.dikembalikan / stats.totalPengajuan) * 100}%` 
                              : '0%'
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.dikembalikan}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Pengajuan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-sm">Draft</span>
                    <span className="text-lg font-bold text-blue-600">
                      {filteredSubmissions.filter(s => s.status === 'draft').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-sm">Menunggu Review</span>
                    <span className="text-lg font-bold text-orange-600">
                      {stats.sedangDiproses}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-sm">Approved</span>
                    <span className="text-lg font-bold text-green-600">
                      {stats.selesai}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-sm">Rejected</span>
                    <span className="text-lg font-bold text-red-600">
                      {stats.dikembalikan}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Statistik</CardTitle>
               <CardDescription>Statistik pengajuan untuk tahun {filterTahun}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Pengajuan</p>
                  <p className="text-2xl font-bold mt-2">{stats.totalPengajuan}</p>
                  <p className="text-xs text-muted-foreground mt-2">100% dari target</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Selesai</p>
                  <p className="text-2xl font-bold mt-2">{stats.selesai}</p>
                  <p className="text-xs text-muted-foreground mt-2">{stats.tingkatSelesai}% completion rate</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Rata-rata Waktu Proses</p>
                  <p className="text-2xl font-bold mt-2">-</p>
                  <p className="text-xs text-muted-foreground mt-2">Hari per tahap</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Pengaju Terkemuka</h3>
                {isLoading ? (
                  <p className="text-muted-foreground">Memuat data...</p>
                ) : (
                  <div className="space-y-2">
                    {useMemo(() => {
                      // Count submissions by submitter
                      const submitterCounts = filteredSubmissions.reduce((acc, sub) => {
                        acc[sub.submitterName] = (acc[sub.submitterName] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      // Sort and get top 5
                      return Object.entries(submitterCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([name, count]) => (
                          <div key={name} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{name}</span>
                            <span className="text-sm font-medium">{count} pengajuan</span>
                          </div>
                        ));
                    }, [filteredSubmissions])}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
