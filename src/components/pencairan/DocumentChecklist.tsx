import { Document } from '@/types/pencairan';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DocumentChecklistProps {
  documents: Document[];
  onChange?: (documents: Document[]) => void;
  readOnly?: boolean;
}

export function DocumentChecklist({
  documents,
  onChange,
  readOnly = false,
}: DocumentChecklistProps) {
  const handleToggle = (index: number) => {
    if (readOnly || !onChange) return;
    const updated = [...documents];
    updated[index].isChecked = !updated[index].isChecked;
    onChange(updated);
  };

  // Group documents into pairs for 2-column layout
  const pairs = [];
  for (let i = 0; i < documents.length; i += 2) {
    pairs.push([documents[i], documents[i + 1]]);
  }

  return (
    <div className="space-y-4">
      {pairs.map((pair, pairIdx) => (
        <div key={pairIdx} className="grid grid-cols-2 gap-4">
          {pair.map((doc, idx) => {
            const docIndex = pairIdx * 2 + idx;
            const isRequired = doc.isRequired && !doc.isChecked;

            return (
              <div key={docIndex} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <Checkbox
                  id={`doc-${docIndex}`}
                  checked={doc.isChecked}
                  onCheckedChange={() => handleToggle(docIndex)}
                  disabled={readOnly}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`doc-${docIndex}`}
                    className={`text-sm font-medium leading-none cursor-pointer ${
                      readOnly ? '' : 'cursor-pointer'
                    }`}
                  >
                    {doc.name}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {doc.note && (
                    <p className="text-xs text-muted-foreground mt-1">{doc.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
