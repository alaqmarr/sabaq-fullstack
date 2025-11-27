'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrCodeRegionId = 'qr-reader';

    const startScanning = async () => {
        try {
            setError(null);

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the test stream

            setHasPermission(true);

            // Initialize scanner
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(qrCodeRegionId);
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                formatsToSupport: [
                    0,  // QR_CODE
                    8,  // CODE_128
                    7,  // CODE_39
                    13, // EAN_13
                    14, // EAN_8
                    16, // ITF
                    17, // CODE_93
                ],
            };

            await scannerRef.current.start(
                { facingMode: 'environment' }, // Use rear camera
                config,
                (decodedText) => {
                    // Success callback
                    onScan(decodedText);
                },
                (errorMessage) => {
                    // Error callback - only log, don't show to user unless critical
                    if (onError && !errorMessage.includes('NotFoundException')) {
                        onError(errorMessage);
                    }
                }
            );

            setIsScanning(true);
        } catch (err: any) {
            console.error('Camera error:', err);
            setHasPermission(false);
            setError(err.message || 'Failed to access camera. Please grant camera permissions.');
            if (onError) onError(err.message);
        }
    };

    const stopScanning = async () => {
        try {
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
                setIsScanning(false);
            }
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="space-y-4">
            {/* Scanner Container */}
            <div
                id={qrCodeRegionId}
                className="w-full min-h-[300px] bg-black rounded-lg overflow-hidden"
            />

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <CameraOff className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Permission Request */}
            {hasPermission === false && (
                <Alert>
                    <Camera className="h-4 w-4" />
                    <AlertDescription>
                        Camera access is required to scan QR codes. Please enable camera permissions in your browser settings.
                    </AlertDescription>
                </Alert>
            )}

            {/* Control Button */}
            <div className="flex justify-center">
                {!isScanning ? (
                    <Button onClick={startScanning} className="gap-2" size="lg">
                        <Camera className="h-5 w-5" />
                        Start Scanner
                    </Button>
                ) : (
                    <Button onClick={stopScanning} variant="destructive" className="gap-2" size="lg">
                        <CameraOff className="h-5 w-5" />
                        Stop Scanner
                    </Button>
                )}
            </div>

            {/* Instructions */}
            {isScanning && (
                <p className="text-center text-sm text-muted-foreground animate-pulse">
                    Scanning... Point camera at QR code or barcode
                </p>
            )}
        </div>
    );
}
