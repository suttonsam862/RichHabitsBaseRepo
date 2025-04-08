import { ROLES } from "@shared/schema";

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