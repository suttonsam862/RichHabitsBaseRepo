import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  MessageSquare,
  FileBarChart,
  BarChart3,
  User,
  Settings,
  LogOut,
  UserCog,
  Shield
} from "lucide-react";

interface SidebarProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { logoutMutation } = useAuth();

  const handleSignOut = async () => {
    try {
      await logoutMutation.mutateAsync();
      // No need to redirect, the auth provider will handle this
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    const items = [
      {
        title: "Main",
        items: [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard className="mr-2" size={16} />,
          },
          {
            name: "Leads",
            href: "/leads",
            icon: <Users className="mr-2" size={16} />,
          },
          {
            name: "Orders",
            href: "/orders",
            icon: <ShoppingBag className="mr-2" size={16} />,
          },
          {
            name: "Messages",
            href: "/messages",
            icon: <MessageSquare className="mr-2" size={16} />,
          },
        ],
      },
      {
        title: "Analytics",
        items: [
          {
            name: "Reports",
            href: "/reports",
            icon: <FileBarChart className="mr-2" size={16} />,
          },
          {
            name: "Analytics",
            href: "/analytics",
            icon: <BarChart3 className="mr-2" size={16} />,
          },
        ],
      },
      {
        title: "Settings",
        items: [
          {
            name: "Profile",
            href: "/profile",
            icon: <User className="mr-2" size={16} />,
          },
          {
            name: "Settings",
            href: "/settings",
            icon: <Settings className="mr-2" size={16} />,
          },
        ],
      },
    ];
    
    // Add User Management for admins only
    if (user?.role === 'admin') {
      items[2].items.unshift({
        name: "User Management",
        href: "/users",
        icon: <UserCog className="mr-2" size={16} />,
      });
    }
    
    return items;
  };
  
  const menuItems = getMenuItems();

  return (
    <aside
      className={cn(
        "md:flex md:w-64 lg:w-72 flex-col fixed inset-y-0 z-50 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800",
        isOpen ? "block" : "hidden md:flex"
      )}
    >
      <div className="flex h-14 items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-semibold">
          <span className="text-brand-600 dark:text-brand-400">Rich</span> Habits
        </h1>
        
        <button 
          className="md:hidden ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((group) => (
          <div key={group.title} className="py-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-3">
              {group.title}
            </p>
            {group.items.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
              >
                <a 
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href || (item.href === "/dashboard" && location === "/") 
                      ? "bg-brand-50 dark:bg-gray-700 text-brand-600 dark:text-brand-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {item.icon}
                  {item.name}
                </a>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={`${user.fullName || user.username || 'User'}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-100 text-brand-600">
                {(user.fullName || user.username || user.email)?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {user.fullName || user.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={handleSignOut}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
