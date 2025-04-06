import { Switch, Route, Redirect, Link } from "wouter";
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
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";

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
        <Route path="/messages" component={Messages} />
        <Route path="/reports" component={Reports} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/users" component={UserManagement} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p className="mb-4">This is a test page to debug routing issues.</p>
      <div className="space-y-2">
        <div><Link href="/">Home</Link></div>
        <div><Link href="/auth">Auth Page</Link></div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/debug" component={DebugPage} />
        <Route>
          <Routes />
        </Route>
      </Switch>
    </AuthProvider>
  );
}

function Routes() {
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
  
  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <Route path="/:rest*">
        {!user ? <Redirect to="/auth" /> : <DashboardLayout />}
      </Route>
    </Switch>
  );
}

export default App;
