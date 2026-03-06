// Types untuk Usulan Pencairan - Complete Workflow Implementation

// ================== ENUMS & TYPES ==================
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

export type PaymentType = 'LS' | 'UP'; // LS = Langsung Serahkan, UP = Uang Persediaan

export type UserRole = 
  | 'Fungsi Sosial'
  | 'Fungsi Neraca'
  | 'Fungsi Produksi'
  | 'Fungsi Distribusi'
  | 'Fungsi IPDS'
  | 'Bendahara'
  | 'Pejabat Pembuat Komitmen'
  | 'Pejabat Penandatangan Surat Perintah Membayar'
  | 'KPPN'
  | 'Arsip'
  | 'admin';

export type WorkflowStage = 'SM' | 'Bendahara' | 'PPK' | 'PPSPM' | 'KPPN' | 'Arsip';

// Roles yang bisa mengajukan (hanya Fungsi* roles)
export const SUBMITTER_ROLES: UserRole[] = [
  'Fungsi Sosial',
  'Fungsi Neraca',
  'Fungsi Produksi',
  'Fungsi Distribusi',
  'Fungsi IPDS',
];

// Roles yang bisa melihat SEMUA data pengajuan
export const ROLES_CAN_VIEW_ALL: UserRole[] = [
  'Bendahara',
  'Pejabat Pembuat Komitmen',
  'Pejabat Penandatangan Surat Perintah Membayar',
  'KPPN',
  'Arsip',
  'admin',
];

// ================== STATUS LABELS & INFO ==================
export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: 'Draft SM',
  submitted_sm: 'Submitted to Bendahara',
  pending_bendahara: 'Waiting Bendahara',
  pending_ppk: 'Waiting PPK',
  pending_ppspm: 'Waiting PPSPM',
  pending_kppn: 'Waiting KPPN',
  pending_arsip: 'Waiting Arsip',
  completed: 'Completed',
  rejected_sm: 'Rejected by Bendahara',
  rejected_bendahara: 'Rejected by PPK',
  rejected_ppk: 'Rejected by PPSPM',
  rejected_ppspm: 'Rejected by KPPN',
  rejected_kppn: 'Rejected by Arsip',
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

// ================== DOCUMENT TYPES & LABELS ==================
export type DocumentType = string;

export interface Document {
  type: DocumentType;
  name: string;
  isRequired: boolean;
  isChecked: boolean;
  note?: string;
}

export const DOCUMENT_LABELS: Record<string, string> = {
  'kak': 'Kerangka Acuan Kerja (KAK)',
  'form_permintaan': 'Form Permintaan (FP)',
  'sk_kpa': 'Surat Keputusan KPA',
  'rekap_honor': 'Rekap Honor/Kuitansi',
  'laporan': 'Laporan',
  'ssp_pph21': 'SSP PPh Pasal 21',
  'surat_tugas': 'Surat Tugas',
  'visum': 'Visum',
  'kuitansi': 'Kuitansi',
  'daftar_pengeluaran_riil': 'Daftar Pengeluaran Riil',
  'surat_kendis': 'Surat Pernyataan Kendaraan Dinas',
  'laporan_perjadin': 'Laporan Perjadin dan Dokumentasi',
  'rekap_translok': 'Rekapitulasi Translok',
  'spd': 'Surat Perjalanan Dinas (SPD)',
  'daftar_ongkos': 'Daftar Ongkos Perjalanan',
  'undangan': 'Undangan',
  'daftar_hadir': 'Daftar Hadir',
  'jadwal': 'Jadwal Kegiatan/Rundown Acara',
  'paparan': 'Paparan/Materi',
  'ktp_npwp': 'Fc. KTP dan NPWP',
  'spk': 'Surat Perjanjian Kerja (SPK)',
  'bast': 'Berita Acara Serah Terima (BAST)',
  'notulen': 'Notulen dan Dokumentasi Rapat',
  'bukti_pembelian': 'Komitmen/Kontrak/Bukti Pembelian/Kuitansi',
  'foto_konsumsi': 'Foto Konsumsi',
  'super_fasilitas': 'Super Fasilitas Kantor Tidak Memadai',
  'ssp': 'Surat Setor Pajak (SSP)',
  'tanda_terima': 'Tanda Terima',
  'foto_penerimaan': 'Foto penerimaan paket data/pulsa',
  'bukti_prestasi': 'Bukti Prestasi (BAPP/BAST/BAP)',
  'kontrak': 'Komitmen/Kontrak',
  'room_list': 'Room List',
  'invoice_kuitansi': 'Invoice/Kuitansi',
  'npwp_rekening': 'Fc. NPWP dan Rek Koran',
  'spd_super': 'SPD, Super Kendis, Daftar Uang Harian',
};

// ================== SUBMISSION INTERFACE ==================
export interface Submission {
  id: string;
  title: string;
  submitterName: string;
  jenisBelanja: string;
  subJenisBelanja?: string;
  submittedAt: Date;
  updatedAt: Date;
  status: SubmissionStatus;
  documents: Document[];
  notes?: string;
  
  // Timestamps for each workflow stage
  waktuPengajuan?: string; // When SM submitted (Col H)
  waktuBendahara?: string; // When Bendahara reviewed (Col I)
  waktuPPK?: string; // When PPK reviewed (Col J)
  waktuPPSPM?: string; // When PPSPM reviewed (Col K)
  waktuKppn?: string; // When KPPN processed (Col L - not used in new workflow)
  waktuArsip?: string; // When Arsip recorded (Col L in new workflow)
  
  // Status at each stage
  statusBendahara?: string; // Approve/Reject reason (Col M)
  statusPPK?: string; // Approve/Reject reason (Col N)
  statusPPSPM?: string; // Approve/Reject reason (Col O)
  statusArsip?: string; // Approve/Reject reason (Col P)
  
  // User and payment info
  user?: string; // Role yang membuat pengajuan (Col R)
  pembayaran?: PaymentType; // LS or UP (Col S)
  nomorSPM?: string; // SPM number (Col T)
  nomorSPPD?: string; // SPPD number (Col U)
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

/**
 * Check if user can take an action on a submission at current status
 */
export function canTakeAction(role: UserRole, status: SubmissionStatus): boolean {
  if (role === 'admin') return true;
  
  if (role === 'Bendahara' && (status === 'pending_bendahara' || status === 'rejected_bendahara')) return true;
  if (role === 'Pejabat Pembuat Komitmen' && (status === 'pending_ppk' || status === 'rejected_ppk')) return true;
  if (role === 'Pejabat Penandatangan Surat Perintah Membayar' && (status === 'pending_ppspm' || status === 'rejected_ppspm')) return true;
  if (role === 'KPPN' && (status === 'pending_kppn' || status === 'rejected_kppn')) return true;
  if (role === 'Arsip' && status === 'pending_arsip') return true;
  
  return false;
}

/**
 * Check if user can edit the submission
 */
export function canEditSubmission(role: UserRole, status: SubmissionStatus, submittedByRole?: string): boolean {
  if (role === 'admin') return true;
  
  // Only submitter can edit draft or after rejection
  if (SUBMITTER_ROLES.includes(role)) {
    if (status === 'draft') return true;
    if (status === 'rejected_sm') return true;
  }
  
  return false;
}

/**
 * Get current workflow stage
 */
export function getCurrentStage(status: SubmissionStatus): WorkflowStage | null {
  if (status === 'draft' || status === 'submitted_sm') return 'SM';
  if (status === 'pending_bendahara' || status === 'rejected_sm') return 'Bendahara';
  if (status === 'pending_ppk' || status === 'rejected_bendahara') return 'PPK';
  if (status === 'pending_ppspm' || status === 'rejected_ppk') return 'PPSPM';
  if (status === 'pending_kppn' || status === 'rejected_ppspm') return 'KPPN';
  if (status === 'pending_arsip' || status === 'rejected_kppn') return 'Arsip';
  if (status === 'completed') return 'Arsip';
  return null;
}

/**
 * Get all workflow stages in order
 */
export function getWorkflowStages(): WorkflowStage[] {
  return ['SM', 'Bendahara', 'PPK', 'PPSPM', 'KPPN', 'Arsip'];
}

/**
 * Check if a stage is completed
 */
export function isStageCompleted(status: SubmissionStatus, stage: WorkflowStage): boolean {
  if (status === 'completed') {
    return true;
  }
  
  const currentStage = getCurrentStage(status);
  const allStages = getWorkflowStages();
  const currentIndex = currentStage ? allStages.indexOf(currentStage) : -1;
  
  // All stages before current are completed
  return allStages.indexOf(stage) < currentIndex;
}

/**
 * Get label for workflow stage
 */
export function getStageName(stage: WorkflowStage): string {
  const names: Record<WorkflowStage, string> = {
    'SM': 'Satuan Kerja',
    'Bendahara': 'Bendahara',
    'PPK': 'PPK',
    'PPSPM': 'PPSPM',
    'KPPN': 'KPPN',
    'Arsip': 'Arsip',
  };
  return names[stage];
}

/**
 * View control - check if user can see all submissions
 */
export function canViewAllSubmissions(role: UserRole): boolean {
  return ROLES_CAN_VIEW_ALL.includes(role);
}

/**
 * Check if submission should be shown to user
 */
export function shouldShowSubmission(submission: Submission, userRole: UserRole, userCreatorRole?: string): boolean {
  // Admin and review roles can see all
  if (canViewAllSubmissions(userRole)) {
    return true;
  }
  
  // Submitters can only see their own
  if (SUBMITTER_ROLES.includes(userRole)) {
    return submission.user === userRole;
  }
  
  return false;
}

/**
 * Get next valid status based on current status and action role
 */
export function getNextStatus(currentStatus: SubmissionStatus, role: UserRole, action: 'approve' | 'reject'): SubmissionStatus | null {
  if (currentStatus === 'draft' && SUBMITTER_ROLES.includes(role)) {
    return 'submitted_sm';
  }
  
  if (currentStatus === 'submitted_sm') {
    return 'pending_bendahara';
  }
  
  if (currentStatus === 'pending_bendahara' && role === 'Bendahara') {
    return action === 'approve' ? 'pending_ppk' : 'rejected_sm';
  }
  
  if (currentStatus === 'pending_ppk' && role === 'Pejabat Pembuat Komitmen') {
    return action === 'approve' ? 'pending_ppspm' : 'rejected_bendahara';
  }
  
  if (currentStatus === 'pending_ppspm' && role === 'Pejabat Penandatangan Surat Perintah Membayar') {
    return action === 'approve' ? 'pending_kppn' : 'rejected_ppk';
  }
  
  if (currentStatus === 'pending_kppn' && role === 'KPPN') {
    return action === 'approve' ? 'pending_arsip' : 'rejected_ppspm';
  }
  
  if (currentStatus === 'pending_arsip' && role === 'Arsip') {
    return action === 'approve' ? 'completed' : 'rejected_kppn';
  }
  
  return null;
}

// ================== UTILITY FUNCTIONS ==================

/**
 * Format date/time for spreadsheet in Jakarta timezone
 */
export function formatDateTime(date?: Date): string {
  if (!date) return '';
  
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  const formatter = new Intl.DateTimeFormat('id-ID', opts);
  const parts = formatter.formatToParts(date);
  
  const values: Record<string, string> = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });
  
  // Format: HH:mm - dd/MM/yyyy
  return `${values.hour}:${values.minute} - ${values.day}/${values.month}/${values.year}`;
}
