import { Document } from '@/types/submission';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FileCheck, FileX, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DocumentChecklistProps {
  documents: Document[];
  onToggle?: (index: number) => void;
  readonly?: boolean;
}

export function DocumentChecklist({ documents, onToggle, readonly = false }: DocumentChecklistProps) {
  const checkedCount = documents.filter(d => d.isChecked).length;
  const totalCount = documents.length;
  
  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-complete" />
          <span className="text-sm font-medium">
            {checkedCount}/{totalCount} dokumen terlengkapi
          </span>
        </div>
        {documents.filter(d => d.isRequired && !d.isChecked).length > 0 && (
          <div className="flex items-center gap-1 text-xs text-destructive font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>Dokumen wajib belum lengkap</span>
          </div>
        )}
      </div>
      
      {/* Checklist Items */}
      <div className="space-y-2">
        {documents.map((doc, index) => (
          <div 
            key={doc.type}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
              doc.isChecked 
                ? 'bg-status-complete-bg border-status-complete/20' 
                : 'bg-card border-border hover:border-primary/30',
              doc.isRequired && !doc.isChecked && 'border-destructive/20 bg-destructive/5',
              !readonly && 'cursor-pointer'
            )}
            onClick={() => !readonly && onToggle?.(index)}
          >
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
              doc.isChecked 
                ? 'bg-status-complete/10' 
                : doc.isRequired 
                  ? 'bg-destructive/10' 
                  : 'bg-secondary'
            )}>
              {doc.isChecked ? (
                <FileCheck className={cn(
                  "w-4 h-4",
                  doc.isChecked ? 'text-status-complete' : 'text-muted-foreground'
                )} />
              ) : (
                <FileX className={cn(
                  "w-4 h-4",
                  doc.isRequired ? 'text-destructive' : 'text-muted-foreground'
                )} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                doc.isChecked ? 'text-status-complete' : 
                doc.isRequired ? 'text-destructive' : 'text-foreground'
              )}>
                {doc.name}
              </p>
              {doc.isRequired && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Wajib dilengkapi
                </p>
              )}
            </div>

            <Checkbox 
              checked={doc.isChecked}
              disabled={readonly}
              className={cn(
                'transition-colors',
                doc.isChecked && 'border-status-complete bg-status-complete data-[state=checked]:bg-status-complete data-[state=checked]:border-status-complete',
                doc.isRequired && !doc.isChecked && 'border-destructive'
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}