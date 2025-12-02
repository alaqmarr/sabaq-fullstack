"use client";

import { PermissionGuard } from "@/components/permission-guard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";
import permissionsConfig from "@/config/permissions.json";
import { usePermissions } from "@/hooks/use-permissions";

type Resource = keyof typeof permissionsConfig.roles.SUPERADMIN;

export interface PageAction {
    label: string;
    mobileLabel?: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    href?: string;
    permission?: { resource: Resource; action: string };
    variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "frosted-green";
}

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: PageAction[];
    children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
    const { isLoading } = usePermissions();

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 lowercase">
                        {title}
                    </h1>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${isLoading
                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 animate-pulse"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-yellow-500" : "bg-emerald-500 animate-pulse"
                            }`} />
                        Permission Guard: {isLoading ? "Initializing" : "Active"}
                    </div>
                </div>
                {description && <p className="text-cred-label mt-2 lowercase">{description}</p>}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                {children}
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions.map((action, index) => (
                            <HeaderActionButton key={index} action={action} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function HeaderActionButton({ action }: { action: PageAction }) {
    const Icon = action.icon;

    const ButtonContent = (
        <>
            {Icon && <Icon className="h-4 w-4 sm:mr-2" />}
            <span className={action.mobileLabel ? "hidden sm:inline" : ""}>{action.label}</span>
            {action.mobileLabel && <span className="inline sm:hidden">{action.mobileLabel}</span>}
        </>
    );

    const ButtonElement = (
        <Button
            variant={action.variant || "default"}
            size="sm"
            className="gap-2 h-9 sm:h-10"
            onClick={action.onClick}
        >
            {ButtonContent}
        </Button>
    );

    const content = action.href ? (
        <Link href={action.href}>
            <Button
                variant={action.variant || "default"}
                size="sm"
                className="gap-2 h-9 sm:h-10"
            >
                {ButtonContent}
            </Button>
        </Link>
    ) : (
        ButtonElement
    );

    if (action.permission) {
        return (
            <PermissionGuard
                resource={action.permission.resource}
                action={action.permission.action}
            >
                {content}
            </PermissionGuard>
        );
    }

    return content;
}
