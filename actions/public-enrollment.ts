'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function validateITSNumber(itsNumber: string) {
  try {
    if (!itsNumber || itsNumber.length !== 8) {
      return { success: false, error: 'ITS Number must be 8 digits' };
    }

    const user = await prisma.user.findUnique({
      where: { itsNumber },
      select: {
        id: true,
        itsNumber: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return { 
        success: false, 
        error: 'ITS Number not found in our system',
        notFound: true 
      };
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Failed to validate ITS Number' };
  }
}

export async function getAvailableSabaqs() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const now = new Date();
    
    const sabaqs = await prisma.sabaq.findMany({
      where: {
        isActive: true,
        enrollmentStartsAt: { lte: now },
        enrollmentEndsAt: { gte: now },
      },
      include: {
        location: true,
        enrollments: userId ? {
          where: { userId },
          select: { status: true, id: true },
        } : false,
        _count: {
          select: {
            enrollments: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Serialize Decimal fields and include enrollment status
    const serializedSabaqs = sabaqs.map(sabaq => ({
      ...sabaq,
      location: sabaq.location ? {
        ...sabaq.location,
        latitude: Number(sabaq.location.latitude),
        longitude: Number(sabaq.location.longitude),
        radiusMeters: Number(sabaq.location.radiusMeters),
      } : null,
      enrollmentStatus: userId && sabaq.enrollments?.[0]?.status || null,
    }));

    return { success: true, sabaqs: serializedSabaqs };
  } catch (error) {
    return { success: false, error: 'Failed to fetch sabaqs' };
  }
}
