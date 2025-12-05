import { auth } from "@/auth";

export const preferredRegion = ["sin1"];
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/rbac";
import { isRedirectError } from "@/lib/utils";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    try {
        await requirePermission("settings", "manage");
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect("/unauthorized");
    }

    return <SettingsClient />;
}
