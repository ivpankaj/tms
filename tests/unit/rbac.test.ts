import { hasPermission, ROLE_PERMISSIONS, RoleName } from "@/lib/auth/roles";

describe("Role-Based Access Control (RBAC)", () => {
  it("Super Admin should have unconditional wildcard access", () => {
    expect(hasPermission("Super Admin", "settings:manage")).toBe(true);
    expect(hasPermission("Super Admin", "users:delete")).toBe(true);
    expect(hasPermission("Super Admin", "deals:delete")).toBe(true);
    expect(hasPermission("Super Admin", "any:arbitrary:action")).toBe(true);
  });

  it("Admin should have operational permissions but not system root", () => {
    expect(hasPermission("Admin", "contacts:read")).toBe(true);
    expect(hasPermission("Admin", "contacts:write")).toBe(true);
    expect(hasPermission("Admin", "contacts:delete")).toBe(true);
    expect(hasPermission("Admin", "settings:manage")).toBe(true);
    expect(hasPermission("Admin", "campaigns:write")).toBe(true);
  });

  it("Sales Rep should be able to read and write deals and contacts, but cannot delete or manage settings", () => {
    expect(hasPermission("Sales Rep", "deals:read")).toBe(true);
    expect(hasPermission("Sales Rep", "deals:write")).toBe(true);
    expect(hasPermission("Sales Rep", "contacts:write")).toBe(true);
    expect(hasPermission("Sales Rep", "tasks:write")).toBe(true);

    // Forbidden actions
    expect(hasPermission("Sales Rep", "settings:manage")).toBe(false);
    expect(hasPermission("Sales Rep", "org:manage")).toBe(false);
    expect(hasPermission("Sales Rep", "deals:delete")).toBe(false);
  });

  it("Viewer should have read-only access and no write/delete abilities", () => {
    expect(hasPermission("Viewer", "contacts:read")).toBe(true);
    expect(hasPermission("Viewer", "deals:read")).toBe(true);
    expect(hasPermission("Viewer", "reports:read")).toBe(true);

    // Forbidden mutations
    expect(hasPermission("Viewer", "contacts:write")).toBe(false);
    expect(hasPermission("Viewer", "contacts:delete")).toBe(false);
    expect(hasPermission("Viewer", "deals:write")).toBe(false);
    expect(hasPermission("Viewer", "tickets:write")).toBe(false);
    expect(hasPermission("Viewer", "settings:manage")).toBe(false);
  });

  it("should handle unknown roles safely without throwing", () => {
    expect(hasPermission("AnonymousRole", "contacts:read")).toBe(false);
    expect(hasPermission("", "contacts:read")).toBe(false);
  });
});
