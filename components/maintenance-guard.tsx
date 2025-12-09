"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Role } from '@/app/prisma/client';

interface MaintenanceGuardProps {
    config: any;
    userRole?: Role;
    children: React.ReactNode;
}

export function MaintenanceGuard({ config, userRole, children }: MaintenanceGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAllowed, setIsAllowed] = useState(true);

    useEffect(() => {
        if (!config) return;

        // Always allow access to system status page
        if (pathname === "/system-status") {
            setIsAllowed(true);
            return;
        }

        // Check Maintenance Mode
        if (config.isUnderMaintenance && userRole !== "SUPERADMIN") {
            setIsAllowed(false);
            router.push("/system-status");
            return;
        }

        // Check Admin Portal Access
        if (!config.isAdminUp && pathname.startsWith("/dashboard") && userRole !== "SUPERADMIN") {
            setIsAllowed(false);
            router.push("/system-status");
            return;
        }

        setIsAllowed(true);
    }, [pathname, config, userRole, router]);

    if (!isAllowed) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}
