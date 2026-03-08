import { Building2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { NotificationsCenter } from '@/components/NotificationsCenter';
import { useNotifications } from '@/hooks/useNotifications';

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

export function Header({ user, onLogout }: HeaderProps) {
  // Initialize notifications hook
  useNotifications();

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
              BPS Kabupaten Majalengka
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationsCenter />

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
