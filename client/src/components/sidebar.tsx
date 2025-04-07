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
  Building2,
  UsersRound,
  BriefcaseBusiness,
  PenTool,
  HardHat,
  BadgeDollarSign,
  CalendarClock,
  Shirt,
  PackageOpen
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
    // Admin dashboard
    if (user?.role === 'admin') {
      return [
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
              name: "Order Tracking",
              href: "/order-tracking",
              icon: <ShoppingBag className="mr-2" size={16} />,
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
              name: "Corporate",
              href: "/admin/corporate",
              icon: <Building className="mr-2" size={16} />,
            },
            {
              name: "Financial",
              href: "/admin/financial",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Pending Bills",
              href: "/admin/pending-bills",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
            },
            {
              name: "Pending Payouts",
              href: "/admin/pending-payouts",
              icon: <BadgeDollarSign className="mr-2" size={16} />,
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
              href: "/users",
              icon: <UserCog className="mr-2" size={16} />,
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
          ],
        },
      ];
    }
    
    // Sales team dashboard
    if (user?.role === 'sales') {
      return [
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
          ],
        },
      ];
    }
    
    // Designer dashboard
    if (user?.role === 'designer') {
      return [
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
          ],
        },
      ];
    }
    
    // Manufacturing team dashboard
    if (user?.role === 'manufacturing') {
      return [
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
          ],
        },
      ];
    }
    
    // Customer dashboard
    if (user?.role === 'customer') {
      return [
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
              name: "Payment Methods",
              href: "/payment-methods",
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
          ],
        },
      ];
    }
    
    // Default menu items (fallback)
    return [
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
        ],
      },
    ];
  };
  
  const menuItems = getMenuItems();

  return (
    <aside
      className={cn(
        "md:flex md:w-64 lg:w-72 flex-col fixed inset-y-0 z-50 border-r bg-white shadow-sm",
        isOpen ? "block" : "hidden md:flex"
      )}
    >
      <div className="flex h-16 items-center px-4 border-b bg-white">
        <h1 className="text-lg font-bold">
          <span className="text-primary">Rich</span> Habits
        </h1>
        
        <button 
          className="md:hidden ml-auto text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((group) => (
          <div key={group.title} className="py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              {group.title}
            </p>
            {group.items.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  location === item.href || (item.href === "/dashboard" && location === "/") 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-gray-800 hover:bg-gray-100"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={`${user.fullName || user.username || 'User'}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold">
                {(user.fullName || user.username || user.email)?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {user.fullName || user.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
          <button 
            className="text-gray-500 hover:text-primary p-1 rounded-full hover:bg-gray-100"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
