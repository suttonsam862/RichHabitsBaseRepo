import { AuthUser } from "@/types";

// This helper function maps roles to default visible pages
export function getDefaultVisiblePages(role: string): string[] {
  switch (role) {
    case 'admin':
      return [
        "dashboard",
        "profile",
        "leads",
        "orders",
        "design",
        "manufacturing",
        "settings",
        "catalog",
        "organizations",
        "analytics",
        "reports",
        "corporate",
        "user-management",
        "design-communication",
        "production-communication",
        "feedback",
        "outlook"
      ];
    case 'agent':
      return [
        "dashboard",
        "leads",
        "orders",
        "orders/create",
        "orders/history",
        "size-requests",
        "notifications",
        "profile",
        "catalog",
        "sales-process-guide"
      ];
    case 'designer':
      return [
        "dashboard",
        "unclaimed-designs",
        "design-jobs",
        "design-job",
        "design-submission",
        "revisions",
        "customer-input",
        "notifications",
        "profile",
        "design-process-guide"
      ];
    default:
      return ["dashboard", "profile"];
  }
}

export function hasPermission(user: AuthUser, pageId: string): boolean {
  // If user has explicit visible pages, use those
  if (user.visiblePages && Array.isArray(user.visiblePages)) {
    return user.visiblePages.includes(pageId);
  }
  
  // Otherwise, use default pages for the role
  const defaultPages = getDefaultVisiblePages(user.role);
  return defaultPages.includes(pageId);
}