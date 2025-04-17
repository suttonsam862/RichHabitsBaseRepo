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
    id: "outlook",
    name: "Outlook",
    description: "Outlook email integration",
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
  {
    id: "feedback",
    name: "Feedback",
    description: "User feedback and feature requests",
    category: "System",
  },
  // Events/Camps pages
  {
    id: "events/overview",
    name: "Camps Dashboard",
    description: "Master dashboard for all camps and events",
    category: "Events",
  },
  {
    id: "events/admin-dashboard",
    name: "Global Admin Dashboard",
    description: "Admin view for all camps with comprehensive metrics",
    category: "Events",
  },
  {
    id: "events/planning",
    name: "Camp Planning",
    description: "Camp creation and planning tools",
    category: "Events",
  },
  {
    id: "events/agenda",
    name: "Agenda Builder",
    description: "Drag-and-drop daily agenda builder for camp schedules",
    category: "Events",
  },
  {
    id: "events/staff",
    name: "Staff Management",
    description: "Manage camp staff roles and assignments",
    category: "Events",
  },
  {
    id: "events/clinicians",
    name: "Clinician Module",
    description: "Manage clinicians and assign to agenda blocks",
    category: "Events",
  },
  {
    id: "events/venue",
    name: "Venue Module",
    description: "Manage venues and assign spaces per activity",
    category: "Events",
  },
  {
    id: "events/travel",
    name: "Travel & Accommodations",
    description: "Manage travel arrangements and accommodations",
    category: "Events",
  },
  {
    id: "events/financial",
    name: "Financial Management",
    description: "Manage camp budgets and financial data",
    category: "Events",
  },
  {
    id: "events/vendors",
    name: "Vendors & Services",
    description: "Manage service providers and vendors for camps",
    category: "Events",
  },
  {
    id: "events/calendar",
    name: "Calendar",
    description: "Calendar view of all camp events",
    category: "Events",
  },
  {
    id: "events/team-portal",
    name: "Team Portal",
    description: "Role-based access for event directors, managers, and staff",
    category: "Events",
  },
  {
    id: "events/checkin-tools",
    name: "Check-In Tools",
    description: "Tablet-friendly interface for QR code scanning and gear distribution",
    category: "Events",
  },
  {
    id: "events/registration",
    name: "Registration System",
    description: "Customizable registration tiers with Shopify integration",
    category: "Events",
  },
  {
    id: "events/budget-tracker",
    name: "Budget Tracker",
    description: "Financial management with revenue and expense tracking",
    category: "Events",
  },
  {
    id: "events/swag-manager",
    name: "Swag Pack Manager",
    description: "Track merchandise distribution, sizing, and packing slips",
    category: "Events",
  },
  {
    id: "events/media-panel",
    name: "Marketing & Media Panel",
    description: "Manage social media campaigns and sponsor assets",
    category: "Events",
  },
  {
    id: "events/venue-planner",
    name: "Venue Planner",
    description: "Visual map layout tool for organizing event spaces",
    category: "Events",
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
  {
    id: "admin/product-creation",
    name: "Product Creation",
    description: "Manage product photos and measurements (Admin)",
    category: "Administration",
  },
  {
    id: "sales-process",
    name: "Sales Process Guide",
    description: "Learn about the complete sales workflow",
    category: "Core",
  },
];

export const AVAILABLE_PAGES_LIST = AVAILABLE_PAGES;

// Define preset templates for different roles
export const PAGE_ACCESS_TEMPLATES = {
  ADMIN: AVAILABLE_PAGES.map(page => page.id),
  MANAGER: [
    "dashboard", "messages", "profile", "settings",
    "leads", "orders", "design", "manufacturing",
    "catalog", "analytics", "reports", "user-management", "outlook",
    "design-communication", "production-communication", "feedback",
    "admin/product-management", "admin/product-creation", "sales-process"
  ],
  SALES: [
    "dashboard", "messages", "profile", 
    "leads", "orders", "catalog", "analytics", "outlook",
    "feedback", "sales-process"
  ],
  DESIGNER: [
    "dashboard", "messages", "profile",
    "design", "design-communication", "catalog", "outlook",
    "orders", "feedback", "sales-process"
  ],
  MANUFACTURER: [
    "dashboard", "messages", "profile",
    "manufacturing", "production-communication", "outlook",
    "catalog", "orders", "feedback", "sales-process"
  ],
  CUSTOMER: [
    "dashboard", "messages", "profile", 
    "orders", "catalog", "outlook", "feedback", "sales-process"
  ],
  MINIMAL: [
    "dashboard", "messages", "profile", "outlook", "feedback"
  ]
};

// Returns default visible pages based on the user's role
export function getDefaultVisiblePages(role: string): string[] {
  // Default pages for everyone
  const defaultPages = ["dashboard", "messages", "profile", "outlook"];

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