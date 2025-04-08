import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ROLES, type Role } from "@shared/schema";

// Define the available pages that can be enabled/disabled per user
export const AVAILABLE_PAGES = [
  // Core pages
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Main dashboard with overview and stats",
    category: "Core",
  },
  {
    id: "leads",
    name: "Leads",
    description: "Lead management and tracking",
    category: "Sales",
  },
  {
    id: "orders",
    name: "Orders",
    description: "Order management and processing",
    category: "Sales",
  },
  {
    id: "design",
    name: "Design",
    description: "Design creation and management",
    category: "Design",
  },
  {
    id: "design-communication",
    name: "Design Communication",
    description: "Design team communications",
    category: "Design",
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    description: "Manufacturing operations",
    category: "Production",
  },
  {
    id: "production-communication",
    name: "Production Communication",
    description: "Production team communications",
    category: "Production",
  },
  {
    id: "catalog",
    name: "Catalog",
    description: "Product catalog and offerings",
    category: "Products",
  },
  {
    id: "messages",
    name: "Messages",
    description: "Communication and messaging",
    category: "Communication",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Business analytics and metrics",
    category: "Reports",
  },
  {
    id: "reports",
    name: "Reports",
    description: "Business reports and insights",
    category: "Reports",
  },
  {
    id: "profile",
    name: "Profile",
    description: "User profile settings",
    category: "User",
  },
  {
    id: "settings",
    name: "Settings",
    description: "System settings",
    category: "System",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Corporate information and resources",
    category: "Administration",
  },
  {
    id: "organizations",
    name: "Organizations",
    description: "Organization management",
    category: "Administration",
  },
  // Admin pages
  {
    id: "user-management",
    name: "User Management",
    description: "Manage system users and permissions",
    category: "Administration",
  },
  {
    id: "admin/sales-team",
    name: "Sales Team",
    description: "Sales team management (Admin)",
    category: "Administration",
  },
  {
    id: "admin/design-team",
    name: "Design Team",
    description: "Design team management (Admin)",
    category: "Administration",
  },
  {
    id: "admin/manufacturing-team",
    name: "Manufacturing Team",
    description: "Manufacturing team management (Admin)",
    category: "Administration",
  },
  {
    id: "admin/product-management",
    name: "Product Management",
    description: "Product catalog management (Admin)",
    category: "Administration",
  },
];

export const AVAILABLE_PAGES_LIST = AVAILABLE_PAGES;

// Define preset templates for different roles
export const PAGE_ACCESS_TEMPLATES = {
  ADMIN: AVAILABLE_PAGES.map(page => page.id),
  MANAGER: [
    "dashboard", "messages", "profile", "settings",
    "leads", "orders", "design", "manufacturing",
    "catalog", "analytics", "reports", "user-management",
    "design-communication", "production-communication"
  ],
  SALES: [
    "dashboard", "messages", "profile", 
    "leads", "orders", "catalog", "analytics",
  ],
  DESIGNER: [
    "dashboard", "messages", "profile",
    "design", "design-communication", "catalog", 
    "orders"
  ],
  MANUFACTURER: [
    "dashboard", "messages", "profile",
    "manufacturing", "production-communication", 
    "catalog", "orders"
  ],
  CUSTOMER: [
    "dashboard", "messages", "profile", 
    "orders", "catalog"
  ],
  MINIMAL: [
    "dashboard", "messages", "profile"
  ]
};

// Returns default visible pages based on the user's role
export function getDefaultVisiblePages(role: string): string[] {
  // Default pages for everyone
  const defaultPages = ["dashboard", "messages", "profile"];

  // Role-specific pages
  switch (role) {
    case ROLES.ADMIN:
      return PAGE_ACCESS_TEMPLATES.ADMIN;
    case ROLES.MANAGER:
      return PAGE_ACCESS_TEMPLATES.MANAGER;
    case ROLES.AGENT:
      return PAGE_ACCESS_TEMPLATES.SALES;
    case ROLES.DESIGNER:
      return PAGE_ACCESS_TEMPLATES.DESIGNER;
    case ROLES.MANUFACTURER:
      return PAGE_ACCESS_TEMPLATES.MANUFACTURER;
    case ROLES.VIEWER:
      return PAGE_ACCESS_TEMPLATES.CUSTOMER;
    default:
      return defaultPages;
  }
}

// Interface for the page visibility settings component
interface PageVisibilitySettingsProps {
  visiblePages: string[];
  onChange: (pages: string[]) => void;
}

// PageVisibilitySettings component
export function PageVisibilitySettings({
  visiblePages,
  onChange,
}: PageVisibilitySettingsProps) {
  const handleTogglePage = (pageId: string) => {
    if (visiblePages.includes(pageId)) {
      onChange(visiblePages.filter(id => id !== pageId));
    } else {
      onChange([...visiblePages, pageId]);
    }
  };

  const handleApplyTemplate = (templateKey: keyof typeof PAGE_ACCESS_TEMPLATES) => {
    onChange([...PAGE_ACCESS_TEMPLATES[templateKey]]);
  };

  // Group pages by category
  const pagesByCategory = AVAILABLE_PAGES.reduce((acc, page) => {
    const category = page.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(page);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PAGES>);

  // Order categories for display
  const categoryOrder = [
    'Core', 'Sales', 'Design', 'Production', 'Products', 
    'Communication', 'Reports', 'User', 'System', 'Administration', 'Other'
  ];

  const sortedCategories = Object.keys(pagesByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Visibility</CardTitle>
        <CardDescription>
          Control which pages are visible to this user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
          <Label className="text-sm">Quick Apply Template:</Label>
          <div className="flex flex-wrap gap-2">
            <button 
              type="button"
              onClick={() => handleApplyTemplate('ADMIN')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Admin (All Pages)
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('MANAGER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Manager
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('SALES')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Sales
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('DESIGNER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Designer
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('MANUFACTURER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Manufacturer
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('CUSTOMER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Customer
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('MINIMAL')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Minimal
            </button>
          </div>
        </div>
        
        {sortedCategories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold mb-2">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pagesByCategory[category].map((page) => (
                <div
                  key={page.id}
                  className="flex items-start space-x-3 space-y-0"
                >
                  <Checkbox
                    id={`page-${page.id}`}
                    checked={visiblePages.includes(page.id)}
                    onCheckedChange={() => handleTogglePage(page.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`page-${page.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {page.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {page.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}