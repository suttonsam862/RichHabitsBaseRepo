import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AuthUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FilePlus,
  Archive,
  Bell,
  LogOut,
  User,
  Settings,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  PenTool,
  Palette,
  ClipboardList,
  FileUp,
  StickyNote,
  MessagesSquare,
  FileBarChart,
  SquareArrowUp,
} from "lucide-react";

export function HybridSidebar({ user }: { user: AuthUser }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('collapsedSidebarGroups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved collapsed groups:", e);
        return {};
      }
    }
    return { 
      sales: false,
      design: false,
      tools: false
    };
  });
  
  // Combine sales and design navigation items
  const navigationGroups = [
    {
      id: "sales",
      title: "Sales",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="mr-2" size={16} />,
          id: "dashboard",
        },
        {
          name: "Unclaimed Leads",
          href: "/leads/unclaimed",
          icon: <Users className="mr-2" size={16} />,
          id: "leads/unclaimed",
        },
        {
          name: "My Orders",
          href: "/orders",
          icon: <ShoppingBag className="mr-2" size={16} />,
          id: "orders",
        },
        {
          name: "Create Order",
          href: "/orders/create",
          icon: <FilePlus className="mr-2" size={16} />,
          id: "create-order",
        },
        {
          name: "Request Sizes",
          href: "/size-requests",
          icon: <SquareArrowUp className="mr-2" size={16} />,
          id: "size-requests",
        },
        {
          name: "Order History",
          href: "/orders/history",
          icon: <Archive className="mr-2" size={16} />,
          id: "order-history",
        },
        {
          name: "Sales Process Guide",
          href: "/sales-process-guide",
          icon: <FileBarChart className="mr-2" size={16} />,
          id: "sales-process-guide",
        }
      ],
    },
    {
      id: "design",
      title: "Design",
      items: [
        {
          name: "Unclaimed Designs",
          href: "/unclaimed-designs",
          icon: <PenTool className="mr-2" size={16} />,
          id: "unclaimed-designs",
        },
        {
          name: "My Design Jobs",
          href: "/design-jobs",
          icon: <ClipboardList className="mr-2" size={16} />,
          id: "design-jobs",
        },
        {
          name: "Design Submission",
          href: "/design-submission",
          icon: <FileUp className="mr-2" size={16} />,
          id: "design-submission",
        },
        {
          name: "Revision Requests",
          href: "/revisions",
          icon: <StickyNote className="mr-2" size={16} />,
          id: "revisions",
        },
        {
          name: "Customer Input",
          href: "/customer-input",
          icon: <MessagesSquare className="mr-2" size={16} />,
          id: "customer-input",
        },
        {
          name: "Design Process Guide",
          href: "/design-process-guide",
          icon: <FileBarChart className="mr-2" size={16} />,
          id: "design-process-guide",
        },
      ],
    },
    {
      id: "tools",
      title: "Tools",
      items: [
        {
          name: "Notifications",
          href: "/notifications",
          icon: <Bell className="mr-2" size={16} />,
          id: "notifications",
        },
        {
          name: "Design Communication",
          href: "/design-communication",
          icon: <Palette className="mr-2" size={16} />,
          id: "design-communication",
        },
        {
          name: "Production Communication",
          href: "/production-communication",
          icon: <MessageSquare className="mr-2" size={16} />,
          id: "production-communication",
        },
        {
          name: "Profile",
          href: "/profile",
          icon: <User className="mr-2" size={16} />,
          id: "profile",
        },
        {
          name: "Settings",
          href: "/settings",
          icon: <Settings className="mr-2" size={16} />,
          id: "settings",
        },
      ],
    },
  ];

  // Logic to handle group collapse
  const toggleGroupCollapse = (groupId: string) => {
    const newCollapsedState = {
      ...collapsedGroups,
      [groupId]: !collapsedGroups[groupId],
    };
    setCollapsedGroups(newCollapsedState);
    localStorage.setItem('collapsedSidebarGroups', JSON.stringify(newCollapsedState));
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Find the current active route for highlighting
  const [location] = useLocation();
  const currentPath = location;
  
  // Determine if a nav item is active based on current path
  const isActive = (path: string) => {
    if (path === "/dashboard" && currentPath === "/") return true;
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between bg-white border-b z-30 md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setOpenMobileMenu(!openMobileMenu)}
        >
          {openMobileMenu ? <X size={20} /> : <Menu size={20} />}
        </Button>
        <div className="flex items-center space-x-2">
          <div className="font-semibold">Rich Habits Dashboard</div>
        </div>
        <div className="w-10"></div> {/* Empty spacer for flex justification */}
      </div>

      {/* Sidebar - visible on desktop, slides in on mobile */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-60 bg-white border-r z-20 transform transition-transform duration-300 
          ${openMobileMenu ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Company logo/branding */}
        <div className="h-16 flex items-center px-4 border-b">
          <div className="text-lg font-semibold">Rich Habits</div>
        </div>

        {/* User profile section */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback>{user?.fullName?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">Hybrid: Sales & Design</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="py-2 px-3">
            {navigationGroups.map((group) => (
              <div key={group.id} className="mb-2">
                {/* Group header with toggle */}
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <span className="text-sm font-semibold">{group.title}</span>
                  {collapsedGroups[group.id] ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                
                {/* Group items */}
                {!collapsedGroups[group.id] && (
                  <div className="ml-2 space-y-1">
                    {group.items.map((item) => (
                      <Button
                        key={item.id}
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className={`w-full justify-start text-left text-sm py-1 px-2 h-auto ${
                          isActive(item.href) ? "bg-gray-100" : ""
                        }`}
                        onClick={() => {
                          navigate(item.href);
                          setOpenMobileMenu(false);
                        }}
                      >
                        {item.icon}
                        {item.name}
                      </Button>
                    ))}
                  </div>
                )}
                
                <Separator className="my-2" />
              </div>
            ))}
          </div>

          {/* Logout button at bottom */}
          <div className="px-3 pb-4 absolute bottom-0 w-full">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm py-1 px-2 h-auto text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2" size={16} />
              Logout
            </Button>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}