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
  Shield,
  Palette,
  Factory,
  Building,
  ClipboardEdit,
  Building2,
  UsersRound,
  BriefcaseBusiness,
  PenTool,
  HardHat,
  BadgeDollarSign,
  CalendarClock,
  Shirt,
  PackageOpen,
  MessageCircle
} from "lucide-react";

interface SidebarProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  id?: string; // Optional id for filtering
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  
  // Debug output for role detection
  console.log("SIDEBAR USER OBJECT:", user);
  console.log("User role:", user?.role);
  console.log("Is user admin?", user?.role === 'admin');

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

  // Filter menu items based on user's visible pages
  const filterMenuItemsByVisibility = (menuGroups: MenuGroup[]): MenuGroup[] => {
    // IMPORTANT: For admin role, always show ALL menu items regardless of visiblePages
    if (user?.role === 'admin') {
      console.log("Admin user detected, showing all pages for:", user?.username);
      return menuGroups;
    }
    
    // If visiblePages is not defined or null, use default pages for the role
    if (user?.visiblePages === null || user?.visiblePages === undefined) {
      console.log("No visible pages filter applied for user:", user?.username, "- using defaults for role");
      return menuGroups;
    }
    
    // If visiblePages is empty array and user is not admin, show only essential pages
    if (user.visiblePages.length === 0) {
      console.log("User has no visible pages, showing only essential pages for:", user?.username);
      return menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.href === '/profile' || 
          item.href === '/settings' || 
          item.href === '/dashboard'
        )
      })).filter(group => group.items.length > 0);
    }

    console.log("Filtering pages by visibility for user:", user?.username, user.visiblePages);
    
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Always show profile and settings (essential pages)
        if (item.href === '/profile' || item.href === '/settings' || item.href === '/dashboard') {
          return true;
        }
        
        // If the item has an id, check if it's in the user's visiblePages
        if (item.id) {
          const isVisible = user.visiblePages?.includes(item.id) ?? false;
          console.log(`Checking page with ID ${item.id}: ${isVisible ? 'visible' : 'hidden'}`);
          return isVisible;
        }
        
        // For items without an id, extract the id from the href (remove leading slash)
        const pageId = item.href.replace(/^\//, '');
        
        // Check special cases for design-communication and production-communication
        if (pageId === 'design-communication' || pageId === 'production-communication') {
          const isVisible = user.visiblePages?.includes(pageId) ?? false;
          console.log(`Checking special page ${item.name} (${pageId}): ${isVisible ? 'visible' : 'hidden'}`);
          return isVisible;
        }
        
        const isVisible = user.visiblePages?.includes(pageId) ?? false;
        console.log(`Checking page ${item.name} (${pageId}): ${isVisible ? 'visible' : 'hidden'}`);
        return isVisible;
      })
    })).filter(group => group.items.length > 0); // Remove empty groups
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    // Admin dashboard
    if (user?.role === 'admin') {
      return filterMenuItemsByVisibility([
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
              name: "Design",
              href: "/design",
              icon: <Palette className="mr-2" size={16} />,
            },
            {
              name: "Manufacturing",
              href: "/manufacturing",
              icon: <Factory className="mr-2" size={16} />,
            },
            {
              name: "Organizations",
              href: "/organizations",
              icon: <Building2 className="mr-2" size={16} />,
            },
            {
              name: "Messages",
              href: "/messages",
              icon: <MessageSquare className="mr-2" size={16} />,
            },
            {
              name: "Outlook",
              href: "/outlook",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "outlook",
            },
            {
              name: "Order Tracking",
              href: "/order-tracking",
              icon: <ShoppingBag className="mr-2" size={16} />,
            },
            {
              name: "Design Communication",
              href: "/design-communication",
              icon: <Palette className="mr-2" size={16} />,
            },
            {
              name: "Production Communication",
              href: "/production-communication",
              icon: <Factory className="mr-2" size={16} />,
            },
            {
              name: "Product Catalog",
              href: "/catalog",
              icon: <Shirt className="mr-2" size={16} />,
            },
          ],
        },
        {
          title: "Admin",
          items: [
            {
              name: "Product Management",
              href: "/admin/product-management",
              icon: <PackageOpen className="mr-2" size={16} />,
            },
            {
              name: "Sales Team",
              href: "/admin/sales-team",
              icon: <BriefcaseBusiness className="mr-2" size={16} />,
            },
            {
              name: "Design Team",
              href: "/admin/design-team",
              icon: <PenTool className="mr-2" size={16} />,
            },
            {
              name: "Manufacturing Team",
              href: "/admin/manufacturing-team",
              icon: <HardHat className="mr-2" size={16} />,
            },
            {
              name: "Order Management",
              href: "/admin/order-management",
              icon: <ClipboardEdit className="mr-2" size={16} />,
            },
            {
              name: "Corporate",
              href: "/corporate",
              icon: <Building className="mr-2" size={16} />,
            },
            {
              name: "Reports",
              href: "/admin/reports",
              icon: <FileBarChart className="mr-2" size={16} />,
            },
            {
              name: "Events",
              href: "/admin/events",
              icon: <CalendarClock className="mr-2" size={16} />,
            },
            {
              name: "User Management",
              href: "/user-management",
              icon: <UserCog className="mr-2" size={16} />,
              id: "user-management", // Adding explicit id to match page settings
            },
            {
              name: "Integrations",
              href: "/admin/integrations",
              icon: <Settings className="mr-2" size={16} />,
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
            {
              name: "Feedback",
              href: "/feedback",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "feedback",
            },
          ],
        },
      ]);
    }
    
    // Sales team dashboard
    if (user?.role === 'sales') {
      return filterMenuItemsByVisibility([
        {
          title: "Main",
          items: [
            {
              name: "Dashboard",
              href: "/dashboard",
              icon: <LayoutDashboard className="mr-2" size={16} />,
            },
            {
              name: "Job Postings",
              href: "/job-postings",
              icon: <BriefcaseBusiness className="mr-2" size={16} />,
            },
            {
              name: "My Leads",
              href: "/my-leads",
              icon: <Users className="mr-2" size={16} />,
            },
            {
              name: "My Orders",
              href: "/my-orders",
              icon: <ShoppingBag className="mr-2" size={16} />,
            },
            {
              name: "Submit to Design",
              href: "/submit-design",
              icon: <Palette className="mr-2" size={16} />,
            },
            {
              name: "Submit to Manufacturing",
              href: "/submit-manufacturing",
              icon: <Factory className="mr-2" size={16} />,
            },
            {
              name: "Order Tracking",
              href: "/order-tracking",
              icon: <ShoppingBag className="mr-2" size={16} />,
            },
            {
              name: "Product Catalog",
              href: "/catalog",
              icon: <Shirt className="mr-2" size={16} />,
            },
            {
              name: "Design Communication",
              href: "/design-communication",
              icon: <Palette className="mr-2" size={16} />,
            },
            {
              name: "Production Communication",
              href: "/production-communication",
              icon: <Factory className="mr-2" size={16} />,
            },
            {
              name: "Messages",
              href: "/messages",
              icon: <MessageSquare className="mr-2" size={16} />,
            },
          ],
        },
        {
          title: "Finance",
          items: [
            {
              name: "My Earnings",
              href: "/earnings",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Pending Payouts",
              href: "/pending-payouts",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
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
            {
              name: "Feedback",
              href: "/feedback",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "feedback",
            },
          ],
        },
      ]);
    }
    
    // Designer dashboard
    if (user?.role === 'designer') {
      return filterMenuItemsByVisibility([
        {
          title: "Main",
          items: [
            {
              name: "Dashboard",
              href: "/dashboard",
              icon: <LayoutDashboard className="mr-2" size={16} />,
            },
            {
              name: "Design Jobs",
              href: "/design-jobs",
              icon: <Palette className="mr-2" size={16} />,
            },
            {
              name: "My Designs",
              href: "/my-designs",
              icon: <PenTool className="mr-2" size={16} />,
            },
            {
              name: "Active Designs",
              href: "/active-designs",
              icon: <PenTool className="mr-2" size={16} />,
            },
            {
              name: "Completed Designs",
              href: "/completed-designs",
              icon: <PenTool className="mr-2" size={16} />,
            },
            {
              name: "Design Communication",
              href: "/design-communication",
              icon: <Palette className="mr-2" size={16} />,
            },
            {
              name: "Messages",
              href: "/messages",
              icon: <MessageSquare className="mr-2" size={16} />,
            },
          ],
        },
        {
          title: "Finance",
          items: [
            {
              name: "My Earnings",
              href: "/earnings",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Pending Payouts",
              href: "/pending-payouts",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Payment History",
              href: "/payment-history",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
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
            {
              name: "Feedback",
              href: "/feedback",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "feedback",
            },
          ],
        },
      ]);
    }
    
    // Manufacturing team dashboard
    if (user?.role === 'manufacturing') {
      return filterMenuItemsByVisibility([
        {
          title: "Main",
          items: [
            {
              name: "Dashboard",
              href: "/dashboard",
              icon: <LayoutDashboard className="mr-2" size={16} />,
            },
            {
              name: "Production Jobs",
              href: "/production-jobs",
              icon: <Factory className="mr-2" size={16} />,
            },
            {
              name: "Active Orders",
              href: "/active-orders",
              icon: <ShoppingBag className="mr-2" size={16} />,
            },
            {
              name: "Cost Submission",
              href: "/cost-submission",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Production Communication",
              href: "/production-communication",
              icon: <Factory className="mr-2" size={16} />,
            },
            {
              name: "Messages",
              href: "/messages",
              icon: <MessageSquare className="mr-2" size={16} />,
            },
          ],
        },
        {
          title: "Finance",
          items: [
            {
              name: "Submit Bills",
              href: "/submit-bills",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Pending Payments",
              href: "/pending-payments",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
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
            {
              name: "Feedback",
              href: "/feedback",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "feedback",
            },
          ],
        },
      ]);
    }
    
    // Customer dashboard
    if (user?.role === 'customer') {
      return filterMenuItemsByVisibility([
        {
          title: "Main",
          items: [
            {
              name: "Dashboard",
              href: "/dashboard",
              icon: <LayoutDashboard className="mr-2" size={16} />,
            },
            {
              name: "My Orders",
              href: "/my-orders",
              icon: <ShoppingBag className="mr-2" size={16} />,
            },
            {
              name: "Order Tracking",
              href: "/order-tracking",
              icon: <ShoppingBag className="mr-2" size={16} />,
            },
            {
              name: "Request Design",
              href: "/request-design",
              icon: <Palette className="mr-2" size={16} />,
            },
            {
              name: "Product Catalog",
              href: "/catalog",
              icon: <Shirt className="mr-2" size={16} />,
            },
            {
              name: "Messages",
              href: "/messages",
              icon: <MessageSquare className="mr-2" size={16} />,
            },
          ],
        },
        {
          title: "Billing",
          items: [
            {
              name: "Invoices",
              href: "/invoices",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Payment History",
              href: "/payment-history",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
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
            {
              name: "Feedback",
              href: "/feedback",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "feedback",
            },
          ],
        },
      ]);
    }
    
    // Agent dashboard menu
    if (user?.role === 'agent') {
      return filterMenuItemsByVisibility([
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
              name: "Product Catalog",
              href: "/catalog",
              icon: <Shirt className="mr-2" size={16} />,
            },
            {
              name: "Messages",
              href: "/messages",
              icon: <MessageSquare className="mr-2" size={16} />,
            },
            {
              name: "Outlook",
              href: "/outlook",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "outlook",
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
            {
              name: "Feedback",
              href: "/feedback",
              icon: <MessageCircle className="mr-2" size={16} />,
              id: "feedback",
            },
          ],
        },
      ]);
    }
    
    // Default menu items for other roles
    return filterMenuItemsByVisibility([
      {
        title: "Main",
        items: [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard className="mr-2" size={16} />,
          },
          {
            name: "Messages",
            href: "/messages",
            icon: <MessageSquare className="mr-2" size={16} />,
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
          {
            name: "Feedback",
            href: "/feedback",
            icon: <MessageCircle className="mr-2" size={16} />,
            id: "feedback",
          },
        ],
      },
    ]);
  };
  
  const menuGroups = getMenuItems();
  
  const groupedMenuItems = (
    <div className="flex flex-col min-h-full justify-between py-4">
      {/* Main menu groups */}
      <div className="space-y-6">
        {menuGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => (
                <Link 
                  key={`item-${groupIndex}-${itemIndex}`}
                  href={item.href}
                  onClick={onClose}
                >
                  <div
                    className={cn(
                      "flex items-center rounded-md px-4 py-2 text-sm font-medium cursor-pointer",
                      location === item.href
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Logout button - always visible at bottom */}
      <div className="mt-auto px-3 py-4 sticky bottom-0 bg-white border-t">
        <div className="space-y-1">
          <div
            className="flex items-center rounded-md px-4 py-3 text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2" size={16} />
            Logout
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar for both mobile and desktop */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-72 bg-white shadow-lg transition-transform duration-300 ease-in-out md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center px-6 py-4 border-b">
          <h1 className="text-lg font-bold">Rich Habits</h1>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)] pb-20 flex flex-col">
          {user && groupedMenuItems}
        </div>
      </div>
    </>
  );
}