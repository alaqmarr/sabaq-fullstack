"use client";

import { useSession } from "next-auth/react";
import permissionsConfig from "@/config/permissions.json";

type Role = keyof typeof permissionsConfig.roles;
type Resource = keyof typeof permissionsConfig.roles.SUPERADMIN;

export function usePermissions() {
  const { data: session, status } = useSession();
  const role = session?.user?.role as Role | undefined;

  const hasPermission = (resource: Resource, action: string): boolean => {
    if (!role) return false;

    const rolePermissions = permissionsConfig.roles[role];
    if (!rolePermissions) return false;

    const resourcePermissions =
      rolePermissions[resource as keyof typeof rolePermissions];
    if (!resourcePermissions) return false;

    return (resourcePermissions as string[]).includes(action);
  };

  return { hasPermission, role, isLoading: status === "loading" };
}
