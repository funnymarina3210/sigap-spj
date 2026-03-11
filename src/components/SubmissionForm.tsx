import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Document, 
  DocumentType, 
  DOCUMENT_LABELS, 
  Submission, 
  generateSubmissionId,
  getDocumentsByJenisBelanja,
  JENIS_BELANJA_OPTIONS,
  SUB_JENIS_BELANJA
} from '@/types/submission';
import { Send, X, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganikData, useSubmissionsData } from '@/hooks/useSheetData';

interface SubmissionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (submission: Omit<Submission, 'id' | 'status'>) => void;
  editData?: Submission | null;
}

export function SubmissionForm({ open, onClose, onSubmit, editData }: SubmissionFormProps) {
  const { data: organikList, isLoading: isLoadingOrganik } = useOrganikData();
  const { data: existingSubmissions } = useSubmissionsData();
  
  const [title, setTitle] = useState(editData?.title || '');
  const [totalNilai, setTotalNilai] = useState(editData?.totalNilai?.toString() || '');
  const [submitterName, setSubmitterName] = useState(editData?.submitterName || '');
  const [jenisBelanja, setJenisBelanja] = useState(editData?.jenisBelanja || '');
  const [subJenisBelanja, setSubJenisBelanja] = useState(editData?.subJenisBelanja || '');
  const [notes, setNotes] = useState(editData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format number with thousand separators (dots)
  const formatRibuan = (value: string) => {
    const num = value.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleTotalNilaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setTotalNilai(raw);
  };

  const parseTotalNilai = (): number => {
    return parseInt(totalNilai.replace(/\D/g, ''), 10) || 0;
  };
  const [documents, setDocuments] = useState<Document[]>(
    editData?.documents || []
  );

  // Get available sub-types based on selected jenis belanja
  const availableSubTypes = jenisBelanja ? SUB_JENIS_BELANJA[jenisBelanja] || [] : [];

  // Update documents when jenis or sub-jenis changes (only for new submission, not edit)
  const updateDocuments = (jenis: string, subJenis: string, preserveChecked = false) => {
    if (!jenis || !subJenis) {
      setDocuments([]);
      return;
    }
    const newDocs = getDocumentsByJenisBelanja(jenis, subJenis);
    
    if (preserveChecked && documents.length > 0) {
      // Preserve checked status from existing documents
      const checkedTypes = new Set(documents.filter(d => d.isChecked).map(d => d.type));
      setDocuments(newDocs.map(doc => ({
        ...doc,
        isChecked: checkedTypes.has(doc.type)
      })));
    } else {
      setDocuments(newDocs);
    }
  };

  // Handle jenis belanja change
  const handleJenisBelanjaChange = (value: string) => {
    setJenisBelanja(value);
    // Reset sub-jenis when main type changes
    const newSubTypes = SUB_JENIS_BELANJA[value] || [];
    const firstSubType = newSubTypes[0] || '';
    setSubJenisBelanja(firstSubType);
    // When editing, try to preserve checked documents
    updateDocuments(value, firstSubType, !!editData);
  };

  // Handle sub-jenis change
  const handleSubJenisChange = (value: string) => {
    setSubJenisBelanja(value);
    // When editing, try to preserve checked documents
    updateDocuments(jenisBelanja, value, !!editData);
  };

  // Reset form when editData changes
  useEffect(() => {
    if (open && editData) {
      setTitle(editData.title);
      setTotalNilai(editData.totalNilai?.toString() || '');
      setSubmitterName(editData.submitterName);
      setJenisBelanja(editData.jenisBelanja);
      setSubJenisBelanja(editData.subJenisBelanja || '');
      setNotes(editData.notes || '');
      
      // Use editData.documents if available and has checked items
      // Otherwise regenerate from jenis belanja
      if (editData.documents && editData.documents.length > 0 && editData.documents.some(d => d.isChecked)) {
        setDocuments(editData.documents);
      } else if (editData.jenisBelanja && editData.subJenisBelanja) {
        // Regenerate documents but don't overwrite checked status
        const freshDocs = getDocumentsByJenisBelanja(editData.jenisBelanja, editData.subJenisBelanja);
        setDocuments(freshDocs);
      } else {
        setDocuments([]);
      }
    } else if (!open) {
      // Reset when closing
      setTitle('');
      setTotalNilai('');
      setSubmitterName('');
      setJenisBelanja('');
      setSubJenisBelanja('');
      setNotes('');
      setDocuments([]);
    }
  }, [editData, open]);

  const handleDocumentToggle = (type: DocumentType) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.type === type ? { ...doc, isChecked: !doc.isChecked } : doc
      )
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Judul pengajuan harus diisi',
        variant: 'destructive',
      });
      return;
    }
    if (!totalNilai || parseTotalNilai() <= 0) {
      toast({
        title: 'Error',
        description: 'Total Nilai harus diisi dengan angka lebih dari 0',
        variant: 'destructive',
      });
      return;
    }
    if (!submitterName.trim()) {
      toast({
        title: 'Error',
        description: 'Nama pengaju harus dipilih',
        variant: 'destructive',
      });
      return;
    }
    if (!jenisBelanja) {
      toast({
        title: 'Error',
        description: 'Jenis belanja harus dipilih',
        variant: 'destructive',
      });
      return;
    }
    if (!subJenisBelanja) {
      toast({
        title: 'Error',
        description: 'Sub-jenis belanja harus dipilih',
        variant: 'destructive',
      });
      return;
    }

    // Validasi dokumen wajib
    const requiredDocuments = documents.filter(doc => doc.isRequired);
    const uncheckedRequired = requiredDocuments.filter(doc => !doc.isChecked);
    
    if (uncheckedRequired.length > 0) {
      toast({
        title: 'Dokumen Wajib Belum Lengkap',
        description: `Masih ada ${uncheckedRequired.length} dokumen wajib yang belum dicentang`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare documents string (pipe-separated)
      const checkedDocs = documents.filter(d => d.isChecked).map(d => d.name);
      const documentsString = checkedDocs.join('|');
      
      // If editing, update all fields via update-status
      if (editData) {
        const { data, error } = await supabase.functions.invoke('update-status', {
          body: {
            id: editData.id,
            status: editData.status,
            title: title.trim(),
            submitterName: submitterName.trim(),
            jenisBelanja: `${jenisBelanja} - ${subJenisBelanja}`,
            documents: documentsString,
            notes: notes.trim() || undefined,
            totalNilai: parseTotalNilai(),
            actor: 'user',
            action: 'edit',
            updateDataOnly: true,
          },
        });

        if (error) {
          throw new Error(error.message || 'Gagal memperbarui data');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Gagal memperbarui data');
        }
      } else {
        // Generate ID for new submission
        const existingIds = existingSubmissions.map(s => s.id);
        const newId = generateSubmissionId(existingIds);

        // Save to Google Sheets via edge function
        const { data, error } = await supabase.functions.invoke('save-to-sheets', {
          body: {
            id: newId,
            title: title.trim(),
            submitterName: submitterName.trim(),
            jenisBelanja: `${jenisBelanja} - ${subJenisBelanja}`,
            documents: documentsString,
            notes: notes.trim() || undefined,
            totalNilai: parseTotalNilai(),
            status: 'pending_ppk',
          },
        });

        if (error) {
          throw new Error(error.message || 'Gagal menyimpan ke Google Sheets');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Gagal menyimpan data');
        }
      }

      // Call original onSubmit for local state
      onSubmit({
        title: title.trim(),
        submitterName: submitterName.trim(),
        jenisBelanja,
        subJenisBelanja,
        submittedAt: new Date(),
        documents,
        notes: notes.trim() || undefined,
        totalNilai: parseTotalNilai(),
      });

      setTitle('');
      setSubmitterName('');
      setJenisBelanja('');
      setSubJenisBelanja('');
      setNotes('');
      setDocuments([]);
      onClose();

      toast({
        title: 'Berhasil',
        description: editData 
          ? 'Data pengajuan berhasil diperbarui' 
          : `Pengajuan berhasil dikirim ke PPK`,
      });
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle(editData?.title || '');
    setSubmitterName(editData?.submitterName || '');
    setJenisBelanja(editData?.jenisBelanja || '');
    setSubJenisBelanja(editData?.subJenisBelanja || '');
    setNotes(editData?.notes || '');
    setDocuments(editData?.documents || []);
    onClose();
  };

  const checkedCount = documents.filter(d => d.isChecked).length;
  const requiredDocs = documents.filter(d => d.isRequired);
  const requiredCheckedCount = requiredDocs.filter(d => d.isChecked).length;
  const uncheckedRequiredCount = requiredDocs.filter(d => !d.isChecked).length;
  const hasJenisBelanja = Boolean(jenisBelanja && subJenisBelanja);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/50">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {editData ? 'Edit Pengajuan' : 'Buat Pengajuan Baru'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Lengkapi formulir berikut untuk mengajukan dokumen ke PPK
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Judul Pengajuan */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">Judul Pengajuan *</Label>
            <Input
              id="title"
              placeholder="Contoh: Pengadaan ATK Bulan Januari 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Nama Pengaju - Dropdown from organik */}
          <div className="space-y-2">
            <Label htmlFor="submitter" className="text-sm font-semibold">Nama Pengaju *</Label>
            <Select value={submitterName} onValueChange={setSubmitterName}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={isLoadingOrganik ? "Memuat data..." : "Pilih nama pengaju"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {organikList.map((org) => (
                  <SelectItem key={org.nip || org.nama} value={org.nama}>
                    <div className="flex flex-col">
                      <span className="font-medium">{org.nama}</span>
                      <span className="text-xs text-muted-foreground">{org.jabatan}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jenis Belanja */}
          <div className="space-y-2">
            <Label htmlFor="jenisBelanja" className="text-sm font-semibold">Jenis Belanja *</Label>
            <Select value={jenisBelanja} onValueChange={handleJenisBelanjaChange}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Pilih jenis belanja" />
              </SelectTrigger>
              <SelectContent>
                {JENIS_BELANJA_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-Jenis Belanja Tabs */}
          {jenisBelanja && availableSubTypes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Sub-Jenis Belanja *</Label>
              <Tabs value={subJenisBelanja} onValueChange={handleSubJenisChange}>
                <TabsList className="w-full h-auto flex-wrap bg-secondary/50 p-1.5 rounded-xl border border-border/30">
                  {availableSubTypes.map((subType) => (
                    <TabsTrigger 
                      key={subType} 
                      value={subType}
                      className="px-3 py-2 text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
                    >
                      {subType}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Checklist Dokumen - hanya ditampilkan jika sub-jenis belanja dipilih */}
          {hasJenisBelanja && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Kelengkapan Dokumen</Label>
                  {requiredDocs.length > 0 && uncheckedRequiredCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-md">
                      <AlertCircle className="w-3 h-3" />
                      {uncheckedRequiredCount} dokumen wajib belum lengkap
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-status-complete" />
                  <span className="text-sm text-muted-foreground font-medium">
                    {checkedCount}/{documents.length} dokumen
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {requiredCheckedCount}/{requiredDocs.length} wajib
                  </span>
                </div>
              </div>
              
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-secondary/30 rounded-xl border border-border/30">
                  {documents.map((doc) => (
                    <div
                      key={doc.type}
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-card transition-colors cursor-pointer border border-transparent hover:border-border/50"
                      onClick={() => handleDocumentToggle(doc.type)}
                    >
                      <Checkbox
                        id={doc.type}
                        checked={doc.isChecked}
                        onCheckedChange={() => handleDocumentToggle(doc.type)}
                        className="rounded-md"
                      />
                      <label
                        htmlFor={doc.type}
                        className="text-sm cursor-pointer flex-1 font-medium"
                      >
                        {doc.name}
                        {doc.isRequired && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                        {!doc.isRequired && (
                          <span className="text-muted-foreground ml-1 text-xs">(Opsional)</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-secondary/30 rounded-xl border border-border/30 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Pilih sub-jenis belanja untuk melihat daftar dokumen
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                * Dokumen wajib harus dilengkapi
              </p>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan atau keterangan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel} className="rounded-xl" disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="rounded-xl shadow-sm hover:shadow-md transition-all" 
            disabled={isSubmitting || (!editData && !hasJenisBelanja)}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Menyimpan...' : editData ? 'Simpan Catatan' : 'Kirim ke PPK'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
