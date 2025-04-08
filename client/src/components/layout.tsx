import { useState, useEffect } from "react";
import { AuthUser } from "../types";
import Sidebar from "./sidebar-with-feedback";
import MobileMenu from "./mobile-menu";

interface LayoutProps {
  user: AuthUser | null;
  children: React.ReactNode;
}

export default function Layout({ user, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);

  const toggleSidebar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Sidebar component */}
      <Sidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Mobile menu at the top */}
      <MobileMenu onMenuToggle={toggleSidebar} />
      
      {/* Main content with appropriate spacing */}
      <div className="flex-1 flex flex-col w-full md:ml-72 pt-16 md:pt-4 transition-all duration-200 bg-white dark:bg-gray-950">
        <main className="flex-1 w-full overflow-y-auto px-4 md:px-6 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
