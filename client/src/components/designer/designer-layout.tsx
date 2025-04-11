import { ReactNode, useEffect } from "react";
import { DesignerSidebar } from "./designer-sidebar";
import { AuthUser } from "@/types";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function DesignerLayout({ children, user }: { children: ReactNode; user: AuthUser }) {
  const { toast } = useToast();
  const [location] = useLocation();
  
  useEffect(() => {
    // Check if the user has the required role for this layout
    if (user.role !== "designer") {
      toast({
        title: "Access Restricted",
        description: "You do not have permission to access the designer area.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  return (
    <div className="h-full flex overflow-hidden bg-slate-50">
      {/* Designer sidebar - fixed on desktop, slide-in on mobile */}
      <DesignerSidebar user={user} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col md:pl-60">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-10">
          {/* Page header - can be customized per page */}
          <div className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-white shadow-sm">
            <h1 className="text-lg font-medium">
              {location === "/" || location === "/dashboard"
                ? "Designer Dashboard"
                : location === "/unclaimed-designs"
                ? "Unclaimed Design Jobs"
                : location === "/design-jobs"
                ? "My Design Jobs"
                : location === "/revisions"
                ? "Revision Requests"
                : location === "/design-submission"
                ? "Design Submission"
                : location === "/customer-input"
                ? "Customer Input Review"
                : location === "/design-process-guide"
                ? "Design Process Guide"
                : location === "/profile"
                ? "My Profile"
                : "Designer Portal"}
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