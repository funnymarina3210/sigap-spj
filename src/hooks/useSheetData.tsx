import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Organik {
  no: string;
  nipBps: string;
  nip: string;
  nama: string;
  jabatan: string;
  kecamatan: string;
  golAkhir: string;
}

interface SheetSubmission {
  id: string;
  title: string;
  submitterName: string;
  jenisBelanja: string;
  documents: string;
  notes: string;
  status: string;
  updatedAt: string;
  // Waktu per tahapan
  waktuPengajuan: string;
  waktuPpk: string;
  waktuBendahara: string;
  // Status per tahapan
  statusPpk: string;
  statusBendahara: string;
  statusKppn: string;
}

export function useOrganikData() {
  const [data, setData] = useState<Organik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: response, error: fetchError } = await supabase.functions.invoke('read-sheets', {
        body: { sheetType: 'organik' },
      });

      if (fetchError) throw fetchError;
      
      if (response?.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response?.error || 'Failed to fetch organik data');
      }
    } catch (err) {
      console.error('Error fetching organik:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useSubmissionsData() {
  const [data, setData] = useState<SheetSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: response, error: fetchError } = await supabase.functions.invoke('read-sheets', {
        body: { sheetType: 'submissions' },
      });

      if (fetchError) throw fetchError;
      
      if (response?.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response?.error || 'Failed to fetch submissions data');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
