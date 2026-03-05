import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardPencairan from "@/components/pencairan/DashboardPencairan";

// Dashboard utama - Integrated dengan Pencairan Components
export default function Dashboard() {
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  return (
    <div className="space-y-6 p-6">
      {/* Header with Year Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan statistik pengajuan</p>
        </div>
        <Select value={filterTahun} onValueChange={setFilterTahun}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Dashboard Content */}
      <DashboardPencairan filterTahun={filterTahun} />
    </div>
  );
}
