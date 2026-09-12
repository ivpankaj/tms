"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { hasPermission as checkRolePermission } from "./roles";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Manager" | "Sales Rep" | "Viewer";
  avatar?: string;
  timezone: string;
  organizationId: string;
}

export interface OrgSession {
  id: string;
  name: string;
  slug: string;
  currency: string;
  billingPlan: string;
  plan?: string;
}

interface AuthContextType {
  user: UserSession | null;
  organization: OrgSession | null;
  organizations: OrgSession[];
  isLoading: boolean;
  isLoaded: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; organizationName: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserSession | null>(null);
  const [organization, setOrganization] = React.useState<OrgSession | null>(null);
  const [organizations, setOrganizations] = React.useState<OrgSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const fetchSession = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data.user);
          setOrganization(json.data.organization);
          setOrganizations(json.data.organizations || [json.data.organization]);
        }
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (email: string, password = "Password123!") => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setOrganization(data.data.organization);
        setOrganizations(data.data.organizations || [data.data.organization]);
        router.push("/");
        return { success: true };
      }
      return { success: false, error: data.error?.message || "Login failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during login" };
    }
  };

  const register = async (data: { name: string; email: string; password: string; organizationName: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        setUser(resData.data.user);
        setOrganization(resData.data.organization);
        setOrganizations([resData.data.organization]);
        router.push("/");
        return { success: true };
      }
      return { success: false, error: resData.error?.message || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during registration" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    setOrganization(null);
    router.push("/login");
  };

  const switchOrganization = async (orgId: string) => {
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrganization(data.data.organization);
        window.location.reload();
      }
    } catch (err) {
      console.error("Error switching organization:", err);
    }
  };

  const hasPerm = (permission: string): boolean => {
    if (!user) return false;
    return checkRolePermission(user.role, permission);
  };

  const authFetch = React.useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
      },
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        organizations,
        isLoading,
        isLoaded: !isLoading,
        login,
        register,
        logout,
        switchOrganization,
        hasPermission: hasPerm,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
