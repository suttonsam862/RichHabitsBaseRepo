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
    <div className="flex min-h-screen h-screen bg-gray-50">
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <MobileMenu onMenuToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col w-full relative md:pl-0 pt-16 md:pt-0 bg-white overflow-hidden">
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
