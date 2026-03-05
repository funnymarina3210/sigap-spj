import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dashboard Pencairan dengan KPI, Charts, dan Workflow
export default function Dashboard() {
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  // Mock data for demonstration
  const mockStats = {
    totalPengajuan: 45,
    sedangDiproses: 12,
    selesai: 28,
    dikembalikan: 5,
    tingkatSelesai: 62
  };

  const mockSubmissions = [
    {
      id: 'CEK-2603001',
      title: 'Honorarium - Tenaga Ahli',
      submitter: 'Andries Kurniawan, S.E., M.Sc.',
      jenisBelanja: 'Honorarium - Petugas Mitra',
      status: 'pending_ppk',
      statusLabel: 'Menunggu Verifikasi PPK',
      tanggal: '5 Maret 2026'
    }
  ];

  const statusColors: Record<string, string> = {
    pending_ppk: '#f59e0b',
    pending_bendahara: '#06b6d4',
    sent_kppn: '#10b981',
    complete: '#10b981',
    incomplete: '#ef4444'
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
            <p className="text-3xl font-bold">{mockStats.totalPengajuan}</p>
            <p className="text-xs text-muted-foreground mt-2">Tahun {filterTahun}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Sedang Diproses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{mockStats.sedangDiproses}</p>
            <p className="text-xs text-muted-foreground mt-2">Menunggu review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dikembalikan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{mockStats.dikembalikan}</p>
            <p className="text-xs text-muted-foreground mt-2">Perlu revisi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kirim KPPN</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{mockStats.selesai}</p>
            <p className="text-xs text-muted-foreground mt-2">Tahap KPPN</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tingkat Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{mockStats.tingkatSelesai}%</p>
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
              <div className="space-y-4">
                {mockSubmissions.map((submission) => (
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
                        {submission.statusLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Pengaju</p>
                        <p className="font-medium">{submission.submitter}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Jenis Belanja</p>
                        <p className="font-medium">{submission.jenisBelanja}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Tanggal Pengajuan: {submission.tanggal}</p>
                  </div>
                ))}
              </div>
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
                        <div className="bg-orange-500 h-2 rounded" style={{width: '27%'}}/>
                      </div>
                      <span className="text-sm font-medium">{mockStats.sedangDiproses}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Selesai</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded h-2">
                        <div className="bg-green-500 h-2 rounded" style={{width: '62%'}}/>
                      </div>
                      <span className="text-sm font-medium">{mockStats.selesai}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dikembalikan</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded h-2">
                        <div className="bg-red-500 h-2 rounded" style={{width: '11%'}}/>
                      </div>
                      <span className="text-sm font-medium">{mockStats.dikembalikan}</span>
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
                    <span className="text-lg font-bold text-blue-600">0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-sm">Menunggu Review</span>
                    <span className="text-lg font-bold text-orange-600">12</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-sm">Approved</span>
                    <span className="text-lg font-bold text-green-600">28</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-sm">Rejected</span>
                    <span className="text-lg font-bold text-red-600">5</span>
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
                  <p className="text-2xl font-bold mt-2">{mockStats.totalPengajuan}</p>
                  <p className="text-xs text-muted-foreground mt-2">100% dari target</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Selesai</p>
                  <p className="text-2xl font-bold mt-2">{mockStats.selesai}</p>
                  <p className="text-xs text-muted-foreground mt-2">{mockStats.tingkatSelesai}% completion rate</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Rata-rata Waktu Proses</p>
                  <p className="text-2xl font-bold mt-2">3.2</p>
                  <p className="text-xs text-muted-foreground mt-2">Hari per tahap</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Performa Pengaju Terkemuka</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Andries Kurniawan, S.E., M.Sc.</span>
                    <span className="text-sm font-medium">8 pengajuan</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Budi Santoso</span>
                    <span className="text-sm font-medium">6 pengajuan</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Eka Putri</span>
                    <span className="text-sm font-medium">5 pengajuan</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
