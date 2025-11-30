'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { UserIDCard } from './user-id-card';

interface MyIDDrawerProps {
    user: {
        name?: string | null;
        itsNumber?: string;
        role?: string;
        email?: string | null;
    };
    trigger?: React.ReactNode;
}

export function MyIDDrawer({ user, trigger }: MyIDDrawerProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <QrCode className="h-5 w-5" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-[20px] p-0 bg-transparent border-0 shadow-none">
                <div className="p-4 bg-background rounded-t-[20px] border-t">
                    <SheetHeader className="text-center mb-6">
                        <SheetTitle className="text-2xl font-bold lowercase">my id</SheetTitle>
                        <SheetDescription className="lowercase">
                            scan this qr code for attendance
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex justify-center pb-8">
                        <UserIDCard user={user} className="w-full max-w-sm shadow-none border" />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
