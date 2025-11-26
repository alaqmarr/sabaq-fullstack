'use server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { queueEmail, processEmailQueue } from './email-queue';

export async function lookupUserByITS(itsNumber: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const role = session.user.role;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'];
    
    if (!allowedRoles.includes(role as string)) {
       return { success: false, error: 'Insufficient permissions' };
    }

    const user = await prisma.user.findUnique({
      where: { itsNumber },
      select: {
        id: true,
        name: true,
        itsNumber: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to lookup user' };
  }
}

export async function getUsers() {
    try {
        await requirePermission('users', 'read');
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, users };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createUser(data: any) {
    try {
        await requirePermission('users', 'create');
        
        const existingUser = await prisma.user.findUnique({
            where: { itsNumber: data.itsNumber },
        });

        if (existingUser) {
            return { success: false, error: 'User with this ITS number already exists' };
        }

        const hashedPassword = await hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                id: data.itsNumber,
                ...data,
                password: hashedPassword,
            },
        });

        return { success: true, user };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUser(id: string, data: any) {
    try {
        await requirePermission('users', 'update');

        // Fetch current user to check for role change
        const currentUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true, email: true, name: true },
        });

        if (data.password) {
            data.password = await hash(data.password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
        });

        // Check if role changed
        if (currentUser && data.role && data.role !== currentUser.role) {
            if (currentUser.email) {
                await queueEmail(
                    currentUser.email,
                    'Role Updated',
                    'role-updated',
                    {
                        userName: currentUser.name,
                        newRole: data.role,
                    }
                );
                // Trigger processing immediately
                void processEmailQueue();
            }
        }

        return { success: true, user };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function bulkCreateUsers(users: any[]) {
    try {
        await requirePermission('users', 'create');
        
        let createdCount = 0;
        let errors: string[] = [];

        for (const userData of users) {
            try {
                const existingUser = await prisma.user.findUnique({
                    where: { itsNumber: userData.itsNumber },
                });

                if (existingUser) {
                    errors.push(`User with ITS ${userData.itsNumber} already exists`);
                    continue;
                }

                const hashedPassword = await hash(userData.password || userData.itsNumber, 10);

                await prisma.user.create({
                    data: {
                        id: userData.itsNumber,
                        name: userData.name,
                        itsNumber: userData.itsNumber,
                        email: userData.email,
                        role: userData.role || 'MUMIN',
                        password: hashedPassword,
                    },
                });
                createdCount++;
            } catch (error: any) {
                errors.push(`Failed to create user ${userData.name}: ${error.message}`);
            }
        }

        return { 
            success: true, 
            count: createdCount, 
            skipped: errors.length,
            message: `Created ${createdCount} users, skipped ${errors.length}`,
            errors 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
