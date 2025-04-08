import { Switch, Route } from "wouter";
import { AuthUser } from "./types";
import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import AuthPage from "./pages/auth-page";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";

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
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  // If not authenticated, show the auth page
  if (!user) {
    return (
      <Switch>
        <Route path="/">
          <AuthPage />
        </Route>
        <Route>
          <AuthPage />
        </Route>
      </Switch>
    );
  }
  
  // If authenticated, show the dashboard
  return (
    <Layout user={user as AuthUser}>
      <Switch>
        <Route path="/">
          <Dashboard />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Layout>
  );
}

export default App;
