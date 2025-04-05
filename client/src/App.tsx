import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Loader2 } from "lucide-react";

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>;
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      {user ? (
        <Layout user={user as AuthUser}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/leads" component={Leads} />
            <Route path="/orders" component={Orders} />
            <Route path="/messages" component={Messages} />
            <Route path="/reports" component={Reports} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/profile" component={Profile} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      ) : (
        <Route>
          <AuthPage />
        </Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
