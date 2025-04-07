import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/login-form";
import SignupForm from "@/components/auth/signup-form";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      console.log("User is logged in, redirecting to dashboard...", user);
      navigate("/");
    }
  }, [user, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-white p-10 text-gray-900 lg:flex border-r">
        <div className="absolute inset-0 bg-gray-50" />
        <div className="relative z-20 flex items-center text-xl font-bold">
          <span className="text-primary">Rich</span> Habits
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-gray-700">
              "Our dashboard has transformed how we track leads, manage orders, and communicate with clients. This comprehensive system helps us build rich business habits every day."
            </p>
            <footer className="text-sm text-gray-600">Samuel Sutton, CEO</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to Rich Habits Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Your business management solution
            </p>
          </div>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <LoginForm />
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center text-sm">
                  <p className="px-8 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setActiveTab("register")}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Register
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Enter your information to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SignupForm />
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center text-sm">
                  <p className="px-8 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("login")}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Sign In
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}