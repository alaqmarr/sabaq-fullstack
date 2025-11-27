'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';

interface MyQRDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MyQRDialog({ open, onOpenChange }: MyQRDialogProps) {
    const { data: session } = useSession();

    if (!session?.user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>My QR Code</DialogTitle>
                    <DialogDescription>
                        Show this QR code to mark your attendance
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                        <QRCodeSVG
                            value={session.user.itsNumber || ''}
                            size={200}
                            level="H"
                            includeMargin
                        />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium">ITS Number</p>
                        <p className="text-2xl font-mono font-bold">{session.user.itsNumber}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
