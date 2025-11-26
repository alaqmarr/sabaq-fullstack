'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from 'next-auth/react';

export function MyQRCode() {
    const { data: session } = useSession();
    const user = session?.user;

    if (!user) return null;

    return (
        <Card className="w-full max-w-sm mx-auto overflow-hidden bg-gradient-to-br from-background to-muted/50 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-primary">My ID Card</CardTitle>
                <CardDescription>Scan this code for attendance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pt-4 pb-8">
                <div className="p-4 bg-white rounded-xl shadow-inner border-2 border-dashed border-primary/20">
                    <QRCodeSVG
                        value={user.itsNumber || ''}
                        size={200}
                        level="H"
                        includeMargin={true}
                        className="rounded-lg"
                    />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-sm font-mono bg-muted px-3 py-1 rounded-full border">
                        ITS: {user.itsNumber}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
