// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(serviceAccount: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
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

async function readSheet(accessToken: string, spreadsheetId: string, sheetName: string, range: string): Promise<string[][]> {
  const fullRange = `${sheetName}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(fullRange)}`;

  console.log('Reading from sheet:', { spreadsheetId, sheetName, range });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Sheet read failed:', response.status, errorText);
    throw new Error(`Failed to read sheet: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Sheet read success, rows:', result.values?.length || 0);
  return result.values || [];
}

// Map status from sheet to internal status code
function mapStatusToCode(statusText: string): string {
  const statusMap: Record<string, string> = {
    'menunggu verifikasi ppk': 'pending_ppk',
    'dikembalikan ke sm': 'rejected_sm',
    'menunggu verifikasi bendahara': 'pending_bendahara',
    'dikembalikan ke ppk': 'rejected_bendahara',
    'dikembalikan ke bendahara': 'rejected_ppk',
    'sudah kirim kppn': 'completed',
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
  
  const lowerStatus = (statusText || '').toLowerCase().trim();
  return statusMap[lowerStatus] || statusText || 'draft';
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
    const { sheetType } = await req.json();
    
    console.log('Reading sheet type:', sheetType);

    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained successfully');

    let data: any[] = [];

    if (sheetType === 'submissions') {
      const spreadsheetId = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
      const values = await readSheet(accessToken, spreadsheetId, 'data', 'A:U');
      
      if (values.length > 1) {
        data = values.slice(1).map((row) => ({
          id: row[0] || '',
          title: row[1] || '',
          submitterName: row[2] || '',
          jenisBelanja: row[3] || '',
          documents: row[4] || '',
          notes: row[5] || '',
          statusPengajuan: row[6] || '',
          waktuPengajuan: row[7] || '',
          waktuBendahara: row[8] || '',
          waktuPpk: row[9] || '',
          waktuPPSPM: row[10] || '',
          waktuArsip: row[11] || '',
          statusBendahara: row[12] || '',
          statusPpk: row[13] || '',
          statusPPSPM: row[14] || '',
          statusArsip: row[15] || '',
          updatedAt: row[16] || '',
          user: row[17] || '',
          pembayaran: row[18] || '',
          nomorSPM: row[19] || '',
          nomorSPPD: row[20] || '',
          status: mapStatusToCode(row[6] || ''),
        }));
      }
    } else if (sheetType === 'organik') {
      // Read organik data for dropdown
      const spreadsheetId = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
      const values = await readSheet(accessToken, spreadsheetId, 'IMP.ORGANIK', 'A:G');
      
      // Skip header row
      if (values.length > 1) {
        data = values.slice(1).map((row) => ({
          no: row[0] || '',
          nipBps: row[1] || '',
          nip: row[2] || '',
          nama: row[3] || '',
          jabatan: row[4] || '',
          kecamatan: row[5] || '',
          golAkhir: row[6] || '',
        }));
      }
    } else if (sheetType === 'users') {
      // Read users for login
      const spreadsheetId = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
      const values = await readSheet(accessToken, spreadsheetId, 'user', 'A:C');
      
      console.log('Users data from sheet:', values);
      
      // Skip header row
      if (values.length > 1) {
        data = values.slice(1).map((row) => ({
          role: row[0] || 'user',
          nama: row[1] || '',
          password: row[2] || '',
        }));
      }
      
      console.log('Parsed users:', data);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in read-sheets function:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
