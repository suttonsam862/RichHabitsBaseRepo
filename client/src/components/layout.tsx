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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <MobileMenu onMenuToggle={toggleSidebar} />
      
      <main className="flex-1 relative md:ml-64 lg:ml-72 pt-14 md:pt-0 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
