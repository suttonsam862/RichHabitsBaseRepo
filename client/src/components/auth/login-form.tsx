import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { signIn } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log('Submitting login form for:', values.email);
      
      const { data, error } = await signIn(values.email, values.password);
      
      if (error) {
        console.error('Login error in form submission:', error);
        throw error;
      }
      
      console.log('Login successful, redirecting to dashboard');
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Redirect to dashboard after successful login
      setLocation("/dashboard");
    } catch (error: any) {
      console.error('Caught error in login form:', error);
      
      // Provide specific error messages based on common authentication issues
      let errorMessage = "Please check your credentials and try again";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "The email or password you entered is incorrect";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please verify your email address before logging in";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "Too many login attempts. Please try again later";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>Enter your email and password to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              {...register("email")} 
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button 
                variant="link" 
                className="text-sm p-0 h-auto"
                onClick={() => toast({
                  title: "Password reset",
                  description: "Feature coming soon!",
                })}
              >
                Forgot password?
              </Button>
            </div>
            <Input 
              id="password" 
              type="password" 
              {...register("password")} 
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto text-brand-600 dark:text-brand-400"
            onClick={() => setLocation("/signup")}
          >
            Sign up
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
