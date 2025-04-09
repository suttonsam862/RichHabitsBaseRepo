import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { AuthUser, UserRole } from "@/types";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string; // Changed from email to username to match our backend expectations
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  fullName: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<any, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Always fetch fresh data
  });
  
  // Log user data for debugging
  if (user) {
    console.log("User data fetched:", user);
  }
  if (error) {
    console.error("Error fetching user data:", error);
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (response: any) => {
      console.log("Login mutation success, setting user data:", response);
      
      // Directly set the user object as returned by server
      queryClient.setQueryData(["/api/user"], response);
      
      // Force a refetch to ensure we have the latest state including all user data
      queryClient.invalidateQueries({ 
        queryKey: ["/api/user"]
      });
      
      const userName = response.fullName || response.username || response.email;
      toast({
        title: "Login successful",
        description: `Welcome back, ${userName}!`,
      });
      
      // Force a window location refresh to ensure the entire app state is reset with the new user
      // This helps solve the issue with login requiring manual refresh
      window.location.href = '/dashboard';
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (response: any) => {
      console.log("Registration success, setting user data:", response);
      
      // Store the response directly in the cache
      queryClient.setQueryData(["/api/user"], response);
      
      // Force a refetch to ensure we have the latest state including all user data
      queryClient.invalidateQueries({ 
        queryKey: ["/api/user"] 
      });
      
      const userName = response.fullName || response.username || response.email;
      toast({
        title: "Registration successful",
        description: `Welcome, ${userName}!`,
      });
      
      // Force a window location refresh to ensure the entire app state is reset with the new user
      // This helps solve the issue with registration requiring manual refresh
      window.location.href = '/dashboard';
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to auth page after logout
      window.location.href = '/auth';
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Map the User from backend to AuthUser for frontend
  const mapUserToAuthUser = (response: any): AuthUser | null => {
    if (!response) return null;
    
    // Check if we have a nested user object (from API response)
    const userFromDb = response.user || response;
    
    if (!userFromDb) return null;
    
    console.log("Raw user data for mapping:", userFromDb);
    
    // For 'admin' role, make all pages visible by default by returning null for visiblePages
    // This ensures the sidebar filtering function will show all pages to admin users
    let visiblePages = null;
    
    // Get user role from DB or default to 'user' if missing
    // Important: ensure consistency in role casing
    const userRole = (userFromDb.role || 'user').toLowerCase();
    
    // Ensure role matches one of our valid UserRole types 
    const validRoles = ['admin', 'sales', 'designer', 'manufacturing', 'customer', 'user'];
    const role = validRoles.includes(userRole) 
      ? userRole as UserRole 
      : 'user';
    
    // Special handling for admin role - always use null visiblePages to show all
    if (role !== 'admin') {
      visiblePages = Array.isArray(userFromDb.visiblePages) 
        ? userFromDb.visiblePages 
        : [];
    }
    
    // Always log the role for debugging
    console.log("MAPPED USER ROLE:", role);
    console.log("IS ADMIN?", role === 'admin');
    
    return {
      id: userFromDb.id.toString(),
      email: userFromDb.email || userFromDb.username,
      username: userFromDb.username,
      fullName: userFromDb.fullName === null ? undefined : userFromDb.fullName,
      avatarUrl: userFromDb.avatarUrl === null ? undefined : userFromDb.avatarUrl,
      role: role,
      permissions: Array.isArray(userFromDb.permissions) ? userFromDb.permissions : [],
      visiblePages: visiblePages
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user: mapUserToAuthUser(user),
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}