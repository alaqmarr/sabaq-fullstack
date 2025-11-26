'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function checkSetupRequired() {
  try {
    const superAdminExists = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
    });

    return { 
      success: true, 
      setupRequired: !superAdminExists 
    };
  } catch (error) {
    return { success: false, error: 'Failed to check setup status' };
  }
}

export async function createInitialSuperAdmin(data: {
  itsNumber: string;
  name: string;
  email?: string;
  phone?: string;
  password: string;
}) {
  try {
    // Double-check no SuperAdmin exists
    const superAdminExists = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
    });

    if (superAdminExists) {
      return { 
        success: false, 
        error: 'Setup already completed. A SuperAdmin account already exists.' 
      };
    }

    // Check if ITS number is already taken
    const existingUser = await prisma.user.findUnique({
      where: { itsNumber: data.itsNumber },
    });

    if (existingUser) {
      return { 
        success: false, 
        error: 'An account with this ITS Number already exists.' 
      };
    }

    // Create the SuperAdmin account
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const user = await prisma.user.create({
      data: {
        id: data.itsNumber,
        itsNumber: data.itsNumber,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: 'SUPERADMIN',
      },
    });

    return { 
      success: true, 
      user,
      message: 'Initial SuperAdmin account created successfully!' 
    };
  } catch (error) {
    console.error('Setup error:', error);
    return { success: false, error: 'Failed to create SuperAdmin account' };
  }
}
