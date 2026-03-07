import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SubmissionForm } from '@/components/pencairan/SubmissionForm';
import { useAuth } from '@/hooks/useAuth';
import { Submission } from '@/types/pencairan';
import { useState } from 'react';
import { usePencairanData } from '@/hooks/use-pencairan-data';

export default function Layout() {
  const { user, logout } = useAuth();
  const { refetch } = usePencairanData();
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleCreateSubmission = () => {
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    // Refresh data after creating
    setTimeout(() => refetch(), 1500);
    setShowForm(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userRole={user?.role as any} onCreateSubmission={handleCreateSubmission} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={user} onLogout={logout} />
          
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>

        <SubmissionForm 
          open={showForm} 
          onClose={handleFormClose} 
          onSubmit={handleFormSubmit} 
          editData={null} 
        />
      </div>
    </SidebarProvider>
  );
}
