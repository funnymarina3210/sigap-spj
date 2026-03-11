// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmissionData {
  id: string;
  title: string;
  submitterName: string;
  jenisBelanja: string;
  documents: string;
  notes?: string;
  status: string;
  totalNilai?: number;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (data: object | string): string => {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const claimEncoded = base64UrlEncode(claim);
  const signatureInput = `${headerEncoded}.${claimEncoded}`;

  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signatureInput}.${signatureEncoded}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Format date with Jakarta timezone (UTC+7)
function formatDateTime(date: Date): string {
  // Convert to Jakarta time (UTC+7)
  const jakartaOffset = 7 * 60; // 7 hours in minutes
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const jakartaTime = new Date(utcTime + (jakartaOffset * 60000));
  
  const hours = String(jakartaTime.getHours()).padStart(2, '0');
  const minutes = String(jakartaTime.getMinutes()).padStart(2, '0');
  const day = String(jakartaTime.getDate()).padStart(2, '0');
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const year = jakartaTime.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

// Read existing IDs to generate next sequence number
async function getExistingIds(accessToken: string, spreadsheetId: string, sheetName: string): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A:A')}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error('Failed to read existing IDs');
    return [];
  }

  const result = await response.json();
  const values = result.values || [];
  
  // Skip header row and get all IDs
  return values.slice(1).map((row: string[]) => row[0] || '').filter((id: string) => id);
}

// Generate ID in format CEK-yymmxxx
function generateSubmissionId(existingIds: string[]): string {
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

async function appendToSheet(accessToken: string, spreadsheetId: string, sheetName: string, values: (string | number)[][]): Promise<void> {
  const range = `${sheetName}!A:V`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  console.log('Appending to sheet:', { spreadsheetId, sheetName, valuesLength: values.length, rowData: values[0] });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Sheet append failed:', response.status, errorText);
    throw new Error(`Failed to append to sheet: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Sheet append success:', result.updates);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const submission: SubmissionData = await req.json();
    
    console.log('Received submission:', {
      id: submission.id,
      title: submission.title,
      submitterName: submission.submitterName,
      jenisBelanja: submission.jenisBelanja,
    });

    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained successfully');

    const spreadsheetId = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
    const sheetName = 'data';

    // Get existing IDs to generate correct next ID
    const existingIds = await getExistingIds(accessToken, spreadsheetId, sheetName);
    const finalId = submission.id || generateSubmissionId(existingIds);

    const now = new Date();
    const formattedDate = formatDateTime(now);

    // New Headers: 
    // ID | Uraian Pengajuan | Nama Pengaju | Jenis Pengajuan | Kelengkapan | Catatan | 
    // Status Pengajuan | Waktu Pengajuan | Status PPK | Waktu PPK | Status Bendahara | Waktu Bendahara | Status KPPN
    const rowData = [
      [
        finalId,                         // A: ID
        submission.title,                // B: Uraian Pengajuan
        submission.submitterName,        // C: Nama Pengaju
        submission.jenisBelanja,         // D: Jenis Pengajuan
        submission.documents,            // E: Kelengkapan
        submission.notes || '',          // F: Catatan
        'Menunggu Verifikasi PPK',       // G: Status Pengajuan
        formattedDate,                   // H: Waktu Pengajuan
        '',                              // I: Waktu Bendahara
        '',                              // J: Waktu PPK
        '',                              // K: Waktu PPSPM
        '',                              // L: Waktu Arsip
        '',                              // M: Status Bendahara
        '',                              // N: Status PPK
        '',                              // O: Status PPSPM
        '',                              // P: Status Arsip
        '',                              // Q: Updated At
        '',                              // R: User
        '',                              // S: Pembayaran
        '',                              // T: Nomor SPM
        '',                              // U: Nomor SPPD
        submission.totalNilai || '',     // V: Nominal
      ],
    ];

    await appendToSheet(accessToken, spreadsheetId, sheetName, rowData);

    return new Response(
      JSON.stringify({ success: true, message: 'Data saved to Google Sheets', id: finalId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in save-to-sheets function:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
