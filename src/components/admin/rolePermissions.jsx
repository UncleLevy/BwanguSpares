/**
 * Role-based Access Control (RBAC) Configuration
 * Defines what panels/features each staff role can access
 */

export const ROLE_PERMISSIONS = {
  admin: {
    label: "Super Admin",
    color: "bg-purple-600",
    departments: ["all"], // Full access
  },
  staff_finance: {
    label: "Finance Staff",
    color: "bg-emerald-600",
    departments: ["finance", "analytics"],
    views: ["payouts", "returns", "analytics", "overview"],
  },
  staff_shipping: {
    label: "Shipping Staff",
    color: "bg-blue-600",
    departments: ["shipping"],
    views: ["shipping", "orders", "overview"],
  },
  staff_support: {
    label: "Support Staff",
    color: "bg-amber-600",
    departments: ["support"],
    views: ["support", "returns", "reports", "overview"],
  },
  staff_shop_management: {
    label: "Shop Management Staff",
    color: "bg-indigo-600",
    departments: ["shop_management"],
    views: ["shops", "products", "regions", "cities", "vehicles", "overview"],
  },
};

/**
 * Check if a user has permission to access a specific view
 */
export const hasViewAccess = (userRole, viewId, customPermissions = []) => {
  // Admin has full access
  if (userRole === "admin") return true;

  // Check role-based permissions
  const roleConfig = ROLE_PERMISSIONS[userRole];
  if (!roleConfig) return false;

  // Check if view is in allowed views for this role
  if (roleConfig.views?.includes(viewId)) return true;

  // Check custom department permissions
  if (customPermissions.length > 0) {
    const viewDeptMap = {
      payouts: "finance",
      returns: "support",
      shipping: "shipping",
      support: "support",
      shops: "shop_management",
      products: "shop_management",
      analytics: "analytics",
      users: "users",
      loyalty: "loyalty",
    };
    const dept = viewDeptMap[viewId];
    if (dept && customPermissions.includes(dept)) return true;
  }

  return false;
};

/**
 * Get accessible views for a user
 */
export const getAccessibleViews = (userRole, customPermissions = []) => {
  if (userRole === "admin") {
    return [
      "overview",
      "analytics",
      "payouts",
      "returns",
      "reports",
      "support",
      "shipping",
      "shops",
      "products",
      "regions",
      "cities",
      "vehicles",
      "users",
      "loyalty",
      "audit",
    ];
  }

  const roleConfig = ROLE_PERMISSIONS[userRole];
  if (!roleConfig) return ["overview"];

  return roleConfig.views || [];
};