'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRCodeDisplayProps {
    sessionId: string;
    sabaqName: string;
}

export function QRCodeDisplay({ sessionId, sabaqName }: QRCodeDisplayProps) {
    // The QR code content is just the session ID for now.
    // In a real app, this might be a signed token or a URL.
    const qrContent = sessionId;

    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
                <CardTitle className="text-center">Scan to Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG
                        value={qrContent}
                        size={256}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                    {sabaqName}
                </p>
            </CardContent>
        </Card>
    );
}
