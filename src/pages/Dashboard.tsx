import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePencairanData } from "@/hooks/use-pencairan-data";
import { Submission, STATUS_LABELS, SubmissionStatus, JENIS_BELANJA_OPTIONS } from "@/types/pencairan";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Users, Calendar, FileEdit, ArrowRightCircle, RotateCcw, Timer } from "lucide-react";
import { TooltipProps } from "recharts";
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  draft: '#6366f1',
  submitted_sm: '#94a3b8',
  pending_bendahara: '#06b6d4',
  pending_ppk: '#f59e0b',
  pending_ppspm: '#8b5cf6',
  pending_kppn: '#14b8a6',
  pending_arsip: '#06b6d4',
  completed: '#10b981',
  rejected_sm: '#ef4444',
  rejected_bendahara: '#be123c',
  rejected_ppk: '#f97316',
  rejected_ppspm: '#dc2626',
  rejected_kppn: '#7c3aed',
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'info' | 'danger' | 'success' | 'secondary';
  trend?: { value: number; label: string };
}

function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', trend }: StatCardProps) {
  const variantClasses = {
    default: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-300 dark:border-blue-800',
    warning: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200 dark:from-amber-950/50 dark:to-amber-900/50 dark:text-amber-300 dark:border-amber-800',
    info: 'bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200 dark:from-cyan-950/50 dark:to-cyan-900/50 dark:text-cyan-300 dark:border-cyan-800',
    danger: 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200 dark:from-red-950/50 dark:to-red-900/50 dark:text-red-300 dark:border-red-800',
    success: 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 dark:from-green-950/50 dark:to-green-900/50 dark:text-green-300 dark:border-green-800',
    secondary: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200 dark:from-purple-950/50 dark:to-purple-900/50 dark:text-purple-300 dark:border-purple-800',
  };

  return (
    <Card className={`border ${variantClasses[variant]} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
            {trend && (
              <p className={`text-xs flex items-center gap-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-white/50 dark:bg-white/10">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Parse date from custom format "HH:mm - dd/MM/yyyy"
function parseCustomDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  try {
    const [timePart, datePart] = dateStr.split(' - ');
    if (!timePart || !datePart) return null;
    const [hours, minutes] = timePart.split(':').map(Number);
    const [day, month, year] = datePart.split('/').map(Number);
    const fullYear = year < 100 ? 2000 + year : year;
    return new Date(fullYear, month - 1, day, hours, minutes);
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());
  const { data: submissions = [], isLoading } = usePencairanData();

  // Filter submissions by year
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const date = sub.submittedAt instanceof Date ? sub.submittedAt : parseCustomDate(sub.waktuPengajuan || '');
      return date && date.getFullYear().toString() === filterTahun;
    });
  }, [submissions, filterTahun]);

  // Calculate statistics
  const stats = useMemo(() => {
    const counts = {
      total: filteredSubmissions.length,
      draft: 0,
      submitted_sm: 0,
      pending_bendahara: 0,
      pending_ppk: 0,
      pending_ppspm: 0,
      pending_kppn: 0,
      pending_arsip: 0,
      completed: 0,
      rejected_sm: 0,
      rejected_bendahara: 0,
      rejected_ppk: 0,
      rejected_ppspm: 0,
      rejected_kppn: 0,
    };

    filteredSubmissions.forEach(sub => {
      if (sub.status in counts) {
        counts[sub.status as keyof typeof counts]++;
      }
    });

    const inProcess = counts.pending_bendahara + counts.pending_ppk + counts.pending_ppspm + counts.pending_kppn + counts.pending_arsip;
    const rejected = counts.rejected_sm + counts.rejected_bendahara + counts.rejected_ppk + counts.rejected_ppspm + counts.rejected_kppn;
    const successRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

    return { ...counts, inProcess, rejected, successRate };
  }, [filteredSubmissions]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredSubmissions.forEach(sub => {
      const label = STATUS_LABELS[sub.status] || sub.status;
      distribution[label] = (distribution[label] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredSubmissions]);

  // Jenis Belanja distribution
  const jenisBelanjaDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredSubmissions.forEach(sub => {
      const jenis = sub.jenisBelanja || 'Lainnya';
      distribution[jenis] = (distribution[jenis] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSubmissions]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = months.map((name) => ({
      name,
      pengajuan: 0,
      selesai: 0,
      ditolak: 0,
    }));

    filteredSubmissions.forEach(sub => {
      const date = sub.submittedAt instanceof Date ? sub.submittedAt : parseCustomDate(sub.waktuPengajuan || '');
      if (date) {
        const monthIndex = date.getMonth();
        data[monthIndex].pengajuan++;
        if (sub.status === 'completed') {
          data[monthIndex].selesai++;
        } else if (sub.status.startsWith('rejected_')) {
          data[monthIndex].ditolak++;
        }
      }
    });

    return data;
  }, [filteredSubmissions]);

  // Top submitters
  const topSubmitters = useMemo(() => {
    const submitterCounts: Record<string, { total: number; completed: number }> = {};
    filteredSubmissions.forEach(sub => {
      const submitter = sub.submitterName || 'Unknown';
      if (!submitterCounts[submitter]) {
        submitterCounts[submitter] = { total: 0, completed: 0 };
      }
      submitterCounts[submitter].total++;
      if (sub.status === 'completed') {
        submitterCounts[submitter].completed++;
      }
    });

    return Object.entries(submitterCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredSubmissions]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return [...filteredSubmissions]
      .sort((a, b) => {
        const dateA = parseCustomDate(a.updatedAtString || '') || a.submittedAt;
        const dateB = parseCustomDate(b.updatedAtString || '') || b.submittedAt;
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      })
      .slice(0, 5);
  }, [filteredSubmissions]);

  // Workflow funnel data
  const workflowFunnel = useMemo(() => {
    return [
      { name: 'Draft', value: stats.draft + stats.submitted_sm, color: '#6366f1' },
      { name: 'Periksa Bendahara', value: stats.pending_bendahara, color: '#06b6d4' },
      { name: 'Periksa PPK', value: stats.pending_ppk, color: '#f59e0b' },
      { name: 'Periksa PPSPM', value: stats.pending_ppspm, color: '#8b5cf6' },
      { name: 'Kirim KPPN', value: stats.pending_kppn, color: '#14b8a6' },
      { name: 'Selesai', value: stats.completed, color: '#10b981' },
    ];
  }, [stats]);

  // Queue analysis
  const queueAnalysis = useMemo(() => {
    return [
      { name: 'Draft SM', count: stats.draft + stats.submitted_sm, color: '#6366f1' },
      { name: 'Bendahara', count: stats.pending_bendahara, color: '#06b6d4' },
      { name: 'PPK', count: stats.pending_ppk, color: '#f59e0b' },
      { name: 'PPSPM', count: stats.pending_ppspm, color: '#8b5cf6' },
      { name: 'KPPN', count: stats.pending_kppn, color: '#14b8a6' },
      { name: 'Arsip', count: stats.completed, color: '#10b981' },
    ];
  }, [stats]);

  // Average total processing time (SM to KPPN/Arsip)
  const averageTotalTime = useMemo(() => {
    const totalTimes: number[] = [];
    filteredSubmissions.forEach(sub => {
      const waktuSM = parseCustomDate(sub.waktuPengajuan || '');
      const waktuEnd = parseCustomDate(sub.waktuKppn || '') || parseCustomDate(sub.waktuArsip || '');
      
      if (waktuSM && waktuEnd) {
        const diffHours = (waktuEnd.getTime() - waktuSM.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0) totalTimes.push(diffHours);
      }
    });
    
    if (totalTimes.length === 0) return { avg: 0, display: '-', count: 0 };
    const avg = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
    
    const formatTime = (hours: number) => {
      if (hours < 24) return `${Math.round(hours)} jam`;
      return `${(hours / 24).toFixed(1)} hari`;
    };
    
    return { avg, display: formatTime(avg), count: totalTimes.length };
  }, [filteredSubmissions]);

  // Average processing time between stages
  const processingTimeData = useMemo(() => {
    const timeDiffs = {
      smToBendahara: [] as number[],
      bendaharaToPpk: [] as number[],
      ppkToPpspm: [] as number[],
      ppspmToKppn: [] as number[],
    };

    filteredSubmissions.forEach(sub => {
      const waktuSM = parseCustomDate(sub.waktuPengajuan || '');
      const waktuBendahara = parseCustomDate(sub.waktuBendahara || '');
      const waktuPPK = parseCustomDate(sub.waktuPpk || '');
      const waktuPPSPM = parseCustomDate(sub.waktuPPSPM || '');
      const waktuKppn = parseCustomDate(sub.waktuKppn || '');

      if (waktuSM && waktuBendahara) {
        const diff = (waktuBendahara.getTime() - waktuSM.getTime()) / (1000 * 60 * 60);
        if (diff > 0) timeDiffs.smToBendahara.push(diff);
      }
      if (waktuBendahara && waktuPPK) {
        const diff = (waktuPPK.getTime() - waktuBendahara.getTime()) / (1000 * 60 * 60);
        if (diff > 0) timeDiffs.bendaharaToPpk.push(diff);
      }
      if (waktuPPK && waktuPPSPM) {
        const diff = (waktuPPSPM.getTime() - waktuPPK.getTime()) / (1000 * 60 * 60);
        if (diff > 0) timeDiffs.ppkToPpspm.push(diff);
      }
      if (waktuPPSPM && waktuKppn) {
        const diff = (waktuKppn.getTime() - waktuPPSPM.getTime()) / (1000 * 60 * 60);
        if (diff > 0) timeDiffs.ppspmToKppn.push(diff);
      }
    });

    const calcAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const formatTime = (hours: number) => {
      if (hours < 1) return `${Math.round(hours * 60)} menit`;
      if (hours < 24) return `${hours.toFixed(1)} jam`;
      return `${(hours / 24).toFixed(1)} hari`;
    };

    // Color based on efficiency: green ≤2d, yellow 3-5d, red >5d
    const getColor = (hours: number) => {
      const days = hours / 24;
      if (days <= 2) return '#10b981';
      if (days <= 5) return '#f59e0b';
      return '#ef4444';
    };

    const avgSm = calcAvg(timeDiffs.smToBendahara);
    const avgBend = calcAvg(timeDiffs.bendaharaToPpk);
    const avgPpk = calcAvg(timeDiffs.ppkToPpspm);
    const avgPpspm = calcAvg(timeDiffs.ppspmToKppn);

    return [
      { stage: 'SM → Bendahara', hours: parseFloat(avgSm.toFixed(1)), displayTime: formatTime(avgSm), count: timeDiffs.smToBendahara.length, color: getColor(avgSm) },
      { stage: 'Bendahara → PPK', hours: parseFloat(avgBend.toFixed(1)), displayTime: formatTime(avgBend), count: timeDiffs.bendaharaToPpk.length, color: getColor(avgBend) },
      { stage: 'PPK → PPSPM', hours: parseFloat(avgPpk.toFixed(1)), displayTime: formatTime(avgPpk), count: timeDiffs.ppkToPpspm.length, color: getColor(avgPpk) },
      { stage: 'PPSPM → Arsip', hours: parseFloat(avgPpspm.toFixed(1)), displayTime: formatTime(avgPpspm), count: timeDiffs.ppspmToKppn.length, color: getColor(avgPpspm) },
    ];
  }, [filteredSubmissions]);

  const processingTimeDataWithTotal = useMemo(() => {
    const totalDays = averageTotalTime.avg / 24;
    const getColor = (days: number) => {
      if (days <= 2) return '#10b981';
      if (days <= 5) return '#f59e0b';
      return '#ef4444';
    };
    return [
      ...processingTimeData,
      {
        stage: 'Rata-rata (SM → Arsip)',
        hours: parseFloat(totalDays.toFixed(1)),
        displayTime: averageTotalTime.display,
        count: averageTotalTime.count,
        color: getColor(totalDays),
      }
    ];
  }, [processingTimeData, averageTotalTime]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-4xl animate-spin">⏳</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Year Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Pencairan</h1>
          <p className="text-muted-foreground mt-1">Analitik dan statistik pengajuan pencairan SPJ</p>
        </div>
        <Select value={filterTahun} onValueChange={setFilterTahun}>
          <SelectTrigger className="w-[120px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Pengajuan" value={stats.total} icon={FileText} variant="default" />
        <StatCard title="Draft" value={stats.draft + stats.submitted_sm} icon={FileEdit} variant="warning" />
        <StatCard title="Sedang Diproses" value={stats.inProcess} icon={Clock} variant="info" />
        <StatCard title="Selesai" value={stats.completed} icon={CheckCircle2} variant="success" subtitle={`${stats.successRate}% berhasil`} />
        <StatCard title="Dikembalikan" value={stats.rejected} icon={XCircle} variant="danger" />
        <StatCard title="Rata-rata Proses" value={averageTotalTime.display} icon={Timer} variant="secondary" subtitle={`${averageTotalTime.count} pengajuan`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status</CardTitle>
            <CardDescription>Sebaran status pengajuan</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Tidak ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Jenis Belanja Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pengajuan per Jenis Belanja</CardTitle>
            <CardDescription>Distribusi berdasarkan jenis belanja</CardDescription>
          </CardHeader>
          <CardContent>
            {jenisBelanjaDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Tidak ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jenisBelanjaDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Bulanan</CardTitle>
          <CardDescription>Perbandingan pengajuan, selesai, dan ditolak per bulan</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="pengajuan" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="selesai" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="ditolak" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Current Queue by Stage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightCircle className="w-5 h-5" />
            Tracking Pengajuan
          </CardTitle>
          <CardDescription>Distribusi pengajuan yang sedang dalam proses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={queueAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {queueAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Processing Time Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Rata-rata Waktu Proses Antar Tahap
          </CardTitle>
          <CardDescription>Perbandingan durasi rata-rata dari satu tahap ke tahap berikutnya. 🟢 ≤2 hari 🟡 3-5 hari 🔴 &gt;5 hari</CardDescription>
        </CardHeader>
        <CardContent>
          {processingTimeData.every(d => d.count === 0) ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Tidak ada data waktu proses
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={processingTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(val) => `${(val / 24).toFixed(1)} hari`} />
                  <YAxis dataKey="stage" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm">{data.stage}</p>
                            <p className="text-sm">Rata-rata: {data.displayTime}</p>
                            <p className="text-xs text-muted-foreground">Dari {data.count} pengajuan</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {processingTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {processingTimeDataWithTotal.map((item) => (
                  <div key={item.stage} className="border rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-muted-foreground font-medium">{item.stage}</span>
                    </div>
                    <p className="text-lg font-bold" style={{ color: item.color }}>
                      {item.displayTime}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.count} pengajuan
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightCircle className="w-5 h-5" />
              Alur Kerja Saat Ini
            </CardTitle>
            <CardDescription>Jumlah pengajuan di setiap tahap</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflowFunnel.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: item.color }}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm font-bold">{item.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {/* Rejected section */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-red-500">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Dikembalikan</span>
                    <span className="text-sm font-bold">{stats.rejected}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-red-500"
                      style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Submitters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Pengaju
            </CardTitle>
            <CardDescription>Peringkat berdasarkan jumlah pengajuan</CardDescription>
          </CardHeader>
          <CardContent>
            {topSubmitters.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Tidak ada data
              </div>
            ) : (
              <div className="space-y-2">
                {topSubmitters.map((submitter, index) => (
                  <div key={submitter.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{submitter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {submitter.completed}/{submitter.total} selesai
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{submitter.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Aktivitas Terbaru
          </CardTitle>
          <CardDescription>Pengajuan yang terakhir diperbarui</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-muted-foreground">
              Tidak ada aktivitas terbaru
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((submission) => {
                const updateTime = submission.updatedAtString || submission.waktuPengajuan || '-';
                const statusColor = STATUS_COLORS[submission.status] || '#6b7280';
                
                return (
                  <div key={submission.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: statusColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{submission.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: statusColor }}>
                          {STATUS_LABELS[submission.status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{submission.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.submitterName} • {submission.jenisBelanja}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                      {updateTime}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
