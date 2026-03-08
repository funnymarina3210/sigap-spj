import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SatkerConfigProvider } from "@/contexts/SatkerConfigContext";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import SubmissionsCard from "./pages/SubmissionsCard";
import SubmissionsTable from "./pages/SubmissionsTable";
import UsulanPencairan from "./pages/UsulanPencairan";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SatkerConfigProvider>
            <NotificationsProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />              <Route path="pencairan" element={<UsulanPencairan />} />              <Route path="submissions/card" element={<SubmissionsCard />} />
                  <Route path="submissions/table" element={<SubmissionsTable />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationsProvider>
          </SatkerConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
