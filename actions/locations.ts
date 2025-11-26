'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/rbac';
import { LocationSchema } from '@/schemas';

export async function createLocation(data: any) {
  try {
    const currentUser = await requirePermission('locations', 'create');

    const validatedData = LocationSchema.parse(data);

    // Check if a location with the same coordinates already exists
    const existingLocation = await prisma.location.findFirst({
      where: {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        isActive: true,
      },
      select: {
        name: true,
      },
    });

    if (existingLocation) {
      return { 
        success: false, 
        error: `A location with these coordinates already exists: "${existingLocation.name}". Please use different coordinates.` 
      };
    }

    const location = await prisma.location.create({
      data: {
        ...validatedData,
        id: validatedData.name.toLowerCase().replace(/\s+/g, '-'),
        createdBy: currentUser.id,
      },
    });
    revalidatePath('/dashboard/locations');
    return { success: true, location };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || 'Failed to create location' };
  }
}

export async function updateLocation(id: string, data: any) {
  try {
    await requirePermission('locations', 'update');

    const validatedData = LocationSchema.partial().parse(data);

    const location = await prisma.location.update({
      where: { id },
      data: validatedData,
    });
    revalidatePath('/dashboard/locations');
    return { success: true, location };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || 'Failed to update location' };
  }
}

export async function deleteLocation(id: string) {
  try {
    await requirePermission('locations', 'delete');

    await prisma.location.delete({
      where: { id },
    });
    revalidatePath('/dashboard/locations');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete location' };
  }
}

export async function getLocations() {
  try {
    await requirePermission('locations', 'read');

    const locations = await prisma.location.findMany({
      where: { isActive: true },
    });
    
    // Convert Decimal to number for client serialization
    const serializedLocations = locations.map(location => ({
      ...location,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      radiusMeters: Number(location.radiusMeters),
    }));
    
    return { success: true, locations: serializedLocations };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch locations' };
  }
}
