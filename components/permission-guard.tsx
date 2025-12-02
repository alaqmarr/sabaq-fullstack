"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { ReactNode } from "react";
import permissionsConfig from "@/config/permissions.json";

type Resource = keyof typeof permissionsConfig.roles.SUPERADMIN;

interface PermissionGuardProps {
    resource: Resource;
    action: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function PermissionGuard({
    resource,
    action,
    children,
    fallback = null,
}: PermissionGuardProps) {
    const { hasPermission, isLoading } = usePermissions();

    if (isLoading) {
        // Optionally render nothing or a skeleton while loading
        // For now, we render nothing to avoid flashing unauthorized content
        return null;
    }

    if (!hasPermission(resource, action)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
