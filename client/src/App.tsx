import { Switch, Route, Redirect, useLocation } from "wouter";
import { AuthUser } from "./types";
import Layout from "./components/layout";
import { SalespersonLayout } from "./components/salesperson-layout";
import Dashboard from "./pages/dashboard";
import Leads from "./pages/leads";
import Orders from "./pages/orders";
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
import SalesProcessGuide from "./pages/sales-process-guide";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { PageGuard } from "@/lib/page-guard"; // Import the PageGuard component
import { ROLES } from "@shared/schema";

// Salesperson pages
import SalespersonDashboard from "./pages/salesperson/dashboard";
import NotificationCenter from "./pages/salesperson/notification-center";
import UnclaimedLeads from "./pages/salesperson/leads";
import OrderCreation from "./pages/salesperson/orders/create";
import SalespersonOrders from "./pages/salesperson/orders";
import SizeRequests from "./pages/salesperson/size-requests";

// Admin pages
import SalesTeam from "./pages/admin/sales-team";
import DesignTeam from "./pages/admin/design-team";
import ManufacturingTeam from "./pages/admin/manufacturing-team";
import ProductManagement from "./pages/admin/product-management";
import ProductCreation from "./pages/admin/product-creation";
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
  
  // Wrap all page components with a loading boundary and page guard
  const ProtectedPageLoader = ({ children, pageId }: { children: React.ReactNode, pageId: string }) => (
    <div className="page-container w-full h-full">
      <PageGuard pageId={pageId}>
        {children}
      </PageGuard>
    </div>
  );
  
  return (
    <Layout user={user as AuthUser}>
      <Switch>
        <Route path="/">
          <ProtectedPageLoader pageId="dashboard"><Dashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/dashboard">
          <ProtectedPageLoader pageId="dashboard"><Dashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/leads">
          <ProtectedPageLoader pageId="leads"><Leads /></ProtectedPageLoader>
        </Route>
        <Route path="/orders">
          <ProtectedPageLoader pageId="orders"><Orders /></ProtectedPageLoader>
        </Route>
        <Route path="/design">
          <ProtectedPageLoader pageId="design"><Design /></ProtectedPageLoader>
        </Route>
        <Route path="/manufacturing">
          <ProtectedPageLoader pageId="manufacturing"><Manufacturing /></ProtectedPageLoader>
        </Route>
        <Route path="/organizations">
          <ProtectedPageLoader pageId="organizations"><Organizations /></ProtectedPageLoader>
        </Route>
        <Route path="/reports">
          <ProtectedPageLoader pageId="reports"><Reports /></ProtectedPageLoader>
        </Route>
        <Route path="/analytics">
          <ProtectedPageLoader pageId="analytics"><Analytics /></ProtectedPageLoader>
        </Route>
        <Route path="/user-management">
          <ProtectedPageLoader pageId="user-management"><UserManagement /></ProtectedPageLoader>
        </Route>
        <Route path="/profile">
          <ProtectedPageLoader pageId="profile"><Profile /></ProtectedPageLoader>
        </Route>
        <Route path="/settings">
          <ProtectedPageLoader pageId="settings"><Settings /></ProtectedPageLoader>
        </Route>
        <Route path="/catalog">
          <ProtectedPageLoader pageId="catalog"><Catalog /></ProtectedPageLoader>
        </Route>
        <Route path="/corporate">
          <ProtectedPageLoader pageId="corporate"><Corporate /></ProtectedPageLoader>
        </Route>
        <Route path="/design-communication">
          <ProtectedPageLoader pageId="design-communication"><DesignCommunication /></ProtectedPageLoader>
        </Route>
        <Route path="/production-communication">
          <ProtectedPageLoader pageId="production-communication"><ProductionCommunication /></ProtectedPageLoader>
        </Route>
        <Route path="/feedback">
          <ProtectedPageLoader pageId="feedback"><Feedback /></ProtectedPageLoader>
        </Route>
        <Route path="/outlook">
          <ProtectedPageLoader pageId="outlook"><Outlook /></ProtectedPageLoader>
        </Route>
        <Route path="/sales-process-guide">
          <ProtectedPageLoader pageId="sales-process-guide"><SalesProcessGuide /></ProtectedPageLoader>
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin/sales-team">
          <ProtectedPageLoader pageId="admin/sales-team"><SalesTeam /></ProtectedPageLoader>
        </Route>
        <Route path="/admin/design-team">
          <ProtectedPageLoader pageId="admin/design-team"><DesignTeam /></ProtectedPageLoader>
        </Route>
        <Route path="/admin/manufacturing-team">
          <ProtectedPageLoader pageId="admin/manufacturing-team"><ManufacturingTeam /></ProtectedPageLoader>
        </Route>
        <Route path="/admin/product-management">
          <ProtectedPageLoader pageId="admin/product-management"><ProductManagement /></ProtectedPageLoader>
        </Route>
        <Route path="/admin/product-creation">
          <ProtectedPageLoader pageId="admin/product-creation"><ProductCreation /></ProtectedPageLoader>
        </Route>
        <Route path="/admin/order-management">
          <ProtectedPageLoader pageId="admin/order-management"><OrderManagement /></ProtectedPageLoader>
        </Route>
        <Route>
          <div className="page-container w-full h-full">
            <NotFound />
          </div>
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

// Salesperson dashboard layout with role-specific routes
function SalespersonDashboardLayout() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Wrap all page components with a loading boundary and page guard
  const ProtectedPageLoader = ({ children, pageId }: { children: React.ReactNode, pageId: string }) => (
    <div className="page-container w-full h-full">
      <PageGuard pageId={pageId}>
        {children}
      </PageGuard>
    </div>
  );
  
  return (
    <SalespersonLayout user={user as AuthUser}>
      <Switch>
        <Route path="/">
          <ProtectedPageLoader pageId="dashboard"><SalespersonDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/dashboard">
          <ProtectedPageLoader pageId="dashboard"><SalespersonDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/leads">
          <ProtectedPageLoader pageId="leads"><UnclaimedLeads /></ProtectedPageLoader>
        </Route>
        <Route path="/orders">
          <ProtectedPageLoader pageId="orders"><SalespersonOrders /></ProtectedPageLoader>
        </Route>
        <Route path="/orders/create">
          <ProtectedPageLoader pageId="orders/create"><OrderCreation /></ProtectedPageLoader>
        </Route>
        <Route path="/orders/history">
          <ProtectedPageLoader pageId="orders/history"><SalespersonOrders /></ProtectedPageLoader>
        </Route>
        <Route path="/size-requests">
          <ProtectedPageLoader pageId="size-requests"><SizeRequests /></ProtectedPageLoader>
        </Route>
        <Route path="/notifications">
          <ProtectedPageLoader pageId="notifications"><NotificationCenter /></ProtectedPageLoader>
        </Route>
        <Route path="/profile">
          <ProtectedPageLoader pageId="profile"><Profile /></ProtectedPageLoader>
        </Route>
        <Route path="/catalog">
          <ProtectedPageLoader pageId="catalog"><Catalog /></ProtectedPageLoader>
        </Route>
        <Route path="/sales-process-guide">
          <ProtectedPageLoader pageId="sales-process-guide"><SalesProcessGuide /></ProtectedPageLoader>
        </Route>
        <Route>
          <div className="page-container w-full h-full">
            <NotFound />
          </div>
        </Route>
      </Switch>
    </SalespersonLayout>
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
  
  // Role-based routing
  if (user.role === ROLES.AGENT) {
    return <SalespersonDashboardLayout />;
  }
  
  // For all other roles (admin, manager, etc.), show the default dashboard
  return <DashboardLayout />;
}

export default App;