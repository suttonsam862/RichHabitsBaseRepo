import { useState } from "react";
import { AuthUser } from "../types";
import Sidebar from "./sidebar-with-feedback";
import MobileMenu from "./mobile-menu";

interface LayoutProps {
  user: AuthUser | null;
  children: React.ReactNode;
}

export default function Layout({ user, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Add debug logs for user data
  console.log("LAYOUT USER OBJECT:", user);
  console.log("User role in Layout:", user?.role);
  console.log("Layout - is admin?", user?.role === 'admin');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen h-screen bg-gray-50">
      {/* Only one Sidebar component, positioned absolutely */}
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile menu at the top */}
      <MobileMenu onMenuToggle={toggleSidebar} />
      
      {/* Main content with padding to account for sidebar */}
      <div className="flex-1 flex flex-col w-full relative md:ml-72 pt-16 md:pt-0 bg-white overflow-hidden">
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
