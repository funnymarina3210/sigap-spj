// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateData {
  id: string;
  status: string;
  notes?: string;
  actor: 'ppk' | 'bendahara' | 'kppn' | 'user';
  action: 'approve' | 'reject' | 'return' | 'edit';
  updateNotesOnly?: boolean;
  updateDataOnly?: boolean;
  // Fields for editing
  title?: string;
  submitterName?: string;
  jenisBelanja?: string;
  documents?: string;
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

async function findRowById(accessToken: string, spreadsheetId: string, sheetName: string, id: string): Promise<number | null> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A:A')}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to read sheet: ${errorText}`);
  }

  const result = await response.json();
  const values = result.values || [];
  
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === id) {
      return i + 1; // 1-indexed row number
    }
  }
  
  return null;
}

async function updateCell(accessToken: string, spreadsheetId: string, range: string, value: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update cell: ${errorText}`);
  }
}

// Map internal status code to readable text
function getStatusText(statusCode: string): string {
  const statusMap: Record<string, string> = {
    'pending_ppk': 'Menunggu Verifikasi PPK',
    'incomplete_sm': 'Dikembalikan ke SM',
    'pending_bendahara': 'Menunggu Verifikasi Bendahara',
    'incomplete_ppk': 'Dikembalikan ke PPK',
    'incomplete_bendahara': 'Dikembalikan ke Bendahara',
    'sent_kppn': 'Sudah Kirim KPPN',
  };
  return statusMap[statusCode] || statusCode;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const updateData: UpdateData = await req.json();
    
    console.log('Updating status for:', updateData);

    const accessToken = await getAccessToken(serviceAccount);
    
    const spreadsheetId = '1fVVqmK0LANErtoiuSlKY8YAk9Nsu4sXQ33BwzRlQhNE';
    const sheetName = 'data';
    
    // Find the row with the matching ID
    const rowNumber = await findRowById(accessToken, spreadsheetId, sheetName, updateData.id);
    
    if (!rowNumber) {
      throw new Error(`Submission with ID ${updateData.id} not found`);
    }

    console.log('Found row:', rowNumber);

    const formattedDate = formatDateTime(new Date());
    const statusText = getStatusText(updateData.status);
    
    // Column mapping:
    // G: Status Pengajuan, H: Waktu Pengajuan
    // I: Status PPK, J: Waktu PPK
    // K: Status Bendahara, L: Waktu Bendahara
    // M: Status KPPN
    
    // Update notes if provided (column F)
    if (updateData.notes) {
      await updateCell(accessToken, spreadsheetId, `${sheetName}!F${rowNumber}`, updateData.notes);
    }

    // If updating data only (edit mode), update all relevant columns
    if (updateData.updateDataOnly) {
      // Column mapping: B: Uraian, C: Nama Pengaju, D: Jenis Pengajuan, E: Kelengkapan, F: Catatan
      if (updateData.title) {
        await updateCell(accessToken, spreadsheetId, `${sheetName}!B${rowNumber}`, updateData.title);
      }
      if (updateData.submitterName) {
        await updateCell(accessToken, spreadsheetId, `${sheetName}!C${rowNumber}`, updateData.submitterName);
      }
      if (updateData.jenisBelanja) {
        await updateCell(accessToken, spreadsheetId, `${sheetName}!D${rowNumber}`, updateData.jenisBelanja);
      }
      if (updateData.documents) {
        await updateCell(accessToken, spreadsheetId, `${sheetName}!E${rowNumber}`, updateData.documents);
      }
      
      console.log('Data updated successfully (edit mode)');
      return new Response(
        JSON.stringify({ success: true, message: 'Data updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If only updating notes, return early
    if (updateData.updateNotesOnly) {
      console.log('Notes updated successfully (notes only mode)');
      return new Response(
        JSON.stringify({ success: true, message: 'Notes updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle status updates based on actor and action
    if (updateData.actor === 'ppk') {
      if (updateData.action === 'approve') {
        // PPK approves -> move to bendahara
        await updateCell(accessToken, spreadsheetId, `${sheetName}!G${rowNumber}`, statusText);
        await updateCell(accessToken, spreadsheetId, `${sheetName}!I${rowNumber}`, 'Disetujui');
        await updateCell(accessToken, spreadsheetId, `${sheetName}!J${rowNumber}`, formattedDate);
      } else if (updateData.action === 'reject') {
        // PPK rejects -> return to SM
        await updateCell(accessToken, spreadsheetId, `${sheetName}!G${rowNumber}`, statusText);
        await updateCell(accessToken, spreadsheetId, `${sheetName}!I${rowNumber}`, 'Dikembalikan');
        await updateCell(accessToken, spreadsheetId, `${sheetName}!J${rowNumber}`, formattedDate);
      }
    } else if (updateData.actor === 'bendahara') {
      if (updateData.action === 'approve') {
        // Bendahara approves -> send to KPPN
        await updateCell(accessToken, spreadsheetId, `${sheetName}!G${rowNumber}`, statusText);
        await updateCell(accessToken, spreadsheetId, `${sheetName}!K${rowNumber}`, 'Disetujui');
        await updateCell(accessToken, spreadsheetId, `${sheetName}!L${rowNumber}`, formattedDate);
        // Also update KPPN status
        if (updateData.status === 'sent_kppn') {
          await updateCell(accessToken, spreadsheetId, `${sheetName}!M${rowNumber}`, 'Sudah Dikirim');
        }
      } else if (updateData.action === 'reject') {
        // Bendahara rejects -> return to PPK, update Status PPK column
        await updateCell(accessToken, spreadsheetId, `${sheetName}!G${rowNumber}`, statusText);
        await updateCell(accessToken, spreadsheetId, `${sheetName}!I${rowNumber}`, 'Dikembalikan ke PPK');
        await updateCell(accessToken, spreadsheetId, `${sheetName}!J${rowNumber}`, formattedDate);
      }
    } else if (updateData.actor === 'kppn') {
      if (updateData.action === 'return') {
        // KPPN returns -> update Status Bendahara column
        await updateCell(accessToken, spreadsheetId, `${sheetName}!G${rowNumber}`, statusText);
        await updateCell(accessToken, spreadsheetId, `${sheetName}!K${rowNumber}`, 'Dikembalikan ke Bendahara');
        await updateCell(accessToken, spreadsheetId, `${sheetName}!L${rowNumber}`, formattedDate);
        await updateCell(accessToken, spreadsheetId, `${sheetName}!M${rowNumber}`, 'Dikembalikan');
      }
    }

    console.log('Status updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Status updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in update-status function:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
