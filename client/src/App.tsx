import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Simplified App to test authentication
function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  // Using the correct username for this test
  const [email, setEmail] = useState("samsutton@rich-habits.com");
  const [password, setPassword] = useState("Arlodog2013!");
  
  // Check if user is logged in when app loads
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/user", {
          credentials: "include"
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setResult(JSON.stringify(data, null, 2));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    }
    
    checkAuth();
  }, []);

  async function testUserEndpoint() {
    setLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/user", {
        method: "GET",
        credentials: "include"
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        setUser(data);
      }
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testLoginEndpoint() {
    setLoading(true);
    setResult("");
    try {
      console.log("Sending login request with:", { email, password });
      
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
      
      console.log("Login response status:", response.status);
      
      const data = await response.json();
      console.log("Login response data:", data);
      
      setResult(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        setUser(data);
        console.log("Login successful:", data);
      }
    } catch (error) {
      console.error("Login error:", error);
      setResult(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function testLogoutEndpoint() {
    setLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        setUser(null);
        setResult("Logged out successfully");
      } else {
        const data = await response.json();
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="text-center mb-4 p-2 bg-green-100 text-green-800 rounded">
              Logged in as: {user.user?.fullName || user.user?.email || "Unknown"}
            </div>
          ) : null}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={testLoginEndpoint} 
              disabled={loading} 
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Login
            </Button>
            
            <Button 
              onClick={testUserEndpoint} 
              disabled={loading} 
              variant="outline" 
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Check Auth
            </Button>
            
            {user && (
              <Button 
                onClick={testLogoutEndpoint} 
                disabled={loading} 
                variant="destructive"
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Logout
              </Button>
            )}
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
