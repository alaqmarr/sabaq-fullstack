"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Upload, UserPlus } from "lucide-react";
import Link from "next/link";
import { PermissionGuard } from "@/components/permission-guard";

interface UserHeaderProps {
    children?: React.ReactNode;
}

export function UserHeader({ children }: UserHeaderProps) {
    return (
        <PageHeader
            title="Users"
            description="Manage system users and roles"
            actions={[
                {
                    label: "Bulk Import",
                    mobileLabel: "Import",
                    icon: Upload,
                    href: "/dashboard/users/bulk",
                    variant: "outline",
                    permission: { resource: "users", action: "create" },
                },
                {
                    label: "Add User",
                    mobileLabel: "Add",
                    icon: UserPlus,
                    href: "/dashboard/users?action=new",
                    permission: { resource: "users", action: "create" },
                },
            ]}
        >
            {children}
        </PageHeader>
    );
}
