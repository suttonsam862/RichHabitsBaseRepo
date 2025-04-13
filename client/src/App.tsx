import { Switch, Route, Redirect, useLocation } from "wouter";
import { AuthUser } from "./types";
import { ROLES } from "@shared/schema";
import Layout from "./components/layout";
import { SalespersonLayout } from "./components/salesperson-layout";
import { DesignerLayout } from "./components/designer/designer-layout";
import { ManufacturerLayout } from "./components/manufacturer/manufacturer-layout";
import { HybridLayout } from "./components/hybrid/hybrid-layout";
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

// Salesperson pages
import SalespersonDashboard from "./pages/salesperson/dashboard";
import NotificationCenter from "./pages/salesperson/notification-center";
import UnclaimedLeads from "./pages/salesperson/leads/unclaimed";
import OrderCreation from "./pages/salesperson/orders/create";
import SalespersonOrders from "./pages/salesperson/orders";
import SizeRequests from "./pages/salesperson/size-requests";

// Designer pages
import DesignerDashboard from "./pages/designer/dashboard";
import UnclaimedDesigns from "./pages/designer/unclaimed-designs";
import DesignJobDetail from "./pages/designer/design-job";
import DesignProcessGuide from "./pages/design-process-guide";

// Manufacturer pages
import ManufacturerDashboard from "./pages/manufacturer/dashboard";
import ManufacturingOrders from "./pages/manufacturer/orders";
import OrderDetail from "./pages/manufacturer/order-detail";
import ManufacturingGuide from "./pages/manufacturing-guide";

// Hybrid role pages
import HybridDashboard from "./pages/hybrid/dashboard";

// Events pages
import EventCalendar from "./pages/events/calendar";

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
        
        {/* Events Routes */}
        <Route path="/events/calendar">
          <ProtectedPageLoader pageId="events/calendar"><EventCalendar /></ProtectedPageLoader>
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
        <Route path="/leads/unclaimed">
          <ProtectedPageLoader pageId="leads/unclaimed"><UnclaimedLeads /></ProtectedPageLoader>
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
        <Route path="/events/calendar">
          <ProtectedPageLoader pageId="events/calendar"><EventCalendar /></ProtectedPageLoader>
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

// Designer dashboard layout with role-specific routes
function DesignerDashboardLayout() {
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
    <DesignerLayout user={user as AuthUser}>
      <Switch>
        <Route path="/">
          <ProtectedPageLoader pageId="dashboard"><DesignerDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/dashboard">
          <ProtectedPageLoader pageId="dashboard"><DesignerDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/unclaimed-designs">
          <ProtectedPageLoader pageId="unclaimed-designs"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/design-jobs">
          <ProtectedPageLoader pageId="design-jobs"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/design-job/:id">
          <ProtectedPageLoader pageId="design-job"><DesignJobDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/design-submission">
          <ProtectedPageLoader pageId="design-submission"><DesignJobDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/revisions">
          <ProtectedPageLoader pageId="revisions"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/customer-input">
          <ProtectedPageLoader pageId="customer-input"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/notifications">
          <ProtectedPageLoader pageId="notifications"><NotificationCenter /></ProtectedPageLoader>
        </Route>
        <Route path="/design-process-guide">
          <ProtectedPageLoader pageId="design-process-guide"><DesignProcessGuide /></ProtectedPageLoader>
        </Route>
        <Route path="/profile">
          <ProtectedPageLoader pageId="profile"><Profile /></ProtectedPageLoader>
        </Route>
        <Route>
          <div className="page-container w-full h-full">
            <NotFound />
          </div>
        </Route>
      </Switch>
    </DesignerLayout>
  );
}

// Manufacturer dashboard layout with role-specific routes
function ManufacturerDashboardLayout() {
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
    <ManufacturerLayout user={user as AuthUser}>
      <Switch>
        <Route path="/">
          <ProtectedPageLoader pageId="dashboard"><ManufacturerDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/dashboard">
          <ProtectedPageLoader pageId="dashboard"><ManufacturerDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/manufacturing-orders">
          <ProtectedPageLoader pageId="manufacturing-orders"><ManufacturingOrders /></ProtectedPageLoader>
        </Route>
        <Route path="/order-detail/:id">
          <ProtectedPageLoader pageId="order-detail"><OrderDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/cost-input">
          <ProtectedPageLoader pageId="cost-input"><ManufacturingOrders /></ProtectedPageLoader>
        </Route>
        <Route path="/cost-input/:id">
          <ProtectedPageLoader pageId="cost-input"><OrderDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/status-update">
          <ProtectedPageLoader pageId="status-update"><ManufacturingOrders /></ProtectedPageLoader>
        </Route>
        <Route path="/status-update/:id">
          <ProtectedPageLoader pageId="status-update"><OrderDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/shipping">
          <ProtectedPageLoader pageId="shipping"><ManufacturingOrders /></ProtectedPageLoader>
        </Route>
        <Route path="/shipping/:id">
          <ProtectedPageLoader pageId="shipping"><OrderDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/order-history">
          <ProtectedPageLoader pageId="order-history"><ManufacturingOrders /></ProtectedPageLoader>
        </Route>
        <Route path="/metrics">
          <ProtectedPageLoader pageId="metrics"><ManufacturerDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/notifications">
          <ProtectedPageLoader pageId="notifications"><NotificationCenter /></ProtectedPageLoader>
        </Route>
        <Route path="/manufacturing-guide">
          <ProtectedPageLoader pageId="manufacturing-guide"><ManufacturingGuide /></ProtectedPageLoader>
        </Route>
        <Route path="/profile">
          <ProtectedPageLoader pageId="profile"><Profile /></ProtectedPageLoader>
        </Route>
        <Route path="/settings">
          <ProtectedPageLoader pageId="settings"><Settings /></ProtectedPageLoader>
        </Route>
        <Route>
          <div className="page-container w-full h-full">
            <NotFound />
          </div>
        </Route>
      </Switch>
    </ManufacturerLayout>
  );
}

// Hybrid role dashboard layout with combined sales and design routes
function HybridDashboardLayout() {
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
    <HybridLayout user={user as AuthUser}>
      <Switch>
        {/* Common Routes */}
        <Route path="/">
          <ProtectedPageLoader pageId="dashboard"><HybridDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/dashboard">
          <ProtectedPageLoader pageId="dashboard"><HybridDashboard /></ProtectedPageLoader>
        </Route>
        <Route path="/profile">
          <ProtectedPageLoader pageId="profile"><Profile /></ProtectedPageLoader>
        </Route>
        <Route path="/notifications">
          <ProtectedPageLoader pageId="notifications"><NotificationCenter /></ProtectedPageLoader>
        </Route>
        <Route path="/settings">
          <ProtectedPageLoader pageId="settings"><Settings /></ProtectedPageLoader>
        </Route>
        
        {/* Sales Routes */}
        <Route path="/leads/unclaimed">
          <ProtectedPageLoader pageId="leads/unclaimed"><UnclaimedLeads /></ProtectedPageLoader>
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
        <Route path="/sales-process-guide">
          <ProtectedPageLoader pageId="sales-process-guide"><SalesProcessGuide /></ProtectedPageLoader>
        </Route>
        
        {/* Designer Routes */}
        <Route path="/unclaimed-designs">
          <ProtectedPageLoader pageId="unclaimed-designs"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/design-jobs">
          <ProtectedPageLoader pageId="design-jobs"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/design-job/:id">
          <ProtectedPageLoader pageId="design-job"><DesignJobDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/design-submission">
          <ProtectedPageLoader pageId="design-submission"><DesignJobDetail /></ProtectedPageLoader>
        </Route>
        <Route path="/revisions">
          <ProtectedPageLoader pageId="revisions"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/customer-input">
          <ProtectedPageLoader pageId="customer-input"><UnclaimedDesigns /></ProtectedPageLoader>
        </Route>
        <Route path="/design-process-guide">
          <ProtectedPageLoader pageId="design-process-guide"><DesignProcessGuide /></ProtectedPageLoader>
        </Route>
        
        {/* Communication Routes */}
        <Route path="/design-communication">
          <ProtectedPageLoader pageId="design-communication"><DesignCommunication /></ProtectedPageLoader>
        </Route>
        <Route path="/production-communication">
          <ProtectedPageLoader pageId="production-communication"><ProductionCommunication /></ProtectedPageLoader>
        </Route>
        
        {/* Events Routes */}
        <Route path="/events/calendar">
          <ProtectedPageLoader pageId="events/calendar"><EventCalendar /></ProtectedPageLoader>
        </Route>
        
        <Route>
          <div className="page-container w-full h-full">
            <NotFound />
          </div>
        </Route>
      </Switch>
    </HybridLayout>
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
  if (user.role === 'agent' || user.role === 'sales') {
    return <SalespersonDashboardLayout />;
  } else if (user.role === 'designer') {
    return <DesignerDashboardLayout />;
  } else if (user.role === 'manufacturer' || user.role === 'manufacturing') {
    return <ManufacturerDashboardLayout />;
  } else if (user.role === 'hybrid') {
    return <HybridDashboardLayout />;
  }
  
  // For all other roles (admin, manager, etc.), show the default dashboard
  return <DashboardLayout />;
}

export default App;