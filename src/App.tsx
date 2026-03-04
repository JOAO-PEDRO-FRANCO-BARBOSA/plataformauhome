import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import PropertyDetails from "@/pages/PropertyDetails";
import MatchPage from "@/pages/MatchPage";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import HostDashboard from "@/pages/HostDashboard";
import MyProperties from "@/pages/MyProperties";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminPropertyReview from "@/pages/AdminPropertyReview";
import UserPropertyDetails from "@/pages/UserPropertyDetails";
import NotFound from "./pages/NotFound";
import { PropertyWizard } from "@/components/PropertyWizard";

const queryClient = new QueryClient();

function RootRedirect() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { isLoggedIn, loading, profile } = useAuth();

  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<PropertyDetails />} />
              <Route path="/match" element={<MatchPage />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/host" element={<HostDashboard />} />
              <Route path="/host/new" element={<PropertyWizard />} />
              <Route path="/host/edit/:id" element={<PropertyWizard />} />
              <Route path="/my-properties" element={<MyProperties />} />
              <Route path="/my-properties/:id" element={<UserPropertyDetails />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/properties/:id" element={<AdminRoute><AdminPropertyReview /></AdminRoute>} />
            </Route>
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
