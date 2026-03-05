export type SubmissionStatus = 
  | 'pending_ppk' 
  | 'incomplete_sm' 
  | 'pending_bendahara' 
  | 'incomplete_ppk' 
  | 'incomplete_bendahara'
  | 'sent_kppn';

export type UserRole = 'admin' | 'ppk' | 'bendahara' | 'user';

export type DocumentType = 
  | 'kak' 
  | 'form_permintaan'
  | 'sk_kpa'
  | 'spk'
  | 'bast'
  | 'surat_tugas'
  | 'rekap_honor'
  | 'laporan'
  | 'undangan'
  | 'jadwal_kegiatan'
  | 'daftar_hadir'
  | 'paparan_materi'
  | 'fc_ktp_npwp'
  | 'ssp_pph_21'
  | 'spd'
  | 'visum'
  | 'kuitansi'
  | 'daftar_pengeluaran_riil'
  | 'daftar_ongkos_perjalanan'
  | 'surat_pernyataan_kendaraan_dinas'
  | 'laporan_perjadin'
  | 'rekapitulasi_translok'
  | 'notulen_dokumentasi_rapat'
  | 'komitmen_kontrak'
  | 'tanda_terima'
  | 'ssp'
  | 'foto_penerimaan_paket'
  | 'foto_konsumsi'
  | 'bukti_prestasi'
  | 'room_list'
  | 'invoice_kuitansi'
  | 'fc_npwp_rek_koran'
  | 'daftar_uang_harian'
  | 'super_fasilitas_kantor';

export interface Document {
  type: DocumentType;
  name: string;
  isRequired: boolean;
  isChecked: boolean;
}

export interface Submission {
  id: string;
  title: string;
  jenisBelanja: string;
  subJenisBelanja?: string;
  submitterName: string;
  submittedAt: Date;
  status: SubmissionStatus;
  documents: Document[];
  notes?: string;
  updatedAt?: Date;
  // Waktu per tahapan
  waktuPengajuan?: string;
  waktuPpk?: string;
  waktuBendahara?: string;
  // Status per tahapan
  statusPpk?: string;
  statusBendahara?: string;
  statusKppn?: string;
}

// Get the relevant timestamp based on current status
export function getRelevantTimestamp(submission: Submission): string {
  const status = submission.status;
  
  // Status yang berkaitan dengan Bendahara
  if (status === 'incomplete_bendahara' || status === 'sent_kppn') {
    return submission.waktuBendahara || submission.waktuPengajuan || '';
  }
  
  // Status yang berkaitan dengan PPK
  if (status === 'pending_bendahara' || status === 'incomplete_ppk' || status === 'incomplete_sm') {
    return submission.waktuPpk || submission.waktuPengajuan || '';
  }
  
  // Default: waktu pengajuan
  return submission.waktuPengajuan || '';
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending_ppk: 'Menunggu Verifikasi PPK',
  incomplete_sm: 'Dikembalikan ke SM',
  pending_bendahara: 'Menunggu Verifikasi Bendahara',
  incomplete_ppk: 'Dikembalikan ke PPK',
  incomplete_bendahara: 'Dikembalikan ke Bendahara',
  sent_kppn: 'Sudah Kirim KPPN',
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
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

// Sub-jenis belanja per jenis utama
export const SUB_JENIS_BELANJA: Record<string, string[]> = {
  'Honorarium': ['Tim Pelaksana', 'Pengajar/Instruktur', 'Narasumber', 'Petugas Mitra', 'Petugas PNS'],
  'Perjalanan Dinas': ['Transport Lokal', 'Perjadin dalam kota > 8 Jam', 'Perjadin Luar Kota'],
  'Belanja Bahan': ['Konsumsi', 'Pulsa/Paket Data', 'Perlengkapan'],
  'Belanja Barang Persediaan': ['ATK dan CS', 'Pencetakan'],
  'Paket Meeting Dalam Kota': ['Paket Meeting', 'Perjalanan'],
};

// Dokumen per sub-jenis belanja
export const SUB_JENIS_DOCUMENTS: Record<string, Record<string, { type: DocumentType; isRequired: boolean }[]>> = {
  'Honorarium': {
    'Tim Pelaksana': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'sk_kpa', isRequired: true },
      { type: 'rekap_honor', isRequired: true },
      { type: 'laporan', isRequired: true },
      { type: 'ssp_pph_21', isRequired: false },
    ],
    'Pengajar/Instruktur': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'sk_kpa', isRequired: true },
      { type: 'rekap_honor', isRequired: true },
      { type: 'laporan', isRequired: true },
      { type: 'jadwal_kegiatan', isRequired: true },
      { type: 'daftar_hadir', isRequired: true },
      { type: 'ssp_pph_21', isRequired: false },
    ],
    'Narasumber': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'sk_kpa', isRequired: true },
      { type: 'rekap_honor', isRequired: true },
      { type: 'undangan', isRequired: true },
      { type: 'jadwal_kegiatan', isRequired: true },
      { type: 'daftar_hadir', isRequired: true },
      { type: 'paparan_materi', isRequired: true },
      { type: 'fc_ktp_npwp', isRequired: true },
      { type: 'ssp_pph_21', isRequired: false },
    ],
    'Petugas Mitra': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'sk_kpa', isRequired: true },
      { type: 'spk', isRequired: true },
      { type: 'bast', isRequired: true },
      { type: 'rekap_honor', isRequired: true },
      { type: 'ssp_pph_21', isRequired: false },
    ],
    'Petugas PNS': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'sk_kpa', isRequired: true },
      { type: 'bast', isRequired: true },
      { type: 'surat_tugas', isRequired: true },
      { type: 'rekap_honor', isRequired: true },
      { type: 'ssp_pph_21', isRequired: false },
    ],
  },
  'Perjalanan Dinas': {
    'Transport Lokal': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'surat_tugas', isRequired: true },
      { type: 'visum', isRequired: true },
      { type: 'kuitansi', isRequired: true },
      { type: 'daftar_pengeluaran_riil', isRequired: true },
      { type: 'surat_pernyataan_kendaraan_dinas', isRequired: true },
      { type: 'laporan_perjadin', isRequired: true },
      { type: 'rekapitulasi_translok', isRequired: true },
    ],
    'Perjadin dalam kota > 8 Jam': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'surat_tugas', isRequired: true },
      { type: 'spd', isRequired: true },
      { type: 'visum', isRequired: true },
      { type: 'kuitansi', isRequired: true },
      { type: 'daftar_pengeluaran_riil', isRequired: true },
      { type: 'daftar_ongkos_perjalanan', isRequired: true },
      { type: 'surat_pernyataan_kendaraan_dinas', isRequired: true },
      { type: 'laporan_perjadin', isRequired: true },
    ],
    'Perjadin Luar Kota': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'surat_tugas', isRequired: true },
      { type: 'spd', isRequired: true },
      { type: 'visum', isRequired: true },
      { type: 'kuitansi', isRequired: true },
      { type: 'daftar_pengeluaran_riil', isRequired: true },
      { type: 'daftar_ongkos_perjalanan', isRequired: true },
      { type: 'surat_pernyataan_kendaraan_dinas', isRequired: true },
      { type: 'laporan_perjadin', isRequired: true },
    ],
  },
  'Belanja Bahan': {
    'Konsumsi': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'undangan', isRequired: true },
      { type: 'daftar_hadir', isRequired: true },
      { type: 'notulen_dokumentasi_rapat', isRequired: true },
      { type: 'komitmen_kontrak', isRequired: true },
      { type: 'foto_konsumsi', isRequired: true },
      { type: 'super_fasilitas_kantor', isRequired: false },
      { type: 'ssp', isRequired: false },
    ],
    'Pulsa/Paket Data': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'komitmen_kontrak', isRequired: true },
      { type: 'tanda_terima', isRequired: true },
      { type: 'foto_penerimaan_paket', isRequired: true },
      { type: 'ssp', isRequired: false },
    ],
    'Perlengkapan': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'komitmen_kontrak', isRequired: true },
      { type: 'tanda_terima', isRequired: true },
      { type: 'bast', isRequired: true },
      { type: 'ssp', isRequired: false },
    ],
  },
  'Belanja Barang Persediaan': {
    'ATK dan CS': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'komitmen_kontrak', isRequired: true },
      { type: 'bukti_prestasi', isRequired: true },
      { type: 'ssp', isRequired: false },
    ],
    'Pencetakan': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'komitmen_kontrak', isRequired: true },
      { type: 'bukti_prestasi', isRequired: true },
      { type: 'ssp', isRequired: false },
    ],
  },
  'Paket Meeting Dalam Kota': {
    'Paket Meeting': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'undangan', isRequired: true },
      { type: 'jadwal_kegiatan', isRequired: true },
      { type: 'surat_tugas', isRequired: true },
      { type: 'daftar_hadir', isRequired: true },
      { type: 'notulen_dokumentasi_rapat', isRequired: true },
      { type: 'super_fasilitas_kantor', isRequired: true },
      { type: 'komitmen_kontrak', isRequired: true },
      { type: 'bukti_prestasi', isRequired: true },
      { type: 'room_list', isRequired: true },
      { type: 'invoice_kuitansi', isRequired: true },
      { type: 'fc_npwp_rek_koran', isRequired: true },
      { type: 'ssp', isRequired: false },
    ],
    'Perjalanan': [
      { type: 'kak', isRequired: true },
      { type: 'form_permintaan', isRequired: true },
      { type: 'undangan', isRequired: true },
      { type: 'jadwal_kegiatan', isRequired: true },
      { type: 'surat_tugas', isRequired: true },
      { type: 'daftar_hadir', isRequired: true },
      { type: 'notulen_dokumentasi_rapat', isRequired: true },
      { type: 'daftar_uang_harian', isRequired: true },
      { type: 'ssp', isRequired: false },
    ],
  },
};

// Jenis belanja yang tersedia
export const JENIS_BELANJA_OPTIONS = Object.keys(SUB_JENIS_BELANJA);

// Fungsi untuk mendapatkan dokumen berdasarkan jenis dan sub-jenis belanja
export function getDocumentsByJenisBelanja(jenisBelanja: string, subJenis?: string): Document[] {
  // Jika ada sub-jenis, gunakan mapping spesifik
  if (subJenis && SUB_JENIS_DOCUMENTS[jenisBelanja]?.[subJenis]) {
    const documentConfigs = SUB_JENIS_DOCUMENTS[jenisBelanja][subJenis];
    return documentConfigs.map(config => ({
      type: config.type,
      name: DOCUMENT_LABELS[config.type] || config.type,
      isRequired: config.isRequired,
      isChecked: false,
    }));
  }
  
  // Fallback: return empty if no sub-jenis selected yet
  return [];
}

// Generate ID in format CEK-yymmxxx
export function generateSubmissionId(existingIds: string[]): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `CEK-${yy}${mm}`;
  
  // Find existing IDs with the same prefix and get the max sequence
  const existingSeqs = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.slice(-3), 10))
    .filter(n => !isNaN(n));
  
  const nextSeq = existingSeqs.length > 0 ? Math.max(...existingSeqs) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

// Format date as HH:mm - DD/MM/YYYY
export function formatDateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

// Role permissions
export function canCreateSubmission(role: UserRole): boolean {
  return role === 'admin' || role === 'user';
}

export function canViewDetail(role: UserRole, status: SubmissionStatus): boolean {
  if (role === 'admin') return true;
  
  if (role === 'ppk') {
    return ['pending_ppk', 'incomplete_ppk', 'sent_kppn'].includes(status);
  }
  
  if (role === 'bendahara') {
    return ['pending_bendahara', 'incomplete_bendahara'].includes(status);
  }
  
  if (role === 'user') {
    return true; // Can view all but only status
  }
  
  return false;
}

export function canEdit(role: UserRole, status: SubmissionStatus): boolean {
  if (role === 'admin') return true;
  
  if (role === 'user') {
    return status === 'incomplete_sm';
  }
  
  return false;
}

export function canTakeAction(role: UserRole, status: SubmissionStatus): boolean {
  if (role === 'admin') return true;
  
  if (role === 'ppk') {
    return ['pending_ppk', 'incomplete_ppk'].includes(status);
  }
  
  if (role === 'bendahara') {
    return ['pending_bendahara', 'incomplete_bendahara'].includes(status);
  }
  
  return false;
}

export function canReturnFromKppn(role: UserRole, status: SubmissionStatus): boolean {
  return role === 'ppk' && status === 'sent_kppn';
}
