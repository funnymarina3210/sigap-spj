import { Submission, getRelevantTimestamp } from '@/types/pencairan';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SubmissionCardProps {
  submission: Submission;
  onClick?: () => void;
}

export function SubmissionCard({ submission, onClick }: SubmissionCardProps) {
  const completedDocs = submission.documents.filter(d => d.isChecked).length;
  const totalDocs = submission.documents.length;
  const progress = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;
  const relevantTime = getRelevantTimestamp(submission);

  return (
    <Card 
      className="group cursor-pointer border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden bg-card"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Left accent bar */}
          <div 
            className={cn(
              "w-1 transition-all duration-300 group-hover:w-1.5",
              progress === 100 ? "bg-status-complete" : "bg-primary"
            )}
          />
          
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/50 flex items-center justify-center border border-primary/10 group-hover:scale-105 transition-transform duration-300">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                      {submission.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">{submission.id}</p>
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    {submission.submitterName}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {relevantTime || format(submission.submittedAt, 'HH:mm - dd/MM/yyyy', { locale: id })}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium">
                    {submission.jenisBelanja}{submission.subJenisBelanja ? ` - ${submission.subJenisBelanja}` : ''}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Kelengkapan dokumen</span>
                    <span className="font-semibold text-foreground">{completedDocs}/{totalDocs}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${progress}%`,
                        background: progress === 100 
                          ? 'hsl(var(--status-complete))' 
                          : 'var(--gradient-primary)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end gap-4">
                <StatusBadge status={submission.status} />
                <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}