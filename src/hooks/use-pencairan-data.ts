import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Submission, Document, SubmissionStatus } from '@/types/pencairan';

const SPREADSHEET_ID = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
const SHEET_NAME = 'data';
const MASTER_SHEET_NAME = 'IMP.ORGANIK';

export interface PencairanRawData {
  id: string;
  title: string;
  submitterName: string;
  jenisBelanja: string;
  documents: string;
  notes: string;
  status: string;
  waktuPengajuan: string;
  waktuBendahara: string;
  waktuPpk: string;
  waktuPPSPM: string;
  waktuKppn: string;
  waktuArsip: string;
  statusBendahara: string;
  statusPpk: string;
  statusPPSPM: string;
  statusArsip: string;
  updatedAt: string;
  user?: string; // 🆕 Kolom R - role login yang membuat pengajuan
  pembayaran?: string; // 🆕 Kolom S - LS atau UP
  nomorSPM?: string; // 🆕 Kolom T - nomor SPM untuk LS
  nomorSPPD?: string; // 🆕 Kolom U - nomor SPPD untuk Arsip
  totalNilai?: string; // 🆕 Kolom V - Nominal
}

export interface OrganikData {
  nip: string;
  nama: string;
  jabatan: string;
  pangkat: string;
  golongan: string;
}

// Fungsi untuk parse documents string ke array Document
function parseDocuments(documentsStr: string): Document[] {
  if (!documentsStr) return [];
  
  const docNames = documentsStr.split('|').filter(name => name.trim() !== '');
  return docNames.map(name => ({
    type: name.toLowerCase().replace(/\s+/g, '_'),
    name: name.trim(),
    isRequired: true,
    isChecked: true,
  }));
}

// Fungsi untuk parse tanggal dengan format "HH:mm - dd/MM/yyyy"
function parseCustomDate(dateStr: string): Date {
  if (!dateStr || dateStr.trim() === '') return new Date();
  
  try {
    // Format: "HH:mm - dd/MM/yyyy"
    const [timePart, datePart] = dateStr.split(' - ');
    if (!timePart || !datePart) return new Date();
    
    const [hours, minutes] = timePart.split(':').map(Number);
    const [day, month, year] = datePart.split('/').map(Number);
    
    // Year mungkin 2 digit, convert ke 4 digit
    const fullYear = year < 100 ? 2000 + year : year;
    
    return new Date(fullYear, month - 1, day, hours, minutes);
  } catch (error) {
    console.warn('Failed to parse date:', dateStr, error);
    return new Date();
  }
}

// Fungsi untuk mapping raw data ke Submission object
function mapRawToSubmission(raw: PencairanRawData): Submission {
  // Parse jenisBelanja untuk mendapatkan jenis dan sub-jenis
  const jenisParts = raw.jenisBelanja.split(' - ');
  
  // Konversi status string ke SubmissionStatus (13 statuses)
  const statusMap: Record<string, SubmissionStatus> = {
    'draft': 'draft',
    'submitted_sm': 'submitted_sm',
    'pending_bendahara': 'pending_bendahara',
    'pending_ppk': 'pending_ppk',
    'pending_ppspm': 'pending_ppspm',
    'pending_kppn': 'pending_kppn',
    'pending_arsip': 'pending_arsip',
    'completed': 'completed',
    'rejected_sm': 'rejected_sm',
    'rejected_bendahara': 'rejected_bendahara',
    'rejected_ppk': 'rejected_ppk',
    'rejected_ppspm': 'rejected_ppspm',
    'rejected_kppn': 'rejected_kppn',
  };
  
  const status: SubmissionStatus = statusMap[raw.status] || 'draft';

  return {
    id: raw.id,
    title: raw.title,
    submitterName: raw.submitterName,
    jenisBelanja: jenisParts[0] || raw.jenisBelanja,
    subJenisBelanja: jenisParts[1] || '',
    status,
    submittedAt: parseCustomDate(raw.waktuPengajuan),
    updatedAt: raw.updatedAt ? parseCustomDate(raw.updatedAt) : undefined,
    updatedAtString: raw.updatedAt,
    documents: parseDocuments(raw.documents),
    notes: raw.notes,
    waktuPengajuan: raw.waktuPengajuan,
    waktuBendahara: raw.waktuBendahara,
    waktuPpk: raw.waktuPpk,
    waktuPPSPM: raw.waktuPPSPM,
    waktuKppn: raw.waktuKppn,
    waktuArsip: raw.waktuArsip,
    statusBendahara: raw.statusBendahara,
    statusPpk: raw.statusPpk,
    statusPPSPM: raw.statusPPSPM,
    statusArsip: raw.statusArsip,
    user: raw.user, // 🆕 Kolom R - role login pembuat
    pembayaran: (raw.pembayaran === 'UP' || raw.pembayaran === 'LS') ? raw.pembayaran : undefined, // 🆕 Kolom S - LS atau UP
    nomorSPM: raw.nomorSPM, // 🆕 Kolom T - nomor SPM untuk LS
    nomorSPPD: raw.nomorSPPD, // 🆕 Kolom U - nomor SPPD untuk Arsip
  };
}

export function usePencairanData() {
  return useQuery({
    queryKey: ['pencairan-data'],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase.functions.invoke('read-sheets', {
        body: {
          sheetType: 'submissions',
          spreadsheetId: SPREADSHEET_ID,
          sheetName: SHEET_NAME,
          range: 'A:U',
        },
      });

      if (error) {
        console.error('Error fetching pencairan data:', error);
        throw error;
      }

      // read-sheets returns { success, data: [...objects] }
      const rows = data?.data || [];
      if (rows.length === 0) return [];

      const submissions: Submission[] = rows.map((row: any) => {
        const rawData: PencairanRawData = {
          id: row.id || '',
          title: row.title || '',
          submitterName: row.submitterName || '',
          jenisBelanja: row.jenisBelanja || '',
          documents: row.documents || '',
          notes: row.notes || '',
          status: row.status || 'draft',
          waktuPengajuan: row.waktuPengajuan || '',
          waktuBendahara: row.waktuBendahara || '',
          waktuPpk: row.waktuPpk || '',
          waktuPPSPM: row.waktuPPSPM || '',
          waktuKppn: row.waktuKppn || '',
          waktuArsip: row.waktuArsip || row.waktuKppn || '',
          statusBendahara: row.statusBendahara || '',
          statusPpk: row.statusPpk || '',
          statusPPSPM: row.statusPPSPM || '',
          statusArsip: row.statusArsip || '',
          updatedAt: row.updatedAt || '',
          user: row.user || '',
          pembayaran: row.pembayaran || '',
          nomorSPM: row.nomorSPM || '',
          nomorSPPD: row.nomorSPPD || '',
        };
        
        return mapRawToSubmission(rawData);
      });

      // Sort submissions by full ID descending (newest first)
      // Format: SUBYYMMXXX - higher numbers = newer
      const sortedSubmissions = submissions.sort((a, b) => {
        const aNum = parseInt(a.id.substring(5)); // SUBYYMMXXX - ambil dari index 5 (YYMMXXX = 5 digit)
        const bNum = parseInt(b.id.substring(5));
        return bNum - aNum; // Descending
      });

      return sortedSubmissions;
    },
    refetchInterval: 30000,
  });
}

export function useOrganikPencairan() {
  return useQuery({
    queryKey: ['organik-pencairan-master'],
    queryFn: async (): Promise<OrganikData[]> => {
      const { data, error } = await supabase.functions.invoke('read-sheets', {
        body: {
          sheetType: 'organik',
          spreadsheetId: SPREADSHEET_ID,
          sheetName: MASTER_SHEET_NAME,
          range: 'A:G',
        },
      });

      if (error) {
        console.error('Error fetching organik data:', error);
        throw error;
      }

      const rows = data?.data || [];
      if (rows.length === 0) return [];

      return rows
        .map((row: any) => ({
          nip: row.nip || row[0] || '',
          nama: row.nama || row[3] || '',
          jabatan: row.jabatan || row[4] || '',
          pangkat: row.pangkat || row[5] || '',
          golongan: row.golongan || row[6] || '',
        }))
        .filter((item: OrganikData) => item.nama.trim() !== '');
    },
  });
}