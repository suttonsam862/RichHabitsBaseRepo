import { Switch, Route, Redirect, useLocation } from "wouter";
import { AuthUser } from "./types";
import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import Leads from "./pages/leads";
import Orders from "./pages/orders";
import Messages from "./pages/messages";
import Reports from "./pages/reports";
import Analytics from "./pages/analytics";
import Profile from "./pages/profile";
import Settings from "./pages/settings";
import AuthPage from "./pages/auth-page";
import UserManagement from "./pages/user-management";
import Design from "./pages/design";
import Manufacturing from "./pages/manufacturing";
import Organizations from "./pages/organizations";
import Catalog from "./pages/catalog";
import Corporate from "./pages/corporate";
import DesignCommunication from "./pages/design-communication";
import ProductionCommunication from "./pages/production-communication";
import Feedback from "./pages/feedback";
import Outlook from "./pages/outlook";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

// Admin pages
import SalesTeam from "./pages/admin/sales-team";
import DesignTeam from "./pages/admin/design-team";
import ManufacturingTeam from "./pages/admin/manufacturing-team";
import ProductManagement from "./pages/admin/product-management";
import OrderManagement from "./pages/admin/order-management";

// The main dashboard layout with all protected routes
function DashboardLayout() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Setup React Query's cache clearing behavior to improve page transitions
  const queryClient = useQueryClient();
  
  // Clear cache on route change to prevent flashes of old data
  const handleRouteChange = (path: string) => {
    // Temporarily disable transitions to prevent flashing of old content
    document.body.classList.add('page-transitioning');
    
    // Navigate to the new route
    setLocation(path);
    
    // Small delay to ensure the DOM has time to update
    setTimeout(() => {
      document.body.classList.remove('page-transitioning');
    }, 150);
  };
  
  // Wrap all page components with a loading boundary
  const PageLoader = ({ children }: { children: React.ReactNode }) => (
    <div className="page-container w-full h-full">
      {children}
    </div>
  );
  
  return (
    <Layout user={user as AuthUser}>
      <Switch>
        <Route path="/">
          <PageLoader><Dashboard /></PageLoader>
        </Route>
        <Route path="/dashboard">
          <PageLoader><Dashboard /></PageLoader>
        </Route>
        <Route path="/leads">
          <PageLoader><Leads /></PageLoader>
        </Route>
        <Route path="/orders">
          <PageLoader><Orders /></PageLoader>
        </Route>
        <Route path="/design">
          <PageLoader><Design /></PageLoader>
        </Route>
        <Route path="/manufacturing">
          <PageLoader><Manufacturing /></PageLoader>
        </Route>
        <Route path="/organizations">
          <PageLoader><Organizations /></PageLoader>
        </Route>
        <Route path="/messages">
          <PageLoader><Messages /></PageLoader>
        </Route>
        <Route path="/reports">
          <PageLoader><Reports /></PageLoader>
        </Route>
        <Route path="/analytics">
          <PageLoader><Analytics /></PageLoader>
        </Route>
        <Route path="/user-management">
          <PageLoader><UserManagement /></PageLoader>
        </Route>
        <Route path="/profile">
          <PageLoader><Profile /></PageLoader>
        </Route>
        <Route path="/settings">
          <PageLoader><Settings /></PageLoader>
        </Route>
        <Route path="/catalog">
          <PageLoader><Catalog /></PageLoader>
        </Route>
        <Route path="/corporate">
          <PageLoader><Corporate /></PageLoader>
        </Route>
        <Route path="/design-communication">
          <PageLoader><DesignCommunication /></PageLoader>
        </Route>
        <Route path="/production-communication">
          <PageLoader><ProductionCommunication /></PageLoader>
        </Route>
        <Route path="/feedback">
          <PageLoader><Feedback /></PageLoader>
        </Route>
        <Route path="/outlook">
          <PageLoader><Outlook /></PageLoader>
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin/sales-team">
          <PageLoader><SalesTeam /></PageLoader>
        </Route>
        <Route path="/admin/design-team">
          <PageLoader><DesignTeam /></PageLoader>
        </Route>
        <Route path="/admin/manufacturing-team">
          <PageLoader><ManufacturingTeam /></PageLoader>
        </Route>
        <Route path="/admin/product-management">
          <PageLoader><ProductManagement /></PageLoader>
        </Route>
        <Route path="/admin/order-management">
          <PageLoader><OrderManagement /></PageLoader>
        </Route>
        <Route>
          <PageLoader><NotFound /></PageLoader>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  
  console.log("App render - Authentication state:", { isAuthenticated: !!user, isLoading });
  
  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not authenticated, show the auth page
  if (!user) {
    return <AuthPage />;
  }
  
  // If authenticated, show the dashboard
  return <DashboardLayout />;
}

export default App;
