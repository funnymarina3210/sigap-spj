import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn, Loader2, Sparkles } from 'lucide-react';

interface SheetUser {
  role: string;
  nama: string;
  password: string;
  satker?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuth();
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<SheetUser[]>([]);

  useEffect(() => {
    // Check if already logged in
    if (isAuthenticated) {
      navigate('/');
      return;
    }

    // Fetch users
    fetchUsers();
  }, [navigate, isAuthenticated]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('read-sheets', {
        body: { sheetType: 'users' },
      });

      if (error) throw error;
      if (data?.success && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nama.trim() || !password.trim()) {
      toast({
        title: 'Error',
        description: 'Nama dan password harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use the raw role from the sheet directly (matches UserRole type)
      const getRoleFromSheet = (sheetRole: string): string => {
        return sheetRole.trim();
      };

      // Validate against users from sheet
      const user = users.find(
        (u) => u.nama.toLowerCase() === nama.toLowerCase() && u.password === password
      );

      if (user) {
        const userData = {
          role: getRoleFromSheet(user.role) as any,
          nama: user.nama,
          password: user.password,
          satker: user.satker || 'BPS Kabupaten Majalengka', // Default satker
        };
        console.log('Login successful, storing user:', userData);
        setUser(userData);
        toast({
          title: 'Berhasil',
          description: `Selamat datang, ${user.nama}! (${user.role})`,
        });
        navigate('/');
      } else {
        toast({
          title: 'Login Gagal',
          description: 'Nama atau password salah',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="bubble bubble-1" />
        <div className="bubble bubble-2" />
        <div className="bubble bubble-3" />
        <div className="bubble bubble-4" />
        <div className="bubble bubble-5" />
        <div className="bubble bubble-6" />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/30 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Light rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-96 bg-gradient-to-b from-primary/50 to-transparent" />
      <div className="absolute top-0 left-1/3 w-px h-64 bg-gradient-to-b from-primary/30 to-transparent" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-0 right-1/3 w-px h-72 bg-gradient-to-b from-primary/30 to-transparent" style={{ animationDelay: '1s' }} />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl animate-scale-in">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-float">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Sigap SPJ
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Sinergi Gerak Administrasi Pengajuan — Surat Pertanggungjawaban
                <br />
                <span className="text-xs">BPS Kabupaten Majalengka</span>
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-sm font-semibold">
                  Nama
                </Label>
                <Input
                  id="nama"
                  type="text"
                  placeholder="Masukkan nama Anda"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-colors"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-colors pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <style>{`
        .bubble {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1));
          animation: float-bubble 15s ease-in-out infinite;
        }
        
        .bubble-1 {
          width: 80px;
          height: 80px;
          left: 10%;
          bottom: -80px;
          animation-delay: 0s;
          animation-duration: 12s;
        }
        
        .bubble-2 {
          width: 120px;
          height: 120px;
          left: 30%;
          bottom: -120px;
          animation-delay: 2s;
          animation-duration: 18s;
        }
        
        .bubble-3 {
          width: 60px;
          height: 60px;
          left: 50%;
          bottom: -60px;
          animation-delay: 4s;
          animation-duration: 14s;
        }
        
        .bubble-4 {
          width: 100px;
          height: 100px;
          left: 70%;
          bottom: -100px;
          animation-delay: 1s;
          animation-duration: 16s;
        }
        
        .bubble-5 {
          width: 50px;
          height: 50px;
          left: 85%;
          bottom: -50px;
          animation-delay: 3s;
          animation-duration: 13s;
        }
        
        .bubble-6 {
          width: 90px;
          height: 90px;
          left: 20%;
          bottom: -90px;
          animation-delay: 5s;
          animation-duration: 17s;
        }
        
        @keyframes float-bubble {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50vh) translateX(20px) scale(1.1);
            opacity: 0.4;
          }
          90% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-100vh) translateX(-10px) scale(0.8);
            opacity: 0;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
