import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSabaqAccess } from "@/lib/rbac";
import { SabaqLinksView } from "@/components/sabaqs/sabaq-links-view";

export const preferredRegion = ["sin1"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sabaq = await prisma.sabaq.findUnique({
        where: { id },
        select: { name: true },
    });

    return {
        title: sabaq ? `${sabaq.name} - Links` : "Sabaq Links",
    };
}

export default async function SabaqLinksPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const { id } = await params;

    // Check if user has access to this sabaq
    try {
        await requireSabaqAccess(id);
    } catch {
        redirect("/unauthorized");
    }

    // Only admins and superadmins can access the links page
    const role = session.user.role;
    if (!["SUPERADMIN", "ADMIN", "MANAGER", "ATTENDANCE_INCHARGE", "JANAB"].includes(role)) {
        redirect("/unauthorized");
    }

    // Fetch sabaq details
    const sabaq = await prisma.sabaq.findUnique({
        where: { id },
        include: {
            location: {
                select: {
                    name: true,
                },
            },
            _count: {
                select: {
                    enrollments: { where: { status: "APPROVED" } },
                },
            },
        },
    });

    if (!sabaq) {
        notFound();
    }

    // Fetch active session if exists
    const activeSession = await prisma.session.findFirst({
        where: { sabaqId: id, isActive: true },
        select: {
            id: true,
            scheduledAt: true,
        },
    });

    // Fetch upcoming session (not started, scheduled in the future)
    const upcomingSession = await prisma.session.findFirst({
        where: {
            sabaqId: id,
            startedAt: null,
            scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        select: {
            id: true,
            scheduledAt: true,
        },
    });

    // Fetch recently ended session (last ended)
    const recentlyEndedSession = await prisma.session.findFirst({
        where: {
            sabaqId: id,
            isActive: false,
            endedAt: { not: null },
        },
        orderBy: { endedAt: "desc" },
        select: {
            id: true,
            scheduledAt: true,
            endedAt: true,
        },
    });

    return (
        <SabaqLinksView
            sabaq={{
                id: sabaq.id,
                name: sabaq.name,
                whatsappGroupLink: sabaq.whatsappGroupLink,
                enrolledCount: sabaq._count.enrollments,
                locationName: sabaq.location?.name,
            }}
            activeSession={activeSession}
            upcomingSession={upcomingSession}
            recentlyEndedSession={recentlyEndedSession}
        />
    );
}

