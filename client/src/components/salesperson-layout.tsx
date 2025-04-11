import { ReactNode } from "react";
import { AuthUser } from "@/types";
import { SalespersonSidebar } from "./salesperson-sidebar";

export function SalespersonLayout({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SalespersonSidebar user={user} />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-60">
        {/* Mobile top spacing for mobile menu */}
        <div className="h-16 md:h-0"></div>
        
        {/* Page Content */}
        <main className="bg-white min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}