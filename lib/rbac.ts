import { auth } from "@/auth";
import { redirect } from "next/navigation";
import permissionsConfig from "@/config/permissions.json";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/prisma/client";
import { getErrorCode, ERROR_CODES } from "@/lib/error-codes";

type Resource = keyof typeof permissionsConfig.roles.SUPERADMIN;
type Action = string;

import { cache } from "@/lib/cache";

export async function checkPermission(
  userId: string,
  resource: Resource,
  action: Action
): Promise<boolean> {
  const cacheKey = `rbac:user:${userId}`;
  let user = await cache.get<{ role: string; isActive: boolean }>(cacheKey);

  if (!user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });

    if (dbUser) {
      user = { role: dbUser.role, isActive: dbUser.isActive };
      await cache.set(cacheKey, user, 300); // Cache for 5 minutes
    }
  }

  if (!user || !user.isActive) {
    return false;
  }

  const rolePermissions = permissionsConfig.roles[user.role as Role];
  if (!rolePermissions) {
    return false;
  }

  const resourcePermissions =
    rolePermissions[resource as keyof typeof rolePermissions];
  if (!resourcePermissions) {
    return false;
  }

  return (resourcePermissions as string[]).includes(action);
}

export async function logAuditEvent(
  userId: string,
  action: string,
  resource: string,
  details?: any
) {
  try {
    await prisma.securityLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

export async function requirePermission(resource: Resource, action: Action) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const hasPermission = await checkPermission(
    session.user.id,
    resource,
    action
  );
  if (!hasPermission) {
    await logAuditEvent(
      session.user.id,
      "UNAUTHORIZED_ACCESS_ATTEMPT",
      resource,
      { action }
    );
    const errorInfo = getErrorCode(resource, action);
    const reason = errorInfo.message;
    redirect(
      `/unauthorized?reason=${encodeURIComponent(reason)}&code=${
        errorInfo.code
      }&flagged=true`
    );
  }

  return session.user;
}

export async function requireSabaqAccess(sabaqId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      managedSabaqs: { select: { id: true } },
      assignedSabaqs: { select: { sabaqId: true } },
    },
  });

  if (!user) redirect("/login");

  // SUPERADMIN and ADMIN have global access
  if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
    return session.user;
  }

  // Check specific assignments
  const isJanabForSabaq = user.managedSabaqs.some((s) => s.id === sabaqId);
  const isAssignedToSabaq = user.assignedSabaqs.some(
    (s) => s.sabaqId === sabaqId
  );

  if (isJanabForSabaq || isAssignedToSabaq) {
    return session.user;
  }

  // Log and Redirect
  await logAuditEvent(user.id, "UNAUTHORIZED_SABAQ_ACCESS", "sabaq", {
    sabaqId,
  });
  const errorInfo = ERROR_CODES.SABAQS_ACCESS_DENIED;
  redirect(
    `/unauthorized?reason=${encodeURIComponent(errorInfo.message)}&code=${
      errorInfo.code
    }&flagged=true`
  );
}

export async function requireSessionAccess(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { sabaqId: true },
  });

  if (!session) {
    // If session doesn't exist, we can't check access, but we should probably 404 or let the caller handle it.
    // For security, if we can't verify, we deny.
    // But usually this is called inside a page where we expect session to exist.
    // Let's return true here and let the page handle 404, OR throw not found.
    // Better to throw not found or let the page handle it.
    // But to check access we NEED sabaqId.
    return; // Caller will handle 404
  }

  await requireSabaqAccess(session.sabaqId);
}
