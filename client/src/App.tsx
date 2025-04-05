import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { getCurrentUser } from "./lib/supabase";
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
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import NotFound from "@/pages/not-found";
import { mockUsers } from "./local-data";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          setUser({
            id: user.id,
            email: user.email!,
            username: user.user_metadata.username,
            fullName: user.user_metadata.full_name,
            avatarUrl: user.user_metadata.avatar_url,
          });
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setSupabaseError("Could not connect to Supabase. Would you like to use mock data for demonstration?");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Function to use mock data
  const useMockData = () => {
    const mockUser = mockUsers[0];
    setUser({
      id: mockUser.id.toString(),
      email: mockUser.email,
      username: mockUser.username || '',
      fullName: mockUser.fullName || '',
      avatarUrl: mockUser.avatarUrl || '',
      role: mockUser.role
    });
    setUsingMockData(true);
    setSupabaseError(null);
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user && !supabaseError && location !== "/login" && location !== "/signup") {
      setLocation("/login");
    }
  }, [user, loading, location, setLocation, supabaseError]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Show error and option to use mock data
  if (supabaseError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700">Connection Error</h2>
          </div>
          <p className="mb-6 text-gray-700">{supabaseError}</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button onClick={useMockData}>Use Demo Data</Button>
          </div>
        </div>
      </div>
    );
  }

  // Public routes
  if (["/login", "/signup"].includes(location)) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Protected routes
  return (
    <Layout user={user}>
      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm">
          Using demo data for demonstration purposes. Some features like saving changes won't work.
        </div>
      )}
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
  );
}

export default App;
