export type RoleName =
  | "Super Admin"
  | "Admin"
  | "Manager"
  | "Sales Rep"
  | "Viewer";

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  "Super Admin": ["*"],
  Admin: [
    "org:manage",
    "users:manage",
    "settings:manage",
    "projects:read",
    "projects:write",
    "projects:delete",
    "teams:read",
    "teams:write",
    "teams:delete",
    "tasks:read",
    "tasks:write",
    "tasks:delete",
    "comments:read",
    "comments:write",
    "comments:delete",
    "contacts:read",
    "contacts:write",
    "contacts:delete",
    "deals:read",
    "deals:write",
    "deals:delete",
    "leads:read",
    "leads:write",
    "leads:delete",
    "tickets:read",
    "tickets:write",
    "tickets:delete",
    "campaigns:read",
    "campaigns:write",
    "campaigns:delete",
    "reports:read",
    "reports:write",
    "automation:read",
    "automation:write",
  ],
  Manager: [
    "projects:read",
    "projects:write",
    "teams:read",
    "teams:write",
    "tasks:read",
    "tasks:write",
    "comments:read",
    "comments:write",
    "contacts:read",
    "contacts:write",
    "deals:read",
    "deals:write",
    "leads:read",
    "leads:write",
    "tickets:read",
    "tickets:write",
    "campaigns:read",
    "campaigns:write",
    "reports:read",
    "automation:read",
  ],
  "Sales Rep": [
    "projects:read",
    "projects:write",
    "teams:read",
    "tasks:read",
    "tasks:write",
    "comments:read",
    "comments:write",
    "contacts:read",
    "contacts:write",
    "deals:read",
    "deals:write",
    "leads:read",
    "leads:write",
    "tickets:read",
    "tickets:write",
    "reports:read",
  ],
  Viewer: [
    "projects:read",
    "teams:read",
    "tasks:read",
    "comments:read",
    "contacts:read",
    "deals:read",
    "leads:read",
    "tickets:read",
    "reports:read",
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role as RoleName] || [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  
  const [resource] = permission.split(":");
  if (permissions.includes(`${resource}:*`)) return true;
  
  return false;
}
