import { Submission, Document, DOCUMENT_LABELS, DocumentType } from '@/types/submission';

const createDocuments = (types: { type: DocumentType; isRequired: boolean; isChecked: boolean }[]): Document[] => {
  return types.map(({ type, isRequired, isChecked }) => ({
    type,
    name: DOCUMENT_LABELS[type] || type,
    isRequired,
    isChecked,
  }));
};

export const mockSubmissions: Submission[] = [
  {
    id: 'SUB-001',
    title: 'Pengadaan ATK Bulan Desember 2024',
    jenisBelanja: 'Belanja Barang Persediaan',
    submitterName: 'Ahmad Fauzi',
    submittedAt: new Date('2024-12-20'),
    status: 'pending_ppk',
    documents: createDocuments([
      { type: 'kak', isRequired: true, isChecked: true },
      { type: 'form_permintaan', isRequired: true, isChecked: true },
      { type: 'komitmen_kontrak', isRequired: true, isChecked: false },
      { type: 'bukti_prestasi', isRequired: true, isChecked: false },
    ]),
  },
  {
    id: 'SUB-002',
    title: 'Perjalanan Dinas Monitoring Lapangan',
    jenisBelanja: 'Perjalanan Dinas',
    submitterName: 'Siti Nurhaliza',
    submittedAt: new Date('2024-12-18'),
    status: 'pending_bendahara',
    documents: createDocuments([
      { type: 'surat_tugas', isRequired: true, isChecked: true },
      { type: 'kuitansi', isRequired: true, isChecked: true },
      { type: 'visum', isRequired: true, isChecked: true },
    ]),
    waktuPengajuan: '10:00 - 18/12/2024',
    waktuPpk: '14:00 - 19/12/2024',
  },
  {
    id: 'SUB-003',
    title: 'Honor Petugas Sensus Ekonomi',
    jenisBelanja: 'Honorarium',
    submitterName: 'Budi Santoso',
    submittedAt: new Date('2024-12-15'),
    status: 'sent_kppn',
    documents: createDocuments([
      { type: 'sk_kpa', isRequired: true, isChecked: true },
      { type: 'daftar_hadir', isRequired: true, isChecked: true },
      { type: 'rekap_honor', isRequired: true, isChecked: true },
    ]),
    waktuPengajuan: '09:00 - 15/12/2024',
    waktuPpk: '11:00 - 16/12/2024',
    waktuBendahara: '10:00 - 17/12/2024',
  },
  {
    id: 'SUB-004',
    title: 'Rapat Koordinasi Statistik Daerah',
    jenisBelanja: 'Belanja Bahan',
    submitterName: 'Dewi Lestari',
    submittedAt: new Date('2024-12-22'),
    status: 'incomplete_sm',
    documents: createDocuments([
      { type: 'undangan', isRequired: true, isChecked: true },
      { type: 'daftar_hadir', isRequired: true, isChecked: false },
      { type: 'komitmen_kontrak', isRequired: true, isChecked: false },
    ]),
    notes: 'Daftar hadir belum ditandatangani dan kuitansi belum lengkap',
  },
  {
    id: 'SUB-005',
    title: 'Pengadaan Laptop Kerja',
    jenisBelanja: 'Belanja Barang Persediaan',
    submitterName: 'Rizky Pratama',
    submittedAt: new Date('2024-12-21'),
    status: 'incomplete_ppk',
    documents: createDocuments([
      { type: 'kak', isRequired: true, isChecked: true },
      { type: 'form_permintaan', isRequired: true, isChecked: true },
      { type: 'bast', isRequired: true, isChecked: true },
      { type: 'komitmen_kontrak', isRequired: true, isChecked: true },
      { type: 'bukti_prestasi', isRequired: true, isChecked: false },
    ]),
    waktuPengajuan: '08:00 - 21/12/2024',
    waktuPpk: '16:00 - 22/12/2024',
    notes: 'Faktur pajak perlu diverifikasi ulang',
  },
  {
    id: 'SUB-006',
    title: 'Pelatihan Enumerator Survei',
    jenisBelanja: 'Honorarium',
    submitterName: 'Andi Wijaya',
    submittedAt: new Date('2024-12-23'),
    status: 'pending_ppk',
    documents: createDocuments([
      { type: 'kak', isRequired: true, isChecked: true },
      { type: 'undangan', isRequired: true, isChecked: true },
      { type: 'daftar_hadir', isRequired: true, isChecked: true },
      { type: 'rekap_honor', isRequired: true, isChecked: true },
    ]),
  },
];
