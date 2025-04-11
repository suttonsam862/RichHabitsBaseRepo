import { ReactNode, useEffect } from "react";
import { ManufacturerSidebar } from "./manufacturer-sidebar";
import { AuthUser } from "@/types";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ROLES } from "@shared/schema";

export function ManufacturerLayout({ children, user }: { children: ReactNode; user: AuthUser }) {
  const { toast } = useToast();
  const [location] = useLocation();
  
  useEffect(() => {
    // Check if the user has the required role for this layout
    if (user.role !== "manufacturer" && user.role !== ROLES.MANUFACTURING) {
      toast({
        title: "Access Restricted",
        description: "You do not have permission to access the manufacturing area.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  return (
    <div className="h-full flex overflow-hidden bg-slate-50">
      {/* Manufacturer sidebar - fixed on desktop, slide-in on mobile */}
      <ManufacturerSidebar user={user} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-10">
          {/* Page header - can be customized per page */}
          <div className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-white shadow-sm">
            <h1 className="text-lg font-medium">
              {location === "/" || location === "/dashboard"
                ? "Manufacturing Dashboard"
                : location === "/manufacturing-orders"
                ? "Manufacturing Orders"
                : location === "/cost-input"
                ? "Cost Input"
                : location === "/status-update"
                ? "Production Status"
                : location === "/shipping"
                ? "Completion & Shipping"
                : location === "/order-history"
                ? "Order History"
                : location === "/metrics"
                ? "Production Metrics"
                : location === "/manufacturing-guide"
                ? "Manufacturing Guide"
                : location === "/profile"
                ? "My Profile"
                : location === "/settings"
                ? "Settings"
                : "Manufacturing Portal"}
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