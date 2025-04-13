import { ReactNode, useEffect } from "react";
import { HybridSidebar } from "./hybrid-sidebar";
import { AuthUser } from "@/types";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ROLES } from "@shared/schema";

export function HybridLayout({ children, user }: { children: ReactNode; user: AuthUser }) {
  const { toast } = useToast();
  const [location] = useLocation();
  
  useEffect(() => {
    // Check if the user has the required role for this layout
    if (user.role !== ROLES.HYBRID && user.role !== ROLES.ADMIN) {
      toast({
        title: "Access Restricted",
        description: "You do not have permission to access the hybrid role area.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  return (
    <div className="h-full flex overflow-hidden bg-slate-50">
      {/* Hybrid sidebar - fixed on desktop, slide-in on mobile */}
      <HybridSidebar user={user} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col md:pl-60">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-10">
          {/* Page header - can be customized per page */}
          <div className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-white shadow-sm">
            <h1 className="text-lg font-medium">
              {location === "/" || location === "/dashboard"
                ? "Hybrid Dashboard"
                : location === "/leads/unclaimed"
                ? "Unclaimed Leads"
                : location === "/orders"
                ? "My Orders"
                : location === "/orders/create"
                ? "Create New Order"
                : location === "/orders/history"
                ? "Order History"
                : location === "/unclaimed-designs"
                ? "Unclaimed Design Jobs"
                : location === "/design-jobs"
                ? "My Design Jobs"
                : location === "/design-submission"
                ? "Design Submission"
                : location === "/revisions"
                ? "Revision Requests"
                : location === "/customer-input"
                ? "Customer Input Review"
                : location === "/sales-process-guide"
                ? "Sales Process Guide"
                : location === "/design-process-guide"
                ? "Design Process Guide"
                : location === "/profile"
                ? "My Profile"
                : "Hybrid Portal"}
            </h1>
          </div>
          
          {/* Page content */}
          <div className="px-4 py-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}