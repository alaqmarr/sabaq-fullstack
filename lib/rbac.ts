import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import permissionsConfig from '@/config/permissions.json';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Resource = keyof typeof permissionsConfig.roles.SUPERADMIN;
type Action = string;

export async function checkPermission(
  userId: string,
  resource: Resource,
  action: Action
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return false;
  }

  const rolePermissions = permissionsConfig.roles[user.role as Role];
  if (!rolePermissions) {
    return false;
  }

  const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
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
    console.error('Failed to log audit event:', error);
  }
}

export async function requirePermission(resource: Resource, action: Action) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await checkPermission(session.user.id, resource, action);
  if (!hasPermission) {
    await logAuditEvent(session.user.id, 'UNAUTHORIZED_ACCESS_ATTEMPT', resource, { action });
    const reason = `You do not have permission to perform '${action}' on '${resource}'.`;
    redirect(`/unauthorized?reason=${encodeURIComponent(reason)}&flagged=true`);
  }

  return session.user;
}
