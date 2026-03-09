// Types untuk Usulan Pencairan

export type SubmissionStatus = 
  | 'draft'
  | 'submitted_sm'
  | 'pending_bendahara'
  | 'pending_ppk'
  | 'pending_ppspm'
  | 'pending_kppn'
  | 'pending_arsip'
  | 'completed'
  | 'rejected_sm'
  | 'rejected_bendahara'
  | 'rejected_ppk'
  | 'rejected_ppspm'
  | 'rejected_kppn';

export type PaymentType = 'LS' | 'UP';

export type WorkflowStage = 'SM' | 'Bendahara' | 'PPK' | 'PPSPM' | 'KPPN' | 'Arsip';

export type UserRole = 
  | 'Fungsi Sosial'
  | 'Fungsi Neraca'
  | 'Fungsi Produksi'
  | 'Fungsi Distribusi'
  | 'Fungsi IPDS'
  | 'Bendahara'
  | 'Pejabat Pembuat Komitmen'
  | 'Pejabat Pengadaan'
  | 'Pejabat Penandatangan Surat Perintah Membayar'
  | 'Padamel BPS 3210'
  | 'KPPN'
  | 'Arsip'
  | 'operator'
  | 'admin';

// Roles yang bisa mengajukan
export const SUBMITTER_ROLES: UserRole[] = [
  'Fungsi Sosial',
  'Fungsi Neraca',
  'Fungsi Produksi',
  'Fungsi Distribusi',
  'Fungsi IPDS',
  'Bendahara', // 🆕 Bendahara bisa membuat pengajuan
  'Pejabat Pembuat Komitmen', // 🆕 PPK bisa membuat pengajuan
  'Pejabat Pengadaan', // 🆕 Pejabat Pengadaan bisa membuat pengajuan
  'Pejabat Penandatangan Surat Perintah Membayar', // 🆕 PPSPM bisa membuat pengajuan
];

// 🆕 Roles yang bisa melihat SEMUA data pengajuan
export const ROLES_CAN_VIEW_ALL: UserRole[] = [
  'Pejabat Pembuat Komitmen',
  'Bendahara',
  'Pejabat Pengadaan',
  'Padamel BPS 3210',
  'Pejabat Penandatangan Surat Perintah Membayar',
  'Arsip',
  'operator',
  'admin',
];

// 🆕 Helper: Check apakah role bisa lihat semua atau hanya data mereka
export function canViewAllSubmissions(role: UserRole): boolean {
  return ROLES_CAN_VIEW_ALL.includes(role);
}

// 🆕 Helper: Check apakah submission harus ditampilkan untuk user dengan role tertentu
export function shouldShowSubmission(submission: Submission, userRole: UserRole, userCreatorRole?: string): boolean {
  // Admin dan roles khusus bisa lihat semua
  if (canViewAllSubmissions(userRole)) {
    return true;
  }
  
  // Untuk submitter (Fungsi*), hanya tampilkan:
  // 1. Data yang mereka buat sendiri (kolom R: user)
  // 2. Data yang sedang dalam review mereka (status = incomplete_sm HANYA jika mereka creator-nya)
  if (SUBMITTER_ROLES.includes(userRole)) {
    // Jika buat pengajuan sendiri
    if (submission.user && submission.user === userRole) {
      return true;
    }
    
    return false;
  }
  
  // Untuk role lain (operator, dll), tampilkan semua
  return true;
}

export type DocumentType = string;

// Document labels for backward compatibility
export const DOCUMENT_LABELS: Record<string, string> = {
  kak: 'Kerangka Acuan Kerja (KAK)',
  form_permintaan: 'Form Permintaan (FP)',
  sk_kpa: 'SK KPA',
  spk: 'Surat Perjanjian Kerja (SPK)',
  bast: 'Berita Acara Serah Terima (BAST)',
  surat_tugas: 'Surat Tugas',
  rekap_honor: 'Rekap Honor/Kuitansi',
  laporan: 'Laporan',
  undangan: 'Undangan',
  jadwal_kegiatan: 'Jadwal Kegiatan/Rundown Acara',
  daftar_hadir: 'Daftar Hadir',
  paparan_materi: 'Paparan/Materi',
  fc_ktp_npwp: 'Fc. KTP dan NPWP',
  ssp_pph_21: 'SSP PPh Pasal 21',
  spd: 'Surat Perjalanan Dinas (SPD)',
  visum: 'Visum',
  kuitansi: 'Kuitansi',
  daftar_pengeluaran_riil: 'Daftar Pengeluaran Riil',
  daftar_ongkos_perjalanan: 'Daftar Ongkos Perjalanan',
  surat_pernyataan_kendaraan_dinas: 'Surat Pernyataan Kendaraan Dinas',
  laporan_perjadin: 'Laporan Perjadin dan Dokumentasi',
  rekapitulasi_translok: 'Rekapitulasi Translok',
  notulen_dokumentasi_rapat: 'Notulen dan Dokumentasi Rapat',
  komitmen_kontrak: 'Komitmen/Kontrak/Bukti Pembelian/Kuitansi',
  tanda_terima: 'Tanda Terima',
  ssp: 'Surat Setor Pajak (SSP)',
  foto_penerimaan_paket: 'Foto penerimaan paket data/pulsa',
  foto_konsumsi: 'Foto Konsumsi',
  bukti_prestasi: 'Bukti Prestasi (BAPP/BAST/BAP)',
  room_list: 'Room List',
  invoice_kuitansi: 'Invoice/Kuitansi',
  fc_npwp_rek_koran: 'Fc. NPWP dan Rek Koran',
  daftar_uang_harian: 'SPD, Super Kendis, Daftar Uang Harian',
  super_fasilitas_kantor: 'Super Fasilitas Kantor Tidak Memadai',
};

export interface Document {
  type: DocumentType;
  name: string;
  isRequired: boolean;
  isChecked: boolean;
  note?: string;
}

export interface Submission {
  id: string;
  title: string;
  submitterName: string;
  jenisBelanja: string;
  subJenisBelanja?: string;
  submittedAt: Date;
  updatedAt?: Date; // ✅ UBAH dari string ke Date
  updatedAtString?: string; // ✅ TAMBAH ini - string asli dari kolom P
  status: SubmissionStatus;
  documents: Document[];
  notes?: string;
  waktuPengajuan?: string;
  waktuBendahara?: string;
  waktuPpk?: string;
  waktuPPSPM?: string;
  waktuKppn?: string;
  waktuArsip?: string; // ✅ TAMBAH untuk waktu input arsip
  statusBendahara?: string;
  statusPpk?: string;
  statusPPSPM?: string;
  statusKppn?: string;
  statusArsip?: string; // ✅ TAMBAH untuk status arsip
  bendaharaCheckedAt?: Date;
  ppkCheckedAt?: Date;
  ppspmCheckedAt?: Date;
  kppnCheckedAt?: Date;
  arsipCheckedAt?: Date; // ✅ TAMBAH untuk waktu record arsip
  user?: string; // 🆕 Kolom R - role login yang membuat 'Buat Pengajuan Baru'
  pembayaran?: 'UP' | 'LS'; // 🆕 Kolom S - Tipe pembayaran (Uang Persediaan atau Langsung)
  nomorSPM?: string; // 🆕 Kolom T - Nomor SPM
  nomorSPPD?: string; // 🆕 Untuk Arsip - Nomor SPPD
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: 'Draft',
  submitted_sm: 'Sudah Dikirim SM',
  pending_bendahara: 'Menunggu Bendahara',
  pending_ppk: 'Menunggu PPK',
  pending_ppspm: 'Menunggu PPSPM',
  pending_kppn: 'Menunggu KPPN',
  pending_arsip: 'Menunggu Arsip',
  completed: 'Selesai',
  rejected_sm: 'Ditolak SM',
  rejected_bendahara: 'Ditolak Bendahara',
  rejected_ppk: 'Ditolak PPK',
  rejected_ppspm: 'Ditolak PPSPM',
  rejected_kppn: 'Ditolak KPPN',
};

export const STATUS_COLORS: Record<SubmissionStatus, string> = {
  draft: 'gray',
  submitted_sm: 'blue',
  pending_bendahara: 'purple',
  pending_ppk: 'orange',
  pending_ppspm: 'pink',
  pending_kppn: 'indigo',
  pending_arsip: 'cyan',
  completed: 'green',
  rejected_sm: 'red',
  rejected_bendahara: 'red',
  rejected_ppk: 'red',
  rejected_ppspm: 'red',
  rejected_kppn: 'red',
};

export function getWorkflowStages(): WorkflowStage[] {
  return ['SM', 'Bendahara', 'PPK', 'PPSPM', 'KPPN', 'Arsip'];
}

export function getStageName(stage: string): string {
  const names: Record<string, string> = {
    SM: 'SM',
    Bendahara: 'Bendahara',
    PPK: 'PPK',
    PPSPM: 'PPSPM',
    KPPN: 'KPPN',
    Arsip: 'Arsip',
  };
  return names[stage] || stage;
}

export function isStageCompleted(stage: string, status: SubmissionStatus): boolean {
  const stageOrder = ['SM', 'Bendahara', 'PPK', 'PPSPM', 'KPPN', 'Arsip'];
  const stageIndex = stageOrder.indexOf(stage);
  if (stageIndex === -1) return false;
  if (status === 'completed') return true;
  // Map status to current stage index
  const statusStageMap: Record<string, number> = {
    draft: -1, submitted_sm: 0, pending_bendahara: 1, pending_ppk: 2,
    pending_ppspm: 3, pending_kppn: 4, pending_arsip: 5,
    rejected_sm: 0, rejected_bendahara: 1, rejected_ppk: 2,
    rejected_ppspm: 3, rejected_kppn: 4,
  };
  const currentIdx = statusStageMap[status] ?? -1;
  return stageIndex < currentIdx;
}

// Jenis Belanja Options (main categories)
export const JENIS_BELANJA_OPTIONS = [
  'Honorarium',
  'Perjalanan Dinas',
  'Belanja Bahan',
  'Belanja Barang Persediaan',
  'Paket Meeting Dalam Kota',
  'Lain-lain',
];

// Sub-Jenis Belanja for each main category
export const SUB_JENIS_BELANJA: Record<string, string[]> = {
  'Honorarium': ['Tim Pelaksana', 'Pengajar/Instruktur', 'Narasumber', 'Petugas Mitra', 'Petugas PNS'],
  'Perjalanan Dinas': ['Transport Lokal', 'Perjadin dalam kota > 8 Jam', 'Perjadin Luar Kota'],
  'Belanja Bahan': ['Konsumsi', 'Pulsa/Paket Data', 'Perlengkapan'],
  'Belanja Barang Persediaan': ['ATK dan Computer Supplies', 'Pencetakan'],
  'Paket Meeting Dalam Kota': ['Paket Meeting', 'Perjalanan'],
  'Lain-lain': ['Manajemen Building'],
};

// Documents by Jenis and Sub-Jenis Belanja
export const DOCUMENTS_BY_SUB_JENIS: Record<string, Record<string, Document[]>> = {
  'Honorarium': {
    'Tim Pelaksana': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'sk_kpa', name: 'Surat Keputusan KPA', isRequired: true, isChecked: false },
      { type: 'rekap_honor', name: 'Rekap Honor/Kuitansi', isRequired: true, isChecked: false },
      { type: 'laporan', name: 'Laporan', isRequired: true, isChecked: false },
      { type: 'ssp_pph21', name: 'SSP PPh Pasal 21', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
    'Pengajar/Instruktur': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'sk_kpa', name: 'Surat Keputusan KPA', isRequired: true, isChecked: false },
      { type: 'rekap_honor', name: 'Rekap Honor/Kuitansi', isRequired: true, isChecked: false },
      { type: 'laporan', name: 'Laporan', isRequired: true, isChecked: false },
      { type: 'jadwal', name: 'Jadwal Kegiatan/Rundown Acara', isRequired: true, isChecked: false },
      { type: 'daftar_hadir', name: 'Daftar Hadir', isRequired: true, isChecked: false },
      { type: 'ssp_pph21', name: 'SSP PPh Pasal 21', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
    'Narasumber': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'sk_kpa', name: 'Surat Keputusan KPA', isRequired: true, isChecked: false },
      { type: 'rekap_honor', name: 'Rekap Honor/Kuitansi', isRequired: true, isChecked: false },
      { type: 'undangan', name: 'Undangan', isRequired: true, isChecked: false },
      { type: 'jadwal', name: 'Jadwal Kegiatan/Rundown Acara', isRequired: true, isChecked: false },
      { type: 'daftar_hadir', name: 'Daftar Hadir', isRequired: true, isChecked: false },
      { type: 'paparan', name: 'Paparan/Materi', isRequired: true, isChecked: false },
      { type: 'ktp_npwp', name: 'Fc. KTP dan NPWP', isRequired: true, isChecked: false },
      { type: 'ssp_pph21', name: 'SSP PPh Pasal 21', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
    'Petugas Mitra': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'sk_kpa', name: 'Surat Keputusan KPA', isRequired: true, isChecked: false },
      { type: 'spk', name: 'Surat Perjanjian Kerja (SPK)', isRequired: true, isChecked: false },
      { type: 'bast', name: 'Berita Acara Serah Terima (BAST)', isRequired: true, isChecked: false },
      { type: 'rekap_honor', name: 'Rekap Honor/Kuitansi', isRequired: true, isChecked: false },
      { type: 'ssp_pph21', name: 'SSP PPh Pasal 21', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
    'Petugas PNS': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'sk_kpa', name: 'Surat Keputusan KPA', isRequired: true, isChecked: false },
      { type: 'bast', name: 'Berita Acara Serah Terima (BAST)', isRequired: true, isChecked: false },
      { type: 'surat_tugas', name: 'Surat Tugas', isRequired: true, isChecked: false },
      { type: 'rekap_honor', name: 'Rekap Honor/Kuitansi', isRequired: true, isChecked: false },
      { type: 'ssp_pph21', name: 'SSP PPh Pasal 21', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
  },
  'Perjalanan Dinas': {
    'Transport Lokal': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan', isRequired: true, isChecked: false },
      { type: 'surat_tugas', name: 'Surat Tugas', isRequired: true, isChecked: false },
      { type: 'visum', name: 'Visum', isRequired: true, isChecked: false },
      { type: 'kuitansi', name: 'Kuitansi', isRequired: true, isChecked: false },
      { type: 'daftar_pengeluaran_riil', name: 'Daftar Pengeluaran Riil', isRequired: true, isChecked: false },
      { type: 'surat_kendis', name: 'Surat Pernyataan Kendaraan Dinas', isRequired: true, isChecked: false },
      { type: 'laporan_perjadin', name: 'Laporan Perjadin dan Dokumentasi', isRequired: true, isChecked: false },
      { type: 'rekap_translok', name: 'Rekapitulasi Translok', isRequired: true, isChecked: false },
    ],
    'Perjadin dalam kota > 8 Jam': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'surat_tugas', name: 'Surat Tugas', isRequired: true, isChecked: false },
      { type: 'spd', name: 'Surat Perjalanan Dinas (SPD)', isRequired: true, isChecked: false },
      { type: 'visum', name: 'Visum', isRequired: true, isChecked: false },
      { type: 'kuitansi', name: 'Kuitansi', isRequired: true, isChecked: false },
      { type: 'daftar_pengeluaran_riil', name: 'Daftar Pengeluaran Riil', isRequired: true, isChecked: false },
      { type: 'daftar_ongkos', name: 'Daftar Ongkos Perjalanan', isRequired: false, isChecked: false },
      { type: 'surat_kendis', name: 'Surat Pernyataan Kendaraan Dinas', isRequired: false, isChecked: false, note: 'Wajib ada jika kendaraan pribadi/umum'  },
      { type: 'laporan_perjadin', name: 'Laporan Perjadin dan Dokumentasi', isRequired: true, isChecked: false },
    ],
    'Perjadin Luar Kota': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'surat_tugas', name: 'Surat Tugas', isRequired: true, isChecked: false },
      { type: 'spd', name: 'Surat Perjalanan Dinas (SPD)', isRequired: true, isChecked: false },
      { type: 'visum', name: 'Visum', isRequired: true, isChecked: false },
      { type: 'kuitansi', name: 'Kuitansi', isRequired: true, isChecked: false },
      { type: 'daftar_pengeluaran_riil', name: 'Daftar Pengeluaran Riil', isRequired: true, isChecked: false },
      { type: 'daftar_ongkos', name: 'Daftar Ongkos Perjalanan', isRequired: false, isChecked: false },
      { type: 'surat_kendis', name: 'Surat Pernyataan Kendaraan Dinas', isRequired: false, isChecked: false, note: 'Wajib ada jika kendaraan pribadi/umum' },
      { type: 'laporan_perjadin', name: 'Laporan Perjadin dan Dokumentasi', isRequired: true, isChecked: false },
    ],
  },
  'Belanja Bahan': {
    'Konsumsi': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'undangan', name: 'Undangan', isRequired: true, isChecked: false },
      { type: 'daftar_hadir', name: 'Daftar Hadir', isRequired: true, isChecked: false },
      { type: 'notulen', name: 'Notulen dan Dokumentasi Rapat', isRequired: true, isChecked: false },
      { type: 'bukti_pembelian', name: 'Komitmen/Kontrak/Bukti Pembelian/Kuitansi *)', isRequired: true, isChecked: false },
      { type: 'foto_konsumsi', name: 'Foto Konsumsi', isRequired: true, isChecked: false },
      { type: 'super_fasilitas', name: 'Super Fasilitas Kantor Tidak Memadai', isRequired: false, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false },
    ],
    'Pulsa/Paket Data': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'bukti_pembelian', name: 'Komitmen/Kontrak/Bukti Pembelian/Kuitansi *)', isRequired: true, isChecked: false },
      { type: 'tanda_terima', name: 'Tanda Terima', isRequired: true, isChecked: false },
      { type: 'foto_penerimaan', name: 'Foto penerimaan paket data/pulsa', isRequired: true, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
    'Perlengkapan': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'bukti_pembelian', name: 'Komitmen/Kontrak/Bukti Pembelian/Kuitansi *)', isRequired: true, isChecked: false },
      { type: 'tanda_terima', name: 'Tanda Terima', isRequired: true, isChecked: false },
      { type: 'bast', name: 'Berita Acara Serah Terima (BAST)', isRequired: true, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
  },
  'Belanja Barang Persediaan': {
    'ATK dan Computer Supplies': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'bukti_pembelian', name: 'Komitmen/Kontrak/Bukti Pembelian/Kuitansi *)', isRequired: true, isChecked: false },
      { type: 'bukti_prestasi', name: 'Bukti Prestasi (BAPP/BAST/BAP)', isRequired: true, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
    'Pencetakan': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'bukti_pembelian', name: 'Komitmen/Kontrak/Bukti Pembelian/Kuitansi *)', isRequired: true, isChecked: false },
      { type: 'bukti_prestasi', name: 'Bukti Prestasi (BAPP/BAST/BAP)', isRequired: true, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
  },
  'Paket Meeting Dalam Kota': {
    'Paket Meeting': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'undangan', name: 'Undangan', isRequired: true, isChecked: false },
      { type: 'jadwal', name: 'Jadwal Kegiatan', isRequired: true, isChecked: false },
      { type: 'surat_tugas', name: 'Surat Tugas', isRequired: true, isChecked: false },
      { type: 'daftar_hadir', name: 'Daftar Hadir', isRequired: true, isChecked: false },
      { type: 'notulen', name: 'Notulen/Laporan dan Dokumentasi Rapat', isRequired: true, isChecked: false },
      { type: 'super_fasilitas', name: 'Super Fasilitas Kantor Tidak Memadai', isRequired: false, isChecked: false, note: 'dilengkapi oleh Subject Meter' },
      { type: 'kontrak', name: 'Komitmen/Kontrak *)', isRequired: true, isChecked: false },
      { type: 'bukti_prestasi', name: 'Bukti Prestasi (BAPP/BAST/BAP)', isRequired: true, isChecked: false },
      { type: 'room_list', name: 'Room List', isRequired: false, isChecked: false, note: 'Wajib ada jika Fullboard' },
      { type: 'invoice_kuitansi', name: 'Invoice/Kuitansi', isRequired: true, isChecked: false },
      { type: 'npwp_rekening', name: 'Fc. NPWP dan Rek Koran', isRequired: true, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
    'Perjalanan': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan', isRequired: true, isChecked: false },
      { type: 'undangan', name: 'Undangan', isRequired: true, isChecked: false },
      { type: 'jadwal', name: 'Jadwal Kegiatan', isRequired: true, isChecked: false },
      { type: 'surat_tugas', name: 'Surat Tugas', isRequired: true, isChecked: false },
      { type: 'daftar_hadir', name: 'Daftar Hadir', isRequired: true, isChecked: false },
      { type: 'notulen', name: 'Notulen/Laporan dan Dokumentasi Rapat', isRequired: true, isChecked: false },
      { type: 'spd_super', name: 'SPD, Super Kendis, Daftar Uang Harian', isRequired: true, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false, note: 'dilengkapi Bendahara' },
    ],
  },
  'Lain-lain': {
    'Manajemen Building': [
      { type: 'kak', name: 'Kerangka Acuan Kerja (KAK)', isRequired: true, isChecked: false },
      { type: 'form_permintaan', name: 'Form Permintaan (FP)', isRequired: true, isChecked: false },
      { type: 'laporan', name: 'Laporan dan Dokumentasi', isRequired: true, isChecked: false },
      { type: 'kontrak', name: 'Komitmen/Kontrak', isRequired: true, isChecked: false },
      { type: 'bukti_prestasi', name: 'Bukti Prestasi (BAPP/BAST/BAP)', isRequired: true, isChecked: false },
      { type: 'invoice_kuitansi', name: 'Invoice/Kuitansi', isRequired: true, isChecked: false },
      { type: 'ssp', name: 'Surat Setor Pajak (SSP)', isRequired: false, isChecked: false },
    ],
  },
};

export function getDocumentsByJenisBelanja(jenisBelanja: string, subJenis?: string): Document[] {
  if (!jenisBelanja || !subJenis) return [];
  
  const subDocs = DOCUMENTS_BY_SUB_JENIS[jenisBelanja];
  if (!subDocs) return [];
  
  const docs = subDocs[subJenis];
  if (!docs) return [];
  
  return docs.map(doc => ({ ...doc }));
}

export function generateSubmissionId(existingIds: string[]): string {
  const prefix = 'SUB';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  let maxNum = 0;
  existingIds.forEach(id => {
    const match = id.match(/SUB\d{4}(\d{4})/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  
  const newNum = (maxNum + 1).toString().padStart(4, '0');
  return `${prefix}${year}${month}${newNum}`;
}

export function canCreateSubmission(role: UserRole): boolean {
  return SUBMITTER_ROLES.includes(role) || role === 'admin';
}


export function canTakeActionOnRejected(role: UserRole, status: SubmissionStatus): boolean {
  if (role === 'admin') return true;
  
  // Alur workflow: SM → Bendahara → PPK → PPSPM → KPPN → Arsip
  // When rejected at a stage, the previous stage role can take corrective action:
  
  // rejected_sm: Submitter bisa resubmit (but we need submissionUser to verify)
  if (status === 'rejected_sm') return SUBMITTER_ROLES.includes(role);
  
  // rejected_bendahara: Submitter bisa resubmit, Bendahara bisa send ulang
  if (status === 'rejected_bendahara') return SUBMITTER_ROLES.includes(role) || role === 'Bendahara';
  
  // rejected_ppk: Bendahara bisa send ulang ke PPK
  if (status === 'rejected_ppk') return role === 'Bendahara';
  
  // rejected_ppspm: PPK bisa send ulang ke PPSPM  
  if (status === 'rejected_ppspm') return role === 'Pejabat Pembuat Komitmen';
  
  // rejected_kppn: PPSPM bisa send ulang ke KPPN
  if (status === 'rejected_kppn') return role === 'Pejabat Penandatangan Surat Perintah Membayar';
  
  return false;
}

export function canReturnFromArsip(role: UserRole, status: SubmissionStatus): boolean {
  return (role === 'Arsip' || role === 'admin') && status === 'pending_arsip';
}

export function canViewDetail(role: UserRole, status: SubmissionStatus): boolean {
  return true;
}

export function canEdit(role: UserRole, status: SubmissionStatus, submissionUser?: string): boolean {
  if (role === 'admin') return true;
  if (submissionUser && submissionUser !== role) return false;
  if (SUBMITTER_ROLES.includes(role) && (status === 'rejected_sm' || status === 'draft')) return true;
  return false;
}

export function getRelevantTimestamp(submission: Submission): string | null {
  if (submission.status === 'completed' && submission.waktuArsip) {
    return submission.waktuArsip;
  }
  if (submission.status === 'pending_arsip' && submission.waktuKppn) {
    return submission.waktuKppn;
  }
  if (['pending_ppspm', 'rejected_ppk'].includes(submission.status) && submission.waktuPPSPM) {
    return submission.waktuPPSPM;
  }
  if (['pending_ppk', 'rejected_bendahara'].includes(submission.status) && submission.waktuPpk) {
    return submission.waktuPpk;
  }
  if (['pending_bendahara', 'rejected_sm'].includes(submission.status) && submission.waktuBendahara) {
    return submission.waktuBendahara;
  }
  return submission.waktuPengajuan || null;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return new Intl.DateTimeFormat('id-ID', options).format(d);
}
