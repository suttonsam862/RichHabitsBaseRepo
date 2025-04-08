import { Switch, Route, Redirect } from "wouter";
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
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";

// Admin pages
import SalesTeam from "./pages/admin/sales-team";
import DesignTeam from "./pages/admin/design-team";
import ManufacturingTeam from "./pages/admin/manufacturing-team";
import ProductManagement from "./pages/admin/product-management";

// The main dashboard layout with all protected routes
function DashboardLayout() {
  const { user } = useAuth();
  
  return (
    <Layout user={user as AuthUser}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/leads" component={Leads} />
        <Route path="/orders" component={Orders} />
        <Route path="/design" component={Design} />
        <Route path="/manufacturing" component={Manufacturing} />
        <Route path="/organizations" component={Organizations} />
        <Route path="/messages" component={Messages} />
        <Route path="/reports" component={Reports} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/user-management" component={UserManagement} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/corporate" component={Corporate} />
        <Route path="/design-communication" component={DesignCommunication} />
        <Route path="/production-communication" component={ProductionCommunication} />
        <Route path="/feedback" component={Feedback} />
        
        {/* Admin Routes */}
        <Route path="/admin/sales-team" component={SalesTeam} />
        <Route path="/admin/design-team" component={DesignTeam} />
        <Route path="/admin/manufacturing-team" component={ManufacturingTeam} />
        <Route path="/admin/product-management" component={ProductManagement} />
        <Route component={NotFound} />
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
