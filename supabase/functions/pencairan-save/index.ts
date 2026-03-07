// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SPREADSHEET_ID = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
const SHEET_NAME = 'data';

async function getAccessToken() {
  console.log('Getting access token for pencairan-save...');
  
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

serve(async (req: Request) => {
  console.log('[pencairan-save] Function invoked, method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('[pencairan-save] Request body received:', JSON.stringify(body, null, 2));
    
    const {
      id,
      uraianPengajuan,
      namaPengaju,
      jenisPengajuan,
      kelengkapan,
      catatan,
      statusPengajuan,
      waktuPengajuan,
      user,
      satker,
      title,
      submitterName,
      jenisBelanja,
      documents,
      notes,
      status,
      statusPpk,
      waktuPpk,
      statusBendahara,
      waktuBendahara,
      statusKppn,
    } = body;

    // Validate required fields
    if (!id) {
      throw new Error('Missing required field: id');
    }
    
    console.log('[pencairan-save] Extracted parameters:', {
      id,
      uraianPengajuan: uraianPengajuan?.substring(0, 30),
      namaPengaju,
      statusPengajuan,
      user,
    });
    
    const accessToken = await getAccessToken();
    const spreadsheetId = DEFAULT_SPREADSHEET_ID;
    
    console.log('[pencairan-save] Access token obtained, spreadsheetId:', spreadsheetId);
    
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const resolvedWaktuPengajuan = waktuPengajuan || formatDateTime();

    const rowData = [
      id || '',                                        // A: ID
      uraianPengajuan || title || '',                 // B: Uraian Pengajuan
      namaPengaju || submitterName || '',             // C: Nama Pengaju
      jenisPengajuan || jenisBelanja || '',           // D: Jenis Pengajuan
      kelengkapan || documents || '',                 // E: Kelengkapan
      catatan || notes || '',                         // F: Catatan
      statusPengajuan || status || 'draft',          // G: Status Pengajuan
      resolvedWaktuPengajuan,                         // H: Waktu Pengajuan dari SM
      '',                                             // I: Waktu Bendahara
      '',                                             // J: Waktu PPK
      '',                                             // K: Waktu PPSPM
      '',                                             // L: Waktu Arsip
      '',                                             // M: Status Bendahara
      '',                                             // N: Status PPK
      '',                                             // O: Status PPSPM
      '',                                             // P: Status Arsip
      resolvedWaktuPengajuan,                         // Q: Update terakhir
      user || '',                                     // R: User (role login pembuat)
      '',                                             // S: Pembayaran (kosong untuk baru)
      '',                                             // T: Nomor SPM (kosong untuk baru)
      '',                                             // U: Nomor SPPD (kosong untuk baru)
    ];

    if (rowData.length !== 21) {
      throw new Error(`Row data has ${rowData.length} columns, expected 21`);
    }

    console.log('[pencairan-save] Row data prepared (21 columns)');

    // First, find the next empty row by reading column A
    const findRowUrl = `${baseUrl}/values/${encodeURIComponent(SHEET_NAME + '!A:A')}`;
    console.log('[pencairan-save] Finding next empty row...');
    
    const findResponse = await fetch(findRowUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!findResponse.ok) {
      const errText = await findResponse.text();
      throw new Error(`Failed to read sheet: ${errText}`);
    }
    
    const findData = await findResponse.json();
    const existingRows = findData.values ? findData.values.length : 0;
    const nextRow = existingRows + 1;
    
    console.log('[pencairan-save] Existing rows:', existingRows, '-> Writing to row:', nextRow);
    
    // Write to explicit row range A{nextRow}:U{nextRow}
    const updateUrl = `${baseUrl}/values/${encodeURIComponent(SHEET_NAME + '!A' + nextRow + ':U' + nextRow)}?valueInputOption=USER_ENTERED`;
    console.log('[pencairan-save] Update URL:', updateUrl);

    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [rowData] }),
    });

    console.log('[pencairan-save] Response status:', response.status);
    
    let data;
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[pencairan-save] Raw error response:', errorText);
      try {
        data = JSON.parse(errorText);
      } catch (e) {
        data = { raw: errorText };
      }
      console.error('[pencairan-save] Google Sheets API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: appendUrl,
      });
      throw new Error(`Append failed with status ${response.status}: ${JSON.stringify(data)}`);
    }

    data = await response.json();
    console.log('[pencairan-save] Parsed response:', JSON.stringify(data, null, 2));

    console.log('[pencairan-save] Success! Row appended');
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[pencairan-save] Error caught:', errorMessage);
    console.error('[pencairan-save] Stack:', error instanceof Error ? error.stack : 'no stack');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
