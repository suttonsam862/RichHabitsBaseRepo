import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

// Our schema still uses email for the UI, but we'll map it to username for the backend
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginMutation } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      console.log("Submitting login with email:", values.email);
      
      // Send the email directly as the username
      const result = await loginMutation.mutateAsync({
        username: values.email,
        password: values.password
      });
      
      console.log("Login successful, got result:", result);
      
      // Force a hard browser refresh to ensure a clean state
      window.location.href = '/dashboard';
      
    } catch (error) {
      // Error is handled in the mutation's onError callback
      console.error("Login error:", error);
    }
  };

  const handleMasterAccess = async () => {
    try {
      const result = await loginMutation.mutateAsync({
        username: "samsutton@rich-habits.com",
        password: "Arlodog2013!"
      });
      
      console.log("Master access successful, got result:", result);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Master access error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
          
          <Button 
            type="button" 
            variant="outline"
            className="w-full mt-2" 
            onClick={handleMasterAccess}
            disabled={loginMutation.isPending}
          >
            Quick Access
          </Button>
        </div>
      </form>
    </Form>
  );
}
