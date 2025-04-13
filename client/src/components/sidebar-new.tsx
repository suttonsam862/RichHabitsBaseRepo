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
    // If user is admin, show all menu items without filtering
    if (user?.role === 'admin') {
      console.log("Admin user - showing all pages without filtering");
      return menuGroups;
    }
    
    // If this is Charlie Reeves (special case), ensure we don't filter too aggressively
    const isCharlie = user?.username === 'charliereeves' || user?.email === 'charliereeves@rich-habits.com';
    if (isCharlie) {
      console.log("Charlie Reeves detected - ensuring all permitted pages are visible");
    }
    
    // If visiblePages is not defined or empty, apply different logic based on role
    if (!user?.visiblePages || user.visiblePages.length === 0) {
      console.log("No visible pages array found for user:", user?.username, "with role:", user?.role);
      
      // Show only essential pages for users with no visiblePages
      console.log("User with no visiblePages - showing only essential pages");
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
    
    // Create a lookup set for easier checking
    const visiblePagesSet = new Set(user.visiblePages);
    
    // Log all the available menu items to help with debugging
    console.log("Available menu groups before filtering:", menuGroups.map(g => ({
      title: g.title,
      items: g.items.map(i => ({ 
        name: i.name, 
        id: i.id || i.href.replace(/^\//, ''),
        href: i.href 
      }))
    })));
    
    // Special case for Charlie - make sure design and manufacturing are visible if present
    if (isCharlie) {
      // Main pages
      visiblePagesSet.add('design');
      visiblePagesSet.add('manufacturing');
      visiblePagesSet.add('messages');
      
      // Admin pages - ensure we add both forms (with and without admin/ prefix)
      visiblePagesSet.add('admin/design-team');
      visiblePagesSet.add('design-team');
      visiblePagesSet.add('admin/product-management');
      visiblePagesSet.add('product-management');
      visiblePagesSet.add('admin/sales-team');
      visiblePagesSet.add('sales-team');
      visiblePagesSet.add('admin/manufacturing-team');
      visiblePagesSet.add('manufacturing-team');
      
      // For admin product creation
      visiblePagesSet.add('admin/product-creation');
      visiblePagesSet.add('product-creation');
      
      // Make sure these sections explicitly match what might be in the custom menu
      if (customMenuGroups.length > 0) {
        customMenuGroups.forEach(group => {
          if (group.items) {
            group.items.forEach((item: any) => {
              if (item.id === 'design' || 
                  item.id === 'manufacturing' || 
                  item.id === 'admin/design-team' || 
                  item.id === 'messages' ||
                  item.id === 'product-management' ||
                  item.id === 'sales-team' ||
                  item.id === 'design-team' ||
                  item.id === 'manufacturing-team' ||
                  item.id === 'product-creation') {
                visiblePagesSet.add(item.id);
                
                // Also add the admin-prefixed version
                if (!item.id.startsWith('admin/')) {
                  visiblePagesSet.add(`admin/${item.id}`);
                }
              }
            });
          }
        });
      }
      
      // Debug log to confirm
      console.log("Charlie's final visible pages:", Array.from(visiblePagesSet));
    }
    
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Always show profile and settings (essential pages)
        if (item.href === '/profile' || item.href === '/settings') {
          console.log(`Essential page ${item.name}: always visible`);
          return true;
        }
        
        let pageId;
        
        // If the item has an id, use it directly
        if (item.id) {
          pageId = item.id;
        } else {
          // Extract the id from the href (remove leading slash)
          pageId = item.href.replace(/^\//, '');
        }
        
        // Check if the page is in the visible pages set
        // First check direct match
        let isVisible = visiblePagesSet.has(pageId);
        
        // If not found, check with admin prefix
        if (!isVisible && !pageId.startsWith('admin/')) {
          isVisible = visiblePagesSet.has(`admin/${pageId}`);
        }
        
        // If still not found and it has admin/ prefix, check without it
        if (!isVisible && pageId.startsWith('admin/')) {
          isVisible = visiblePagesSet.has(pageId.replace('admin/', ''));
        }
        
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
    
    console.log('Applying custom settings to default menu:', defaultMenuGroups);
    console.log('Custom menu groups:', customMenuGroups);
    
    // Create icon map for easy lookup
    const iconMap: Record<string, React.ReactNode> = {
      dashboard: <LayoutDashboard className="mr-2" size={16} />,
      leads: <Users className="mr-2" size={16} />,
      orders: <ShoppingBag className="mr-2" size={16} />,
      design: <Palette className="mr-2" size={16} />,
      manufacturing: <Factory className="mr-2" size={16} />,
      organizations: <Building2 className="mr-2" size={16} />,
      messages: <MessageSquare className="mr-2" size={16} />,
      catalog: <Shirt className="mr-2" size={16} />,
      'product-management': <PackageOpen className="mr-2" size={16} />,
      'sales-team': <BriefcaseBusiness className="mr-2" size={16} />,
      'design-team': <PenTool className="mr-2" size={16} />,
      'manufacturing-team': <HardHat className="mr-2" size={16} />,
      corporate: <Building className="mr-2" size={16} />,
      reports: <FileBarChart className="mr-2" size={16} />,
      'user-management': <UserCog className="mr-2" size={16} />,
      'order-tracking': <ShoppingBag className="mr-2" size={16} />,
      'design-communication': <Palette className="mr-2" size={16} />,
      'production-communication': <Factory className="mr-2" size={16} />,
      profile: <User className="mr-2" size={16} />,
      settings: <Settings className="mr-2" size={16} />,
      outlook: <MessageCircle className="mr-2" size={16} />,
      feedback: <MessageSquare className="mr-2" size={16} />,
      // Events module
      'events/calendar': <CalendarClock className="mr-2" size={16} />,
      'events/registration': <Users className="mr-2" size={16} />,
      'events/attendees': <Users className="mr-2" size={16} />,
      'events/management': <CalendarClock className="mr-2" size={16} />,
    };
    
    // Create a completely new menu structure based on custom groups
    // This ensures we use the exact structure from the settings
    const result = customMenuGroups.map(customGroup => {
      // Create a new group with the custom title
      const newGroup: MenuGroup = {
        title: customGroup.title,
        items: []
      };
      
      // Add items from the custom group
      newGroup.items = customGroup.items
        .filter((item: any) => item.enabled !== false) // Skip disabled items
        .map((customItem: any) => {
          const itemId = customItem.id;
          const icon = iconMap[itemId] || <User className="mr-2" size={16} />;
          
          // Build the path based on the id
          let href = '';
          
          // Handle different page path patterns
          if (itemId.startsWith('admin/')) {
            // If the ID already has admin/ prefix, use it directly
            href = `/${itemId}`;
          } else if (itemId === 'product-management' || 
              itemId === 'sales-team' || 
              itemId === 'design-team' || 
              itemId === 'manufacturing-team' || 
              itemId === 'order-management' ||
              itemId === 'events' || 
              itemId === 'integrations' ||
              itemId === 'product-creation') {
            // For known admin pages, add the admin/ prefix
            href = `/admin/${itemId}`;
          } else if (itemId.startsWith('/')) {
            // If it starts with a slash, use as is
            href = itemId;
          } else {
            // For other pages, add slash prefix
            href = `/${itemId}`;
          }
          
          // Return a new menu item with the custom name and icon
          return {
            name: customItem.name,
            href: href,
            icon: icon,
            id: itemId
          };
        });
      
      return newGroup;
    }).filter(group => group.items.length > 0); // Filter out empty groups
    
    console.log('Result after applying custom settings:', result);
    return result;
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
              id: "admin/product-management",
            },
            {
              name: "Sales Team",
              href: "/admin/sales-team",
              icon: <BriefcaseBusiness className="mr-2" size={16} />,
              id: "admin/sales-team",
            },
            {
              name: "Design Team",
              href: "/admin/design-team",
              icon: <PenTool className="mr-2" size={16} />,
              id: "admin/design-team",
            },
            {
              name: "Manufacturing Team",
              href: "/admin/manufacturing-team",
              icon: <HardHat className="mr-2" size={16} />,
              id: "admin/manufacturing-team",
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
    
    // Filter the default menu first, then apply custom settings
    // This ensures we check permissions before customizing the menu
    const customizedMenu = applyCustomSettings(defaultMenu);
    return filterMenuItemsByVisibility(customizedMenu);
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