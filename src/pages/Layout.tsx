import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SubmissionForm } from '@/components/SubmissionForm';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, Submission, generateSubmissionId } from '@/types/submission';
import { useState } from 'react';
import { useSubmissionsData } from '@/hooks/useSheetData';

export default function Layout() {
  const { user, logout } = useAuth();
  const { refetch } = useSubmissionsData();
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const userRole: UserRole = user?.role as UserRole || 'user';

  const handleCreateSubmission = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (data: Omit<Submission, 'id' | 'status'>) => {
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
        <AppSidebar userRole={userRole} onCreateSubmission={handleCreateSubmission} />
        
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
