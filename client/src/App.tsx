import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Simplified App to test connection
function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [email, setEmail] = useState("samsutton@rich-habits.com");
  const [password, setPassword] = useState("Arlodog2010!");

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
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
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
          
          <div className="flex gap-2">
            <Button 
              onClick={testLoginEndpoint} 
              disabled={loading} 
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Login
            </Button>
            
            <Button 
              onClick={testUserEndpoint} 
              disabled={loading} 
              variant="outline" 
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test /api/user
            </Button>
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
