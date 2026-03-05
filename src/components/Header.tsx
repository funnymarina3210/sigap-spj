import { Building2, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSubmissionsData } from '@/hooks/useSheetData';
import { useMemo } from 'react';
import { STATUS_LABELS, SubmissionStatus } from '@/types/submission';

interface User {
  role: string;
  nama: string;
}

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  user?: User | null;
  onLogout?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success';
}

export function Header({ user, onLogout }: HeaderProps) {
  const { data: submissions } = useSubmissionsData();
  
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate notifications based on user role
  const notifications = useMemo<Notification[]>(() => {
    const role = user?.role || 'user';
    const notifs: Notification[] = [];
    
    if (role === 'admin') {
      // Admin sees all activity
      const pendingPpk = submissions.filter(s => s.status === 'pending_ppk').length;
      const pendingBendahara = submissions.filter(s => s.status === 'pending_bendahara').length;
      const returnedSm = submissions.filter(s => s.status === 'incomplete_sm').length;
      const sentKppn = submissions.filter(s => s.status === 'sent_kppn').length;
      
      if (pendingPpk > 0) {
        notifs.push({
          id: '1',
          title: 'Menunggu PPK',
          message: `${pendingPpk} pengajuan menunggu verifikasi PPK`,
          time: 'Terbaru',
          type: 'warning'
        });
      }
      if (pendingBendahara > 0) {
        notifs.push({
          id: '2',
          title: 'Menunggu Bendahara',
          message: `${pendingBendahara} pengajuan menunggu verifikasi Bendahara`,
          time: 'Terbaru',
          type: 'info'
        });
      }
      if (returnedSm > 0) {
        notifs.push({
          id: '3',
          title: 'Dikembalikan',
          message: `${returnedSm} pengajuan dikembalikan ke SM`,
          time: 'Terbaru',
          type: 'warning'
        });
      }
      if (sentKppn > 0) {
        notifs.push({
          id: '4',
          title: 'Kirim KPPN',
          message: `${sentKppn} pengajuan sudah dikirim ke KPPN`,
          time: 'Terbaru',
          type: 'success'
        });
      }
    } else if (role === 'ppk') {
      // PPK sees pending_ppk and incomplete_ppk
      const pendingPpk = submissions.filter(s => s.status === 'pending_ppk').length;
      const incompletePpk = submissions.filter(s => s.status === 'incomplete_ppk').length;
      const sentKppn = submissions.filter(s => s.status === 'sent_kppn').length;
      
      if (pendingPpk > 0) {
        notifs.push({
          id: '1',
          title: 'Perlu Verifikasi',
          message: `${pendingPpk} pengajuan baru menunggu verifikasi Anda`,
          time: 'Terbaru',
          type: 'warning'
        });
      }
      if (incompletePpk > 0) {
        notifs.push({
          id: '2',
          title: 'Dikembalikan ke Anda',
          message: `${incompletePpk} pengajuan dikembalikan oleh Bendahara`,
          time: 'Terbaru',
          type: 'warning'
        });
      }
      if (sentKppn > 0) {
        notifs.push({
          id: '3',
          title: 'Sudah Kirim KPPN',
          message: `${sentKppn} pengajuan sudah dikirim ke KPPN (dapat dikembalikan)`,
          time: 'Terbaru',
          type: 'success'
        });
      }
    } else if (role === 'bendahara') {
      // Bendahara sees pending_bendahara and incomplete_bendahara
      const pendingBendahara = submissions.filter(s => s.status === 'pending_bendahara').length;
      const incompleteBendahara = submissions.filter(s => s.status === 'incomplete_bendahara').length;
      
      if (pendingBendahara > 0) {
        notifs.push({
          id: '1',
          title: 'Perlu Verifikasi',
          message: `${pendingBendahara} pengajuan menunggu verifikasi Anda`,
          time: 'Terbaru',
          type: 'warning'
        });
      }
      if (incompleteBendahara > 0) {
        notifs.push({
          id: '2',
          title: 'Dikembalikan KPPN',
          message: `${incompleteBendahara} pengajuan dikembalikan dari KPPN`,
          time: 'Terbaru',
          type: 'warning'
        });
      }
    } else if (role === 'user') {
      // User sees their returned submissions and sent to kppn
      const returnedSm = submissions.filter(s => s.status === 'incomplete_sm').length;
      const pending = submissions.filter(s => s.status === 'pending_ppk' || s.status === 'pending_bendahara').length;
      const sentKppn = submissions.filter(s => s.status === 'sent_kppn').length;
      
      if (returnedSm > 0) {
        notifs.push({
          id: '1',
          title: 'Perlu Perbaikan',
          message: `${returnedSm} pengajuan Anda dikembalikan. Silakan perbaiki.`,
          time: 'Terbaru',
          type: 'warning'
        });
      }
      if (pending > 0) {
        notifs.push({
          id: '2',
          title: 'Sedang Diproses',
          message: `${pending} pengajuan Anda sedang dalam proses verifikasi`,
          time: 'Terbaru',
          type: 'info'
        });
      }
      if (sentKppn > 0) {
        notifs.push({
          id: '3',
          title: 'Berhasil',
          message: `${sentKppn} pengajuan Anda sudah dikirim ke KPPN`,
          time: 'Terbaru',
          type: 'success'
        });
      }
    }
    
    return notifs;
  }, [submissions, user?.role]);

  const notificationCount = notifications.length;

  const getNotificationColor = (type: 'info' | 'warning' | 'success') => {
    switch (type) {
      case 'warning': return 'bg-status-incomplete/10 border-status-incomplete/30';
      case 'success': return 'bg-status-complete/10 border-status-complete/30';
      default: return 'bg-primary/10 border-primary/30';
    }
  };

  const getNotificationDot = (type: 'info' | 'warning' | 'success') => {
    switch (type) {
      case 'warning': return 'bg-status-incomplete';
      case 'success': return 'bg-status-complete';
      default: return 'bg-primary';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-complete border-2 border-card" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Sigap SPJ
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              BPS Kabupaten Cirebon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-secondary/80">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-status-incomplete rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary-foreground animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Pemberitahuan</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.role === 'admin' ? 'Semua Aktivitas' : 
                   user?.role === 'ppk' ? 'Untuk PPK' :
                   user?.role === 'bendahara' ? 'Untuk Bendahara' : 'Untuk Anda'}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 m-1 rounded-lg border ${getNotificationColor(notif.type)} cursor-default`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${getNotificationDot(notif.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Tidak ada pemberitahuan
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-8 w-px bg-border/60 hidden sm:block" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-2 rounded-xl hover:bg-secondary/80">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {user?.nama ? getInitials(user.nama) : 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">{user?.nama || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || 'Role'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
