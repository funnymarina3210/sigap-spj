// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SPREADSHEET_ID = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
const SHEET_NAME = 'data';

// Column mappings (0-based indices)
const COLUMNS = {
  ID: 0,              // A
  uraianPengajuan: 1, // B
  namaPengaju: 2,     // C
  jenisPengajuan: 3,  // D
  kelengkapan: 4,     // E
  catatan: 5,         // F
  status: 6,          // G
  waktuSM: 7,         // H - submitted to SM
  waktuBendahara: 8,  // I
  waktuPPK: 9,        // J
  waktuPPSPM: 10,     // K
  waktuArsip: 11,     // L - for KPPN/Arsip
  statusBendahara: 12,// M - notes from Bendahara
  statusPPK: 13,      // N - notes from PPK
  statusPPSPM: 14,    // O - notes from PPSPM
  statusArsip: 15,    // P - notes from Arsip
  updatedAt: 16,      // Q
  userRolePembuat: 17,// R
  pembayaran: 18,     // S - LS or UP
  nomorSPM: 19,       // T
  nomorSPPD: 20,      // U
};

async function getAccessToken() {
  console.log('Getting access token for pencairan-update...');
  
  // @ts-ignore - Deno API
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('Missing Google credentials');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const privateKey = serviceAccount.private_key;
  const serviceAccountEmail = serviceAccount.client_email;

  if (!privateKey || !serviceAccountEmail) {
    throw new Error('Missing Google credentials in service account JSON');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsignedToken));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${unsignedToken}.${encodedSignature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  
  return tokenData.access_token;
}

function formatDateTime(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  };
  
  const formatter = new Intl.DateTimeFormat('id-ID', options);
  const parts = formatter.formatToParts(now);
  
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const hours = getPart('hour').padStart(2, '0');
  const minutes = getPart('minute').padStart(2, '0');
  const day = getPart('day').padStart(2, '0');
  const month = getPart('month').padStart(2, '0');
  const year = getPart('year');
  
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

// Generate SPPD number format: SPPD-2026-001
function generateSPPDNumber(id: string): string {
  const year = new Date().getFullYear();
  const sequence = id.substring(5); // Extract number from ID like "SPJB-001" -> "001"
  return `SPPD-${year}-${sequence}`;
}

serve(async (req: Request) => {
  console.log('pencairan-update function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const {
      id,
      status,
      uraianPengajuan,
      namaPengaju,
      jenisPengajuan,
      kelengkapan,
      catatan,
      actor,      // UserRole
      action,     // 'approve' | 'reject' | 'submit' | 'save_draft'
      pembayaran, // 'LS' | 'UP' (from Bendahara)
      nomorSPM,   // SPM number (from Bendahara for LS)
    } = body;
    
    if (!id || !status) {
      throw new Error('ID and status are required');
    }

    const accessToken = await getAccessToken();
    const spreadsheetId = DEFAULT_SPREADSHEET_ID;
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    
    // Fetch all data from sheet
    const getResponse = await fetch(
      `${baseUrl}/values/${SHEET_NAME}!A:U`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch data: ${getResponse.statusText}`);
    }

    const getData = await getResponse.json();
    const rows = getData.values || [];
    const waktuUpdate = formatDateTime();

    if (rows.length <= 1) {
      throw new Error('No data found in sheet');
    }

    // Find row with matching ID
    let foundRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][COLUMNS.ID] === id) {
        foundRowIndex = i;
        break;
      }
    }

    if (foundRowIndex === -1) {
      throw new Error(`Submission with ID ${id} not found`);
    }

    // Update row data
    const updatedRow = [...rows[foundRowIndex]];
    
    // Update basic fields if provided
    if (uraianPengajuan) updatedRow[COLUMNS.uraianPengajuan] = uraianPengajuan;
    if (namaPengaju) updatedRow[COLUMNS.namaPengaju] = namaPengaju;
    if (jenisPengajuan) updatedRow[COLUMNS.jenisPengajuan] = jenisPengajuan;
    if (kelengkapan) updatedRow[COLUMNS.kelengkapan] = kelengkapan;
    if (catatan) updatedRow[COLUMNS.catatan] = catatan;

    // Update status
    updatedRow[COLUMNS.status] = status;

    // Update workflow stage timestamps based on new status
    // Only set timestamp if not already set (first time reaching this stage)
    if (status === 'submitted_sm' && !updatedRow[COLUMNS.waktuSM]) {
      updatedRow[COLUMNS.waktuSM] = waktuUpdate;
    }
    if (status === 'pending_bendahara' && !updatedRow[COLUMNS.waktuBendahara]) {
      updatedRow[COLUMNS.waktuBendahara] = waktuUpdate;
    }
    if (status === 'pending_ppk' && !updatedRow[COLUMNS.waktuPPK]) {
      updatedRow[COLUMNS.waktuPPK] = waktuUpdate;
    }
    if (status === 'pending_ppspm' && !updatedRow[COLUMNS.waktuPPSPM]) {
      updatedRow[COLUMNS.waktuPPSPM] = waktuUpdate;
    }
    if ((status === 'pending_kppn' || status === 'pending_arsip' || status === 'completed') && !updatedRow[COLUMNS.waktuArsip]) {
      updatedRow[COLUMNS.waktuArsip] = waktuUpdate;
    }

    // Update role-specific status notes (only from that role)
    if (actor === 'Bendahara' && catatan) {
      updatedRow[COLUMNS.statusBendahara] = catatan;
    }
    if (actor === 'Pejabat Pembuat Komitmen' && catatan) {
      updatedRow[COLUMNS.statusPPK] = catatan;
    }
    if (actor === 'Pejabat Penandatangan Surat Perintah Membayar' && catatan) {
      updatedRow[COLUMNS.statusPPSPM] = catatan;
    }
    if ((actor === 'KPPN' || actor === 'Arsip') && catatan) {
      updatedRow[COLUMNS.statusArsip] = catatan;
    }

    // Handle Bendahara-specific payment type assignment
    if (actor === 'Bendahara' && pembayaran) {
      updatedRow[COLUMNS.pembayaran] = pembayaran;
      if (pembayaran === 'LS' && nomorSPM) {
        updatedRow[COLUMNS.nomorSPM] = nomorSPM;
      }
    }

    // Generate and set SPPD number when completed
    if (status === 'completed' && !updatedRow[COLUMNS.nomorSPPD]) {
      updatedRow[COLUMNS.nomorSPPD] = generateSPPDNumber(id);
    }

    // Handle rejection flows - clear future stage notes/timestamps
    if (action === 'reject') {
      switch (status) {
        case 'rejected_sm':
          // Rejected by Bendahara - clear Bendahara notes onward
          updatedRow[COLUMNS.statusBendahara] = '';
          updatedRow[COLUMNS.statusPPK] = '';
          updatedRow[COLUMNS.statusPPSPM] = '';
          updatedRow[COLUMNS.statusArsip] = '';
          updatedRow[COLUMNS.waktuPPK] = '';
          updatedRow[COLUMNS.waktuPPSPM] = '';
          updatedRow[COLUMNS.waktuArsip] = '';
          break;
        case 'rejected_bendahara':
          // Rejected by PPK - clear PPK notes onward
          updatedRow[COLUMNS.statusPPK] = '';
          updatedRow[COLUMNS.statusPPSPM] = '';
          updatedRow[COLUMNS.statusArsip] = '';
          updatedRow[COLUMNS.waktuPPSPM] = '';
          updatedRow[COLUMNS.waktuArsip] = '';
          break;
        case 'rejected_ppk':
          // Rejected by PPSPM - clear PPSPM notes onward
          updatedRow[COLUMNS.statusPPSPM] = '';
          updatedRow[COLUMNS.statusArsip] = '';
          updatedRow[COLUMNS.waktuArsip] = '';
          break;
        case 'rejected_ppspm':
          // Rejected by KPPN - clear Arsip notes
          updatedRow[COLUMNS.statusArsip] = '';
          break;
      }
    }

    // Update last modified timestamp
    updatedRow[COLUMNS.updatedAt] = waktuUpdate;

    // Update sheet with batchUpdate
    const rowIndex = foundRowIndex;
    const updateResponse = await fetch(
      `${baseUrl}/values/${SHEET_NAME}!A${rowIndex + 1}:U${rowIndex + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [updatedRow] }),
      }
    );

    const updateData = await updateResponse.json();
    console.log('Update response:', JSON.stringify(updateData));

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${JSON.stringify(updateData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: updateData, rowIndex, newStatus: status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in pencairan-update:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
