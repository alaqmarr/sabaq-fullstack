'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MyQRCode } from './my-qr-code';

export function UserQuickActions() {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 lowercase">quick actions</h2>
            <div className="flex flex-wrap gap-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="lg" variant="frosted-green" className="h-auto py-4 px-6 flex flex-col items-center gap-2">
                            <QrCode className="h-6 w-6" />
                            <span>my id card</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <MyQRCode />
                    </DialogContent>
                </Dialog>

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
