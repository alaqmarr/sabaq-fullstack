'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, QrCode } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { MyQRCode } from './my-qr-code';

export function UserQuickActions() {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 lowercase">quick actions</h2>
            <div className="flex flex-wrap gap-4">
                <Drawer>
                    <DrawerTrigger asChild>
                        <Button size="lg" variant="frosted-green" className="h-auto py-4 px-6 flex flex-col items-center gap-2">
                            <QrCode className="h-6 w-6" />
                            <span>my id card</span>
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <div className="mx-auto w-full max-w-sm">
                            <DrawerHeader>
                                <DrawerTitle className="text-center">My ID Card</DrawerTitle>
                                <DrawerDescription className="text-center">Show this QR code to mark your attendance</DrawerDescription>
                            </DrawerHeader>
                            <div className="p-4 pb-8 flex justify-center">
                                <MyQRCode />
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>

                <Button asChild variant="frosted-blue" size="lg" className="h-auto py-4 px-6">
                    <Link href="/dashboard/my-enrollments" className="flex flex-col items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        <span>my enrollments</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
}
