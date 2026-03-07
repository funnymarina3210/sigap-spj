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

      const rows = data?.values || [];
      if (rows.length <= 1) return [];

      // Skip header row dan map ke Submission[]
      const submissions: Submission[] = rows.slice(1).map((row: string[]) => {
        // Deteksi struktur: 
        // OLD: Tanpa Waktu Bendahara (A-P, 16 kolom): H=Pengajuan, I=PPK, J=PPSPM, K=Arsip/KPPN, L=StatusBendahara
        // CURRENT: Dengan Waktu Bendahara (A-Q, 17 kolom): H=Pengajuan, I=Bendahara, J=PPK, K=PPSPM, L=Arsip/KPPN, M=StatusBendahara
        // NEW: Dengan Waktu Bendahara + User (A-R, 18 kolom): ...Q=Update, R=User
        // Catatan: KPPN = Arsip (mereka adalah tahap yang sama)
        let rawData: PencairanRawData;
        
        if (row.length < 17) {
          // OLD STRUCTURE (A-P, 16 kolom) - TANPA Waktu Bendahara
          // H=7(Pengajuan), I=8(PPK), J=9(PPSPM), K=10(Arsip/KPPN), L=11(StatusBendahara), M=12(StatusPPK), N=13(StatusPPSPM), O=14(StatusArsip), P=15(Update)
          rawData = {
            id: row[0] || '',
            title: row[1] || '',
            submitterName: row[2] || '',
            jenisBelanja: row[3] || '',
            documents: row[4] || '',
            notes: row[5] || '',
            status: row[6] || 'pending_ppk',
            waktuPengajuan: row[7] || '',
            waktuBendahara: '', // Tidak ada di struktur lama!
            waktuPpk: row[8] || '',
            waktuPPSPM: row[9] || '',
            waktuKppn: row[10] || '', // Arsip/KPPN (sama)
            waktuArsip: row[10] || '', // Arsip/KPPN (sama)
            statusBendahara: row[11] || '',
            statusPpk: row[12] || '',
            statusPPSPM: row[13] || '',
            statusArsip: row[14] || '',
            updatedAt: row[15] || '',
            user: '', // Tidak ada di struktur lama
            pembayaran: '', // Tidak ada di struktur lama
            nomorSPM: '', // Tidak ada di struktur lama
            nomorSPPD: '', // Tidak ada di struktur lama
          };
        } else if (row.length < 18) {
          // STRUCTURE (A-Q, 17 kolom) - DENGAN Waktu Bendahara, TANPA User
          // H=7(Pengajuan), I=8(Bendahara), J=9(PPK), K=10(PPSPM), L=11(Arsip/KPPN), M=12(StatusBendahara), N=13(StatusPPK), O=14(StatusPPSPM), P=15(StatusArsip), Q=16(Update)
          rawData = {
            id: row[0] || '',
            title: row[1] || '',
            submitterName: row[2] || '',
            jenisBelanja: row[3] || '',
            documents: row[4] || '',
            notes: row[5] || '',
            status: row[6] || 'pending_ppk',
            waktuPengajuan: row[7] || '',
            waktuBendahara: row[8] || '',
            waktuPpk: row[9] || '',
            waktuPPSPM: row[10] || '',
            waktuKppn: row[11] || '', // Arsip/KPPN (sama)
            waktuArsip: row[11] || '', // Arsip/KPPN (sama)
            statusBendahara: row[12] || '',
            statusPpk: row[13] || '',
            statusPPSPM: row[14] || '',
            statusArsip: row[15] || '',
            updatedAt: row[16] || '',
            user: '', // Tidak ada di struktur ini
            pembayaran: '', // Tidak ada di struktur ini
            nomorSPM: '', // Tidak ada di struktur ini
            nomorSPPD: '', // Tidak ada di struktur ini
          };
        } else {
          // NEW STRUCTURE (A-R+, 18+ kolom) - DENGAN Waktu Bendahara + User + Pembayaran + SPM + SPPD
          // H=7(Pengajuan), I=8(Bendahara), J=9(PPK), K=10(PPSPM), L=11(Arsip/KPPN), M=12(StatusBendahara), N=13(StatusPPK), O=14(StatusPPSPM), P=15(StatusArsip), Q=16(Update), R=17(User), S=18(Pembayaran), T=19(NomorSPM), U=20(NomorSPPD)
          rawData = {
            id: row[0] || '',
            title: row[1] || '',
            submitterName: row[2] || '',
            jenisBelanja: row[3] || '',
            documents: row[4] || '',
            notes: row[5] || '',
            status: row[6] || 'pending_ppk',
            waktuPengajuan: row[7] || '',
            waktuBendahara: row[8] || '',
            waktuPpk: row[9] || '',
            waktuPPSPM: row[10] || '',
            waktuKppn: row[11] || '', // Arsip/KPPN (sama)
            waktuArsip: row[11] || '', // Arsip/KPPN (sama)
            statusBendahara: row[12] || '',
            statusPpk: row[13] || '',
            statusPPSPM: row[14] || '',
            statusArsip: row[15] || '',
            updatedAt: row[16] || '',
            user: row[17] || '', // 🆕 Kolom R - role login pembuat
            pembayaran: row[18] || '', // 🆕 Kolom S - LS atau UP
            nomorSPM: row[19] || '', // 🆕 Kolom T - nomor SPM untuk LS
            nomorSPPD: row[20] || '', // 🆕 Kolom U - nomor SPPD untuk Arsip
          };
        }
        
        // Debug: Log struktur dan waktu columns
        if (row[0]) {
          console.log(`Row ${row[0]} (len=${row.length}): pengajuan=${rawData.waktuPengajuan}, bendahara=${rawData.waktuBendahara}, ppk=${rawData.waktuPpk}, ppspm=${rawData.waktuPPSPM}, kppn=${rawData.waktuKppn}, arsip=${rawData.waktuArsip}`);
        }
        
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