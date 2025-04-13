import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  PackageOpen,
  MessageCircle,
  ChevronDown,
  ChevronRight
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
  // Store collapsed state for each group
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  // Store custom navigation groups from settings
  const [customMenuGroups, setCustomMenuGroups] = useState<any[]>([]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Define the type for navigation settings
  interface NavigationSettings {
    visiblePages?: string[];
    groups?: {
      id: string;
      title: string;
      collapsed?: boolean;
      items: {
        id: string;
        name: string;
        enabled?: boolean;
      }[];
    }[];
  }

  // Fetch navigation settings from the server
  const { data: serverSettings, isLoading: isLoadingSettings } = useQuery<{ settings: NavigationSettings }>({
    queryKey: ['/api/settings/navigation'],
    enabled: !!user, // Only run the query when we have a user
    retry: 1, // Don't retry more than once
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Initialize collapsed state and other sidebar configs from localStorage AND server
  useEffect(() => {
    try {
      // Load collapsed state from localStorage
      const savedState = localStorage.getItem('sidebarCollapsedGroups');
      if (savedState) {
        setCollapsedGroups(JSON.parse(savedState));
      }
      
      // First try to load from server settings
      if (serverSettings?.settings) {
        console.log('Loading sidebar settings from server:', serverSettings);
        
        // Check if we have visible pages
        if (serverSettings.settings.visiblePages) {
          console.log('Server has provided visiblePages:', serverSettings.settings.visiblePages);
          // Make sure the user object has the visiblePages array
          if (user && !user.visiblePages) {
            user.visiblePages = serverSettings.settings.visiblePages;
          }
        }
        
        // Check if we have custom group settings
        if (serverSettings.settings.groups && serverSettings.settings.groups.length > 0) {
          console.log('Server has provided custom groups:', serverSettings.settings.groups);
          
          // Map server data to expected format
          const serverGroups = serverSettings.settings.groups.map((group: any) => ({
            id: group.id,
            title: group.title,
            collapsed: group.collapsed || false,
            items: group.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              enabled: item.enabled !== false, // Default to true if not specified
            }))
          }));
          
          setCustomMenuGroups(serverGroups);
          
          // Initialize collapsed state for each group based on their settings
          const initialCollapsedState: Record<string, boolean> = {};
          serverGroups.forEach((group: any) => {
            if (group.collapsed) {
              initialCollapsedState[group.title] = true;
            }
          });
          
          setCollapsedGroups(prev => ({
            ...prev,
            ...initialCollapsedState
          }));
          
          return; // If server settings loaded successfully, don't try localStorage
        }
      }
      
      // Fallback to localStorage if server settings not available
      const savedGroups = localStorage.getItem('sidebarGroups');
      if (savedGroups) {
        console.log('Loading sidebar groups from localStorage (server settings not available)');
        const parsedGroups = JSON.parse(savedGroups);
        setCustomMenuGroups(parsedGroups);
        
        // Initialize collapsed state for each group based on their settings
        const initialCollapsedState: Record<string, boolean> = {};
        parsedGroups.forEach((group: any) => {
          if (group.collapsed) {
            initialCollapsedState[group.title] = true;
          }
        });
        
        setCollapsedGroups(prev => ({
          ...prev,
          ...initialCollapsedState
        }));
      }
    } catch (error) {
      console.error('Failed to load sidebar state:', error);
    }
  }, [serverSettings, user]);

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsedGroups', JSON.stringify(collapsedGroups));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  }, [collapsedGroups]);

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
    // If visiblePages is not defined or empty, return all menu items
    if (!user?.visiblePages || user.visiblePages.length === 0) {
      console.log("No visible pages filter applied for user:", user?.username);
      return menuGroups;
    }

    console.log("Filtering pages by visibility for user:", user?.username, user.visiblePages);
    
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Always show profile and settings (essential pages)
        if (item.href === '/profile' || item.href === '/settings') {
          return true;
        }
        
        // If the item has an id, check if it's in the user's visiblePages
        if (item.id) {
          const isVisible = user.visiblePages?.includes(item.id) ?? true;
          console.log(`Checking page with ID ${item.id}: ${isVisible ? 'visible' : 'hidden'}`);
          return isVisible;
        }
        
        // For items without an id, extract the id from the href (remove leading slash)
        const pageId = item.href.replace(/^\//, '');
        const isVisible = user.visiblePages?.includes(pageId) ?? true;
        console.log(`Checking page ${item.name} (${pageId}): ${isVisible ? 'visible' : 'hidden'}`);
        return isVisible;
      })
    })).filter(group => group.items.length > 0); // Remove empty groups
  };

  // Apply custom navigation settings to default menu items
  const applyCustomSettings = (defaultMenuGroups: MenuGroup[]): MenuGroup[] => {
    if (!customMenuGroups || customMenuGroups.length === 0) {
      return defaultMenuGroups;
    }
    
    // For each default menu group, look for a matching custom group
    return defaultMenuGroups.map(defaultGroup => {
      // Find matching custom group by ID
      const customGroup = customMenuGroups.find(cg => cg.id === defaultGroup.title.toLowerCase());
      
      if (!customGroup) {
        return defaultGroup; // No custom settings for this group
      }
      
      // Apply custom title if available
      const title = customGroup.title || defaultGroup.title;
      
      // Map default items to custom ones
      const items = defaultGroup.items.map(defaultItem => {
        // Extract id from href if not explicitly set
        const itemId = defaultItem.id || defaultItem.href.replace(/^\//, '');
        
        // Find matching custom item
        const customItem = customGroup.items.find((ci: any) => ci.id === itemId);
        
        if (!customItem || customItem.enabled === false) {
          // If no custom settings or disabled, return null (will be filtered out)
          return customItem?.enabled === false ? null : defaultItem;
        }
        
        // Apply custom name if available
        return {
          ...defaultItem,
          name: customItem.name || defaultItem.name
        };
      }).filter(Boolean) as MenuItem[]; // Filter out null items and cast to MenuItem[]
      
      return {
        title,
        items
      };
    }).filter(group => group.items.length > 0); // Filter out empty groups
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    // Default menu for non-admin roles
    let defaultMenu: MenuGroup[] = [
      {
        title: "Main",
        items: [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard className="mr-2" size={16} />,
          },
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
    
    // Admin dashboard
    if (user?.role === 'admin') {
      defaultMenu = [
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
              href: "/corporate",
              icon: <Building className="mr-2" size={16} />,
            },
            {
              name: "Reports",
              href: "/admin/reports",
              icon: <FileBarChart className="mr-2" size={16} />,
            },
            {
              name: "User Management",
              href: "/user-management",
              icon: <UserCog className="mr-2" size={16} />,
              id: "user-management", // Adding explicit id to match page settings
            },
          ],
        },
        {
          title: "Camps & Teams",
          items: [
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
    
    // Apply any custom navigation settings to the default menu
    return filterMenuItemsByVisibility(applyCustomSettings(defaultMenu));
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
      
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-4">
          {menuItems.map((group) => (
            <div key={group.title} className="py-2">
              <div 
                className="flex items-center justify-between cursor-pointer px-3 mb-2"
                onClick={() => toggleGroup(group.title)}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </p>
                <button className="text-gray-500 hover:text-gray-700">
                  {collapsedGroups[group.title] ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
              
              {!collapsedGroups[group.title] && (
                <div className="space-y-1">
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
              )}
            </div>
          ))}
        </nav>
      </div>
      
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