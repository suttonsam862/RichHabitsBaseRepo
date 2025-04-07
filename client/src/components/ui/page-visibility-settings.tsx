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
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Main dashboard with overview and stats",
  },
  {
    id: "leads",
    name: "Leads",
    description: "Lead management and tracking",
  },
  {
    id: "orders",
    name: "Orders",
    description: "Order management and processing",
  },
  {
    id: "designs",
    name: "Designs",
    description: "Design creation and approval",
  },
  {
    id: "production",
    name: "Production",
    description: "Manufacturing management",
  },
  {
    id: "catalog",
    name: "Catalog",
    description: "Product catalog and offerings",
  },
  {
    id: "messages",
    name: "Messages",
    description: "Communication and messaging",
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Schedule and events",
  },
  {
    id: "reports",
    name: "Reports",
    description: "Analytics and reporting",
  },
  {
    id: "users",
    name: "Users",
    description: "User management",
  },
  {
    id: "admin/sales-team",
    name: "Sales Team",
    description: "Sales team management (Admin)",
  },
  {
    id: "admin/design-team",
    name: "Design Team",
    description: "Design team management (Admin)",
  },
  {
    id: "admin/manufacturing-team",
    name: "Manufacturing Team",
    description: "Manufacturing team management (Admin)",
  },
  {
    id: "admin/product-management",
    name: "Product Management",
    description: "Product catalog management (Admin)",
  },
];

export const AVAILABLE_PAGES_LIST = AVAILABLE_PAGES;

// Returns default visible pages based on the user's role
export function getDefaultVisiblePages(role: string): string[] {
  // Default pages for everyone
  const defaultPages = ["dashboard", "messages"];

  // Role-specific pages
  switch (role) {
    case ROLES.ADMIN:
      // Admins can see everything
      return AVAILABLE_PAGES.map(page => page.id);
    case ROLES.MANAGER:
      return [
        ...defaultPages,
        "leads",
        "orders",
        "designs",
        "production",
        "catalog",
        "calendar",
        "reports",
        "users",
      ];
    case ROLES.AGENT:
      return [
        ...defaultPages,
        "leads",
        "orders",
        "catalog",
        "calendar",
      ];
    case ROLES.DESIGNER:
      return [
        ...defaultPages,
        "designs",
        "catalog",
        "orders",
        "calendar",
      ];
    case ROLES.MANUFACTURER:
      return [
        ...defaultPages,
        "production",
        "catalog",
        "orders",
        "calendar",
      ];
    case ROLES.VIEWER:
      return [
        ...defaultPages,
        "catalog",
      ];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Visibility</CardTitle>
        <CardDescription>
          Control which pages are visible to this user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_PAGES.map((page) => (
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
      </CardContent>
    </Card>
  );
}