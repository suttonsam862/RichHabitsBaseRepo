import { ROLES, PERMISSIONS, type Role, type Permission } from './schema';

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admins have all permissions
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.VIEW_LEADS,
    
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    
    PERMISSIONS.VIEW_CATALOG,
    PERMISSIONS.MANAGE_CATALOG,
    
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_MESSAGES,
    
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.AGENT]: [
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.VIEW_LEADS,
    
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    
    PERMISSIONS.VIEW_CATALOG,
    
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_MESSAGES,
  ],
  [ROLES.DESIGNER]: [
    PERMISSIONS.CREATE_DESIGNS,
    PERMISSIONS.EDIT_DESIGNS,
    PERMISSIONS.VIEW_DESIGNS,
    
    PERMISSIONS.VIEW_CATALOG,
    
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_MESSAGES,
  ],
  [ROLES.MANUFACTURER]: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.EDIT_PRODUCTION,
    PERMISSIONS.VIEW_PRODUCTION,
    PERMISSIONS.COMPLETE_PRODUCTION,
    
    PERMISSIONS.VIEW_DESIGNS,
    
    PERMISSIONS.VIEW_CATALOG,
    
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_MESSAGES,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.VIEW_CATALOG,
  ],
};

// Get permissions for a role
export function getPermissionsForRole(role: Role): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

// Check if a user has a specific permission
export function hasPermission(
  userRole: Role, 
  userPermissions: Permission[] | null | undefined, 
  requiredPermission: Permission
): boolean {
  // Admins always have all permissions
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  // For other roles, check specific permissions
  if (userPermissions) {
    return userPermissions.includes(requiredPermission);
  }

  // If no custom permissions, use the default role permissions
  return DEFAULT_ROLE_PERMISSIONS[userRole]?.includes(requiredPermission) || false;
}

// Get a list of permissions a user has
export function getUserPermissions(userRole: Role, customPermissions?: Permission[] | null): Permission[] {
  // If user has custom permissions, use those
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions;
  }
  
  // Otherwise use the default permissions for their role
  return DEFAULT_ROLE_PERMISSIONS[userRole] || [];
}

// Get user role display name
export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case ROLES.ADMIN:
      return "Administrator";
    case ROLES.MANAGER:
      return "Manager";
    case ROLES.AGENT:
      return "Sales Agent";
    case ROLES.DESIGNER:
      return "Designer";
    case ROLES.MANUFACTURER:
      return "Manufacturer";
    case ROLES.VIEWER:
      return "Viewer";
    default:
      return role;
  }
}

// Get permission display name
export function getPermissionDisplayName(permission: Permission): string {
  return permission
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Group permissions by category for UI display
export function getPermissionGroups(): { category: string; permissions: Permission[] }[] {
  return [
    {
      category: 'User Management',
      permissions: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.VIEW_USERS,
      ],
    },
    {
      category: 'Lead Management',
      permissions: [
        PERMISSIONS.CREATE_LEADS,
        PERMISSIONS.EDIT_LEADS,
        PERMISSIONS.DELETE_LEADS,
        PERMISSIONS.VIEW_LEADS,
      ],
    },
    {
      category: 'Order Management',
      permissions: [
        PERMISSIONS.CREATE_ORDERS,
        PERMISSIONS.EDIT_ORDERS,
        PERMISSIONS.DELETE_ORDERS,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.APPROVE_ORDERS,
      ],
    },
    {
      category: 'Design Management',
      permissions: [
        PERMISSIONS.CREATE_DESIGNS,
        PERMISSIONS.EDIT_DESIGNS,
        PERMISSIONS.DELETE_DESIGNS,
        PERMISSIONS.VIEW_DESIGNS,
        PERMISSIONS.APPROVE_DESIGNS,
      ],
    },
    {
      category: 'Production Management',
      permissions: [
        PERMISSIONS.CREATE_PRODUCTION,
        PERMISSIONS.EDIT_PRODUCTION,
        PERMISSIONS.DELETE_PRODUCTION,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.COMPLETE_PRODUCTION,
      ],
    },
    {
      category: 'Catalog Management',
      permissions: [
        PERMISSIONS.VIEW_CATALOG,
        PERMISSIONS.EDIT_CATALOG,
        PERMISSIONS.MANAGE_CATALOG,
      ],
    },
    {
      category: 'Communications',
      permissions: [
        PERMISSIONS.SEND_MESSAGES,
        PERMISSIONS.VIEW_MESSAGES,
      ],
    },
    {
      category: 'Reports & Analytics',
      permissions: [
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_ANALYTICS,
      ],
    },
  ];
}